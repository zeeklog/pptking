'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageRenderer } from './MessageRenderer';
import { cn } from '@/lib/utils';
import { MessageCircle, Sparkles, Brain } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  fontSize?: number;
  fontFamily?: string;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  className?: string;
  autoScroll?: boolean;
}

export function MessageList({
  messages,
  fontSize = 14,
  fontFamily = 'inherit',
  onEdit,
  onDelete,
  onRetry,
  onPin,
  className,
  autoScroll = true,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // 滚动到指定消息
  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto space-y-4 p-4',
        'bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30',
        'dark:from-purple-900/20 dark:via-tech-800 dark:to-purple-900/10',
        'scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-600',
        'scrollbar-track-purple-100/50 dark:scrollbar-track-purple-900/30',
        'hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-500',
        'transition-all duration-300',
        className
      )}
    >
      {/* AI科技感背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-300/20 dark:bg-purple-700/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-400/15 dark:bg-purple-600/15 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLastMessage = index === messages.length - 1;
        
        return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={cn(
              'transition-all duration-500 ease-out',
              isLastMessage && 'animate-in fade-in-50 slide-in-from-bottom-4'
            )}
          >
            <MessageRenderer
              message={message}
              isUser={isUser}
              fontSize={fontSize}
              fontFamily={fontFamily}
              onEdit={onEdit}
              onDelete={onDelete}
              onRetry={onRetry}
              onPin={onPin}
            />
          </div>
        );
      })}
      
      {/* 空状态 */}
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-[400px] relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/30 dark:from-purple-900/20 dark:to-blue-900/10 rounded-2xl"></div>
          
          <div className="text-center space-y-6 relative z-10">
            {/* 主图标 */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-purple-lg animate-bounce-in">
                <Brain className="w-12 h-12 text-white" />
              </div>
              
              {/* 装饰元素 */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-300 dark:bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 dark:bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            {/* 文字内容 */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-tech-700 dark:text-tech-200">
                开始AI对话
              </h3>
              <p className="text-tech-600 dark:text-tech-300 max-w-md mx-auto">
                发送消息开始与AI助手对话，体验智能PPT生成和创意写作服务
              </p>
            </div>
            
            {/* 功能提示 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="flex items-center space-x-2 p-3 rounded-lgborder-purple-200 dark:border-purple-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-tech-600 dark:text-tech-300">智能PPT生成</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lgborder-purple-200 dark:border-purple-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-tech-600 dark:text-tech-300">创意写作</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lgborder-purple-200 dark:border-purple-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-tech-600 dark:text-tech-300">实时对话</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
