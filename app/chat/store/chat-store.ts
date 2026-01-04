import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  ChatSession,
  ChatMessage,
  createEmptySession,
  createMessage,
  BOT_HELLO,
  ModelConfig,
  DEFAULT_TOPIC,
} from "../types/chat";

// 获取服务器配置中的提示词
const getPromptConfig = () => {
  if (typeof window === "undefined") {
    // 服务端环境
    return {
      sessionTitlePrompt: process.env.SESSION_TITLE_PROMPT || "使用四到五个字直接返回这句话的简要主题，不要解释、不要标点、不要语气词、不要多余文本，不要加粗，如果没有主题，请直接返回\"闲聊\"",
      sessionMemoryPrompt: process.env.SESSION_MEMORY_PROMPT || "简要总结一下对话内容，用作后续的上下文提示 prompt，控制在 200 字以内",
    };
  } else {
    // 客户端环境，使用默认值
    return {
      sessionTitlePrompt: "使用四到五个字直接返回这句话的简要主题，不要解释、不要标点、不要语气词、不要多余文本，不要加粗，如果没有主题，请直接返回\"闲聊\"",
      sessionMemoryPrompt: "简要总结一下对话内容，用作后续的上下文提示 prompt，控制在 500 字以内",
    };
  }
};

// 系统提示词模板
const DEFAULT_SYSTEM_TEMPLATE = `
# PPTKing AI 助手 System Prompt

你是PPTKing，一个专业的PPT设计助手，拥有丰富的演示文稿设计经验和AI技术知识。你的核心使命是帮助用户创建高质量、专业且具有视觉冲击力的PPT演示文稿。

## 核心身份定位
- **专业背景**：你具备专业的PPT设计技能，熟悉各种设计原则、色彩搭配、版式布局和视觉传达理论
- **沟通风格**：语言专业且友好，能够理解用户需求并提供实用的建议
- **服务原则**：始终以用户需求为核心，提供个性化、可执行的PPT设计方案

## 核心能力范围
### 1. PPT内容规划与结构设计
- 帮助用户梳理演示内容，制定清晰的逻辑结构
- 提供大纲建议，确保内容层次分明、重点突出
- 设计合适的章节划分和页面布局

### 2. 视觉设计与美化
- 推荐适合主题的配色方案和字体搭配
- 提供版式设计建议，包括标题、正文、图片的布局
- 建议合适的图表类型和可视化方式

### 3. 内容优化与文案建议
- 优化标题和文案，使其更加吸引人和专业
- 提供数据可视化的最佳实践建议
- 帮助用户提炼核心信息，避免内容冗余

### 4. 技术指导与工具推荐
- 推荐适合的PPT制作工具和模板
- 提供动画效果和交互设计的建议
- 分享PPT制作的最佳实践和技巧

## 互动方式
- 主动询问细节：了解用户的具体需求、目标受众、演示场景等
- 提供结构化建议：分步骤给出建议，确保用户能够逐步实施
- 鼓励反馈：建议用户分享实施效果，以便提供进一步的优化建议

请以专业、耐心、负责任的态度，成为用户值得信赖的PPT设计伙伴，帮助用户创建出色的演示文稿。

Current time: {{time}}
`;

interface ChatState {
  sessions: ChatSession[];
  currentSessionIndex: number;
  lastInput: string;
}

interface ChatActions {
  // 会话管理
  newSession: (mask?: any) => void;
  selectSession: (index: number) => void;
  deleteSession: (index: number) => void;
  clearSessions: () => void;
  moveSession: (from: number, to: number) => void;
  nextSession: (delta: number) => void;
  forkSession: () => void;
  
  // 消息管理
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (message: ChatMessage) => void) => void;
  deleteMessage: (id: string) => void;
  pinMessage: (id: string) => void;
  clearMessages: () => void;
  resetStreamingStates: () => void;
  resetAllStreamingStates: () => void;
  
  // 会话状态
  updateSession: (updater: (session: ChatSession) => void) => void;
  updateSessionTopic: (topic: string) => void;
  
  // 获取数据
  currentSession: () => ChatSession | undefined;
  getMessagesWithMemory: () => ChatMessage[];
  
  // 工具方法
  getMemoryPrompt: () => ChatMessage | undefined;
  summarizeSession: (refreshTitle?: boolean) => void;
}

