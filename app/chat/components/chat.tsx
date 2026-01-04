"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, Loader2, Square } from "lucide-react";
import { useAppConfig } from "../store/config";
import { useChatStore } from "../store/chat-store";
import { ChatMessage, createMessage } from "../types/chat";
import { MessageRenderer } from "@/components/MessageRenderer";
import { MessageActions } from "./message-actions";
import { getMessageTextContent, getMessageImages } from "@/lib/message-utils";

// 获取错误信息的辅助函数
const getErrorMessage = (error: any, t: any): string => {
  if (error instanceof Error) {
    if (error.message.includes('HTTP error! status: 401')) {
      return t('chat.authFailed');
    } else if (error.message.includes('HTTP error! status: 403')) {
      return t('chat.accessDenied');
    } else if (error.message.includes('HTTP error! status: 429')) {
      return t('chat.tooManyRequests');
    } else if (error.message.includes('HTTP error! status: 500')) {
      return t('chat.serverError');
    } else if (error.message.includes('Failed to fetch')) {
      return t('chat.networkError');
    } else {
      return `${t('chat.requestFailed')}: ${error.message}`;
    }
  }
  return t('chat.unknownError');
};

export function Chat() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const config = useAppConfig();

  const {
    currentSession,
    addMessage,
    updateMessage,
    getMessagesWithMemory,
    updateSessionTopic,
    summarizeSession,
    deleteMessage,
    pinMessage,
    resetStreamingStates,
    resetAllStreamingStates,
  } = useChatStore();

  const session = currentSession();
  const messages = session?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 组件加载时清理所有会话的streaming状态
  useEffect(() => {
    resetAllStreamingStates();
  }, [resetAllStreamingStates]);

  // 会话切换时清理streaming状态
  useEffect(() => {
    if (session) {
      resetStreamingStates();
    }
  }, [session?.id, resetStreamingStates]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !session) return;

    const userMessage = createMessage({
      role: "user",
      content: inputValue,
    });

    addMessage(userMessage);
    setInputValue("");
    setIsLoading(true);

    // 创建空的助手消息用于流式更新
    const assistantMessage = createMessage({
      role: "assistant",
      content: "",
      streaming: true,
    });
    addMessage(assistantMessage);
    
    // 流式响应开始，隐藏主界面的加载状态
    setIsLoading(false);

    try {
      // 检查session和modelConfig是否存在
      if (!session) {
        throw new Error(t('chat.error.sessionError'));
      }

      // 临时修复：如果session没有modelConfig，创建一个
      if (!session.modelConfig) {
        console.error(t('chat.sessionData', '会话数据:'), session);
        console.log(t('chat.fixingSessionConfig', '正在修复会话配置...'));

        // 导入createEmptySession来获取默认配置
        const { createEmptySession } = await import("../types/chat");
        const defaultConfig = createEmptySession().modelConfig;

        // 更新会话的modelConfig
        session.modelConfig = defaultConfig;
      }

      // 根据模型选择API端点
      const isSiliconFlow = session.modelConfig.model.includes("Qwen/Qwen2.5-72B-Instruct");
      const apiEndpoint = isSiliconFlow
        ? "/api/chat/siliconflow/v1/chat/completions"
        : "/api/chat/openai/v1/chat/completions";

      // 获取完整的消息历史（包括系统提示词）
      const messagesWithMemory = getMessagesWithMemory();

      // 调用AI API - 启用流式输出
      console.log(t('chat.sendingApiRequest', '发送API请求到:'), apiEndpoint);
      console.log(t('chat.requestParams', '请求参数:'), {
        model: session.modelConfig.model,
        stream: true,
        messages: messagesWithMemory.length
      });
      
      // 构建请求头 - 对于SiliconFlow，不在前端暴露API KEY
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // 只有当用户配置了API KEY且不是SiliconFlow时才发送Authorization头
      if (session.modelConfig.apiKey && !isSiliconFlow) {
        headers["Authorization"] = `Bearer ${session.modelConfig.apiKey}`;
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: session.modelConfig.model,
          messages: messagesWithMemory,
          stream: true,
          temperature: session.modelConfig.temperature,
          max_tokens: session.modelConfig.max_tokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      const isStreaming = 
        contentType?.includes("text/plain") || 
        response.headers.get("transfer-encoding") === "chunked";

      if (isStreaming) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error(t('chat.cannotReadResponseStream', '无法读取响应流'));
        }

        // 保存reader引用并设置流式状态
        currentReaderRef.current = reader;
        setIsStreaming(true);

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    updateMessage(assistantMessage.id, (msg) => {
                      msg.content += content;
                    });
                  }
                } catch (e) {
                  console.warn(t('chat.parseStreamDataFailed', '解析流数据失败:'), e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          currentReaderRef.current = null;
          setIsStreaming(false);
        }

        // 流式响应完成，更新消息状态
        updateMessage(assistantMessage.id, (msg) => {
          msg.streaming = false;
        });

        // AI回复完成后，触发会话总结
        summarizeSession();

      } else {
        // 非流式响应处理
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          const content = data.choices[0].message.content;
          updateMessage(assistantMessage.id, (msg) => {
            msg.content = content;
            msg.streaming = false;
          });
        }

        // AI回复完成后，触发会话总结
        summarizeSession();
      }

    } catch (error) {
      console.error(t('chat.sendMessageFailed'), error);
      
      // 更新消息内容为错误信息
      updateMessage(assistantMessage.id, (msg) => {
        msg.content = getErrorMessage(error, t);
        msg.streaming = false;
        msg.isError = true; // 标记为错误消息
      });
    } finally {
      // 确保加载状态被重置
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStopGeneration = () => {
    if (currentReaderRef.current) {
      currentReaderRef.current.cancel();
      currentReaderRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
            )}

            <Card className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 shadow-sm border-0 bg-white dark:bg-[#1F2937]`}>
              <div className="text-gray-900 dark:text-white">
                <MessageRenderer
                  message={message}
                  isUser={message.role === "user"}
                  fontSize={14}
                  simple={true}
                  onEdit={(messageId) => {
                    // 编辑逻辑
                    console.log(t('chat.messageActions.edit'), messageId);
                  }}
                  onDelete={(messageId) => {
                    // 删除逻辑
                    console.log(t('chat.messageActions.delete'), messageId);
                  }}
                  onRetry={(messageId) => {
                    // 重试逻辑
                    console.log(t('chat.messageActions.retry'), messageId);
                  }}
                  onPin={(messageId) => {
                    // 固定逻辑
                    console.log(t('chat.messageActions.pin'), messageId);
                  }}
                />
              </div>

              {/* 消息底部：时间和操作按钮 */}
              <div className="flex items-center justify-between mt-3">
                <p className={`text-xs ${
                  "text-[#9CA3AF] dark:text-[#6B7280]"
                }`}>
                  {new Date(message.date).toLocaleTimeString()}
                </p>
                
                {/* 消息操作按钮 */}
                <div className="flex items-center gap-1">
                  <MessageActions
                    message={message}
                    isStreaming={message.streaming}
                    onRetry={() => {
                      // 重试逻辑：重新发送上一条用户消息
                      if (message.role === "assistant") {
                        // 找到当前消息的上一条用户消息
                        const currentIndex = messages.findIndex(msg => msg.id === message.id);
                        if (currentIndex > 0) {
                          const previousMessage = messages[currentIndex - 1];
                          if (previousMessage.role === "user") {
                            // 删除当前助手消息
                            deleteMessage(message.id);
                            // 删除上一条用户消息
                            deleteMessage(previousMessage.id);
                            // 设置输入框内容为上一条用户消息
                            setInputValue(previousMessage.content);
                            // 自动发送消息
                            setTimeout(() => {
                              sendMessage();
                            }, 100);
                          }
                        }
                      }
                    }}
                    onDelete={() => {
                      // 删除逻辑
                      deleteMessage(message.id);
                    }}
                    onPin={() => {
                      // 固定逻辑
                      pinMessage(message.id);
                    }}
                  />
                </div>
              </div>
            </Card>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarFallback className="bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}

        {isLoading && !messages.some(msg => msg.streaming) && (
          <div className="flex gap-2 sm:gap-4 justify-start">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </AvatarFallback>
            </Avatar>
            <Card className="max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 bg-white dark:bg-[#1F2937] shadow-sm border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF] ml-2">{t('chat.thinking')}</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 sm:p-4 border-t border-[#C7D2FE] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm">
        <div className="relative">
          {/* 输入框容器 */}
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.inputPlaceholder')}
              disabled={isLoading || isStreaming}
              className="w-full min-h-[50px] sm:min-h-[60px] max-h-[200px] px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 resize-none rounded-xl bg-white dark:bg-[#374151] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 transition-all duration-200 relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: `
                  linear-gradient(white, white), 
                  linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)
                `,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}
            />
            
            {/* 悬浮按钮 - 位于输入框右侧中间位置 */}
            <div className="absolute top-1/2 right-1 sm:right-2 transform -translate-y-1/2">
              {isStreaming ? (
                // 流式传输时显示中断按钮
                <Button
                  onClick={handleStopGeneration}
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  title={t('chat.stopGeneration', '停止生成')}
                >
                  <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                // 非流式传输时显示发送按钮
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
                    isLoading || !inputValue.trim()
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#EC4899] text-white'
                  }`}
                  title={t('chat.sendMessage', '发送消息')}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* 快捷键提示 */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {t('chat.sendMessageShortcut')}
          </p>
        </div>
      </div>
    </div>
  );
}