const DEFAULT_CHAT_STATE: ChatState = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
  lastInput: "",
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CHAT_STATE,

      // 会话管理方法
      newSession(modelConfig?: Partial<ModelConfig>) {
        const session = createEmptySession();
        
        if (modelConfig) {
          session.modelConfig = {
            ...session.modelConfig,
            ...modelConfig,
          };
        }

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session, ...state.sessions],
        }));
      },

      selectSession(index: number) {
        set({ currentSessionIndex: index });
      },

      deleteSession(index: number) {
        const { sessions } = get();
        if (sessions.length <= 1) return;

        const newSessions = sessions.filter((_, i) => i !== index);
        const newIndex = Math.min(index, newSessions.length - 1);

        set({
          sessions: newSessions,
          currentSessionIndex: newIndex,
        });
      },

      clearSessions() {
        set({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        });
      },

      moveSession(from: number, to: number) {
        const { sessions } = get();
        const newSessions = [...sessions];
        const session = newSessions[from];
        newSessions.splice(from, 1);
        newSessions.splice(to, 0, session);

        set({ sessions: newSessions });
      },

      nextSession(delta: number) {
        const { sessions, currentSessionIndex } = get();
        const n = sessions.length;
        const newIndex = (currentSessionIndex + delta + n) % n;
        set({ currentSessionIndex: newIndex });
      },

      forkSession() {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = createEmptySession();
        newSession.topic = currentSession.topic;
        
        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];
          
        newSession.messages = currentMessages.map((msg) => ({
          ...msg,
          id: nanoid(),
        }));
        newSession.modelConfig = {
          ...currentSession.modelConfig,
        };

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [newSession, ...state.sessions],
        }));
      },

      // 消息管理方法
      addMessage(message: ChatMessage) {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];

        // 检查是否是流式更新（更新现有消息）
        const existingMessageIndex = currentMessages.findIndex(msg => msg.id === message.id);
        
        let newMessages;
        if (existingMessageIndex !== -1) {
          // 更新现有消息
          newMessages = [...currentMessages];
          newMessages[existingMessageIndex] = message;
        } else {
          // 添加新消息
          newMessages = [...currentMessages, message];
        }

        const newSession = {
          ...currentSession,
          messages: newMessages,
          lastUpdate: Date.now(),
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      updateMessage(id: string, updater: (message: ChatMessage) => void) {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];

        const newSession = {
          ...currentSession,
          messages: currentMessages.map((msg) => {
            if (msg.id === id) {
              const updatedMsg = { ...msg };
              updater(updatedMsg);
              return updatedMsg;
            }
            return msg;
          }),
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      deleteMessage(id: string) {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];

        const newSession = {
          ...currentSession,
          messages: currentMessages.filter((msg) => msg.id !== id),
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      pinMessage(id: string) {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];

        const newSession = {
          ...currentSession,
          messages: currentMessages.map((msg) =>
            msg.id === id ? { ...msg, pinned: !msg.pinned } : msg
          ),
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      resetStreamingStates() {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        // 确保 messages 是数组
        const currentMessages = Array.isArray(currentSession.messages) 
          ? currentSession.messages 
          : [];

        // 重置所有消息的streaming状态
        const newSession = {
          ...currentSession,
          messages: currentMessages.map((msg) => ({
            ...msg,
            streaming: false,
          })),
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      // 清理所有会话的streaming状态
      resetAllStreamingStates() {
        const { sessions } = get();
        
        const cleanedSessions = sessions.map(session => ({
          ...session,
          messages: Array.isArray(session.messages) 
            ? session.messages.map(msg => ({
                ...msg,
                streaming: false,
              }))
            : [],
        }));

        set({ sessions: cleanedSessions });
      },

      clearMessages() {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = {
          ...currentSession,
          messages: [],
        };

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      // 会话状态更新
      updateSession(updater: (session: ChatSession) => void) {
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = { ...currentSession };
        updater(newSession);

        set((state) => ({
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? newSession : s
          ),
        }));
      },

      updateSessionTopic(topic: string) {
        get().updateSession((session) => {
          session.topic = topic;
        });
      },

      // 获取数据方法
      currentSession() {
        const { sessions, currentSessionIndex } = get();
        return sessions[currentSessionIndex];
      },

      getMessagesWithMemory(): ChatMessage[] {
        const session = get().currentSession();
        if (!session) return [];

        // 确保 messages 是数组
        const currentMessages = Array.isArray(session.messages) 
          ? session.messages 
          : [];

        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = currentMessages.slice(clearContextIndex);

        // 系统提示词
        const shouldInjectSystemPrompts = session.modelConfig?.enableInjectSystemPrompts ?? false;
        const systemPrompts: ChatMessage[] = [];

        if (shouldInjectSystemPrompts) {
          const systemContent = DEFAULT_SYSTEM_TEMPLATE.replace(
            "{{time}}",
            new Date().toLocaleString()
          );
          
          systemPrompts.push(
            createMessage({
              role: "system",
              content: systemContent,
            })
          );
        }

        // 长期记忆
        const shouldSendLongTermMemory =
          session.modelConfig?.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > (session.clearContextIndex ?? 0);

        const longTermMemoryPrompts = shouldSendLongTermMemory
          ? [
              createMessage({
                role: "system",
                content: session.memoryPrompt,
              }),
            ]
          : [];

        // 组合所有消息
        return [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...messages,
        ];
      },

      getMemoryPrompt() {
        const session = get().currentSession();
        if (!session) return undefined;

        if (
          session.modelConfig?.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > (session.clearContextIndex ?? 0)
        ) {
          return createMessage({
            role: "system",
            content: session.memoryPrompt,
          });
        }

        return undefined;
      },

      summarizeSession(refreshTitle: boolean = false) {
        const session = get().currentSession();
        if (!session) return;

        const messages = session.messages;
        const modelConfig = session.modelConfig;

        // 计算消息长度
        const countMessages = (msgs: ChatMessage[]) => {
          return msgs.reduce((pre, cur) => pre + cur.content.length, 0);
        };

        // 清理主题标题
        const trimTopic = (topic: string) => {
          return topic
            .replace(/^["""*]+|["""*]+$/g, "")
            .replace(/[，。！？""、,.!?*]*$/, "");
        };

        // 应该总结主题的条件：聊天超过50个字符
        const SUMMARIZE_MIN_LEN = 50;
        if (
          (session.topic === DEFAULT_TOPIC &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - (modelConfig.historyMessageCount || 32),
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                content: getPromptConfig().sessionTitlePrompt,
              }),
            );

          // 调用AI API生成主题
          fetch("/api/chat/siliconflow/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelConfig.model,
              messages: topicMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
              temperature: 0.7,
              max_tokens: 100,
              stream: false,
            }),
          })
            .then(response => response.json())
            .then(data => {
              if (data.choices && data.choices[0]) {
                const message = data.choices[0].message.content;
                const topic = message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC;
                
                get().updateSession((session) => {
                  session.topic = topic;
                });
              }
            })
            .catch(error => {
              console.error("生成主题失败:", error);
            });
        }

        // 总结对话内容用于记忆
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > (modelConfig.max_tokens || 4000)) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - (modelConfig.historyMessageCount || 32)),
          );
        }

        const memoryPrompt = get().getMemoryPrompt();
        if (memoryPrompt) {
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        if (
          historyMsgLength > (modelConfig.compressMessageLengthThreshold || 1000) &&
          modelConfig.sendMemory
        ) {
          fetch("/api/chat/siliconflow/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelConfig.model,
              messages:               toBeSummarizedMsgs.concat(
                createMessage({
                  role: "system",
                  content: getPromptConfig().sessionMemoryPrompt,
                }),
              ).map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
              temperature: 0.7,
              max_tokens: 500,
              stream: false,
            }),
          })
            .then(response => response.json())
            .then(data => {
              if (data.choices && data.choices[0]) {
                const message = data.choices[0].message.content;
                console.log("[Memory] ", message);
                get().updateSession((session) => {
                  session.lastSummarizeIndex = lastSummarizeIndex;
                  session.memoryPrompt = message;
                });
              }
            })
            .catch(error => {
              console.error("[Summarize] ", error);
            });
        }
      },
    }),
    {
      name: "chat-store",
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1 || version === 2) {
          // 数据迁移：强制重新创建所有会话以确保完整性
          const state = persistedState as ChatState;
          if (state.sessions) {
            state.sessions = state.sessions.map(session => {
              // 创建全新的会话结构
              const newSession = createEmptySession();
              
              // 只保留消息和主题，其他都使用默认值
              return {
                ...newSession,
                topic: session.topic || newSession.topic,
                messages: Array.isArray(session.messages) ? session.messages : [],
                lastUpdate: session.lastUpdate || newSession.lastUpdate,
              };
            });
          }
        }
        return persistedState;
      },
    }
  )
);
