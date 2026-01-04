'use client';

import { useState } from 'react';
import { ChatMessage, MessageAction, ToolCall } from '@/types/chat';
import { 
  getMessageTextContent, 
  getMessageMultimedia, 
  hasToolCalls, 
  getToolCallStats,
  isAgentMessage,
  getAgentTypeIcon,
  getAgentTypeColor,
  getPriorityColor,
  getStatusIcon,
  getStatusColor,
  sanitizeText
} from '@/lib/message-utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallRenderer } from './ToolCallRenderer';
import { MultimediaRenderer } from './MultimediaRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Pin,
  Bookmark,
  Share,
  Download,
  User,
  Bot,
  Settings,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  Zap,
  Brain
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  message: ChatMessage;
  isUser: boolean;
  fontSize?: number;
  fontFamily?: string;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onBookmark?: (messageId: string) => void;
  onShare?: (messageId: string) => void;
  onExport?: (messageId: string) => void;
  onToolCallRetry?: (toolCallId: string) => void;
  onToolCallCancel?: (toolCallId: string) => void;
  onToolCallViewResult?: (toolCallId: string) => void;
  className?: string;
  // 新增：简化模式，用于在主聊天界面中使用
  simple?: boolean;
}

export function MessageRenderer({
  message,
  isUser,
  fontSize = 14,
  fontFamily = 'inherit',
  onEdit,
  onDelete,
  onRetry,
  onPin,
  onBookmark,
  onShare,
  onExport,
  onToolCallRetry,
  onToolCallCancel,
  onToolCallViewResult,
  className,
  simple = false,
}: MessageRendererProps) {
  
  const multimedia = getMessageMultimedia(message);
  const textContent = getMessageTextContent(message);
  const sanitizedContent = sanitizeText(textContent);
  const isAgent = isAgentMessage(message);
  const hasTools = hasToolCalls(message);
  const toolStats = hasTools ? getToolCallStats(message.tool_calls!) : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizedContent);
      // 可以添加toast提示
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const getAvatarContent = () => {
    if (isUser) {
      return <User className="w-4 h-4" />;
    }
    if (isAgent && message.agent_type) {
      return <span className="text-lg">{getAgentTypeIcon(message.agent_type)}</span>;
    }
    return <Brain className="w-4 h-4" />;
  };

  const getAvatarFallback = () => {
    if (isUser) return 'U';
    if (isAgent && message.agent_name) return message.agent_name.charAt(0).toUpperCase();
    return 'AI';
  };

  const getAvatarBackground = () => {
    if (isUser) return 'bg-gradient-primary text-white';
    if (isAgent && message.agent_type) {
      return cn('text-white bg-gradient-primary', getAgentTypeColor(message.agent_type));
    }
    return 'bg-gradient-primary text-white';
  };

  const getMessageTitle = () => {
    if (isUser) return '用户';
    if (isAgent && message.agent_name) return message.agent_name;
    return 'AI 助手';
  };

  const getMessageSubtitle = () => {
    if (message.agent_description) return message.agent_description;
    return null;
  };

  // 简化模式：只渲染内容，不包含外层布局
  if (simple) {
    return (
      <div className="space-y-4">
        {/* Markdown 内容 */}
        <div className="bg-white dark:bg-tech-800 rounded-lg shadow-purple-sm">
          <MarkdownRenderer
            content={sanitizedContent}
            loading={message.streaming}
            fontSize={fontSize}
            fontFamily={fontFamily}
            onDoubleClick={handleCopy}
          />
        </div>

        {/* 多媒体内容 */}
        {(multimedia.images.length > 0 || 
          multimedia.audios.length > 0 || 
          multimedia.videos.length > 0 || 
          multimedia.files.length > 0 || 
          multimedia.codeBlocks.length > 0 || 
          multimedia.data.length > 0) && (
          <div className="bg-white dark:bg-tech-800 rounded-lg shadow-purple-sm">
            <MultimediaRenderer
              images={multimedia.images}
              audios={multimedia.audios}
              videos={multimedia.videos}
              files={multimedia.files}
              codeBlocks={multimedia.codeBlocks}
              data={multimedia.data}
            />
          </div>
        )}

        {/* 工具调用状态 */}
        {hasTools && toolStats && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg shadow-purple-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-tech-700 dark:text-tech-200">
                  工具调用状态
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs border-purple-200 dark:border-purple-700',
                    toolStats.completed > 0 ? 'text-success-600 dark:text-success-400 border-success-200 dark:border-success-700' : '',
                    toolStats.failed > 0 ? 'text-error-600 dark:text-error-400 border-error-200 dark:border-error-700' : '',
                    toolStats.pending > 0 ? 'text-warning-600 dark:text-warning-400 border-warning-200 dark:border-warning-700' : ''
                  )}
                >
                  {toolStats.completed > 0 && `${toolStats.completed} 完成`}
                  {toolStats.failed > 0 && `${toolStats.failed} 失败`}
                  {toolStats.pending > 0 && `${toolStats.pending} 进行中`}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              {message.tool_calls?.map((toolCall) => (
                <ToolCallRenderer
                  key={toolCall.id}
                  toolCall={toolCall}
                  onRetry={() => onToolCallRetry?.(toolCall.id)}
                  onCancel={() => onToolCallCancel?.(toolCall.id)}
                  onViewResult={() => onToolCallViewResult?.(toolCall.id)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 完整模式：包含所有布局元素
  return (
    <div
      className={cn(
        'group relative flex gap-4 p-6 transition-all duration-300',
        'hover:bg-purple-50/50 dark:hover:bg-purple-900/20',
        'rounded-xl',
        'hover:shadow-purple-md dark:hover:shadow-purple-lg',
        message.priority && message.priority !== 'normal' && 'border-l-4',
        message.priority === 'high' && 'border-l-warning-500',
        message.priority === 'urgent' && 'border-l-error-500',
        className
      )}
    >
      {/* AI科技感装饰元素 */}
      {!isUser && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary rounded-t-xl opacity-20"></div>
      )}
      
      {/* 头像 */}
      <Avatar className="w-10 h-10 flex-shrink-0 shadow-purple-sm hover:shadow-purple-md transition-all duration-300">
        <AvatarImage src={message.agent_avatar || (isUser ? undefined : '/bot-avatar.png')} />
        <AvatarFallback className={cn(getAvatarBackground(), 'font-semibold')}>
          {getAvatarContent()}
        </AvatarFallback>
      </Avatar>

      {/* 消息内容 */}
      <div className="flex-1 min-w-0">
        {/* 消息头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-tech-700 dark:text-tech-200">
                {getMessageTitle()}
              </span>
              
              {/* AI标识 */}
              {!isUser && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI</span>
                </div>
              )}
            </div>
            
            {/* 消息状态 */}
            {message.status && message.status !== 'completed' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs">{getStatusIcon(message.status)}</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs border-purple-200 dark:border-purple-700',
                    getStatusColor(message.status)
                  )}
                >
                  {message.status}
                </Badge>
              </div>
            )}

            {/* 优先级标签 */}
            {message.priority && message.priority !== 'normal' && (
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs border-warning-200 dark:border-warning-700',
                  getPriorityColor(message.priority)
                )}
              >
                {message.priority === 'high' ? '高优先级' : '紧急'}
              </Badge>
            )}

            {/* 标签 */}
            {message.tags && message.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                {message.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                  >
                    {tag}
                  </Badge>
                ))}
                {message.tags.length > 3 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                  >
                    +{message.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 消息元数据 */}
            <div className="flex items-center space-x-3 text-xs text-tech-500 dark:text-tech-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(message.date).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1">
              <CopyButton
                text={sanitizedContent}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-800/50"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-800/50"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-tech-800 border border-purple-200 dark:border-purple-700 shadow-purple-lg"
                >
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </DropdownMenuItem>
                  )}
                  
                  {onPin && (
                    <DropdownMenuItem
                      onClick={() => onPin(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      固定
                    </DropdownMenuItem>
                  )}
                  
                  {onBookmark && (
                    <DropdownMenuItem
                      onClick={() => onBookmark(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      收藏
                    </DropdownMenuItem>
                  )}
                  
                  {onShare && (
                    <DropdownMenuItem
                      onClick={() => onShare(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      分享
                    </DropdownMenuItem>
                  )}
                  
                  {onExport && (
                    <DropdownMenuItem
                      onClick={() => onExport(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </DropdownMenuItem>
                  )}
                  
                  {(onEdit || onPin || onBookmark || onShare || onExport) && (
                    <DropdownMenuSeparator className="bg-purple-200 dark:bg-purple-700" />
                  )}
                  
                  {onRetry && !isUser && (
                    <DropdownMenuItem
                      onClick={() => onRetry(message.id)}
                      className="text-tech-700 dark:text-tech-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新生成
                    </DropdownMenuItem>
                  )}
                  
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(message.id)}
                      className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 消息副标题 */}
        {getMessageSubtitle() && (
          <p className="text-xs text-tech-500 dark:text-tech-400 mb-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            {getMessageSubtitle()}
          </p>
        )}

        {/* 消息正文 */}
        <div className="space-y-4">
          {/* Markdown 内容 */}
          <div className="bg-white dark:bg-tech-800 rounded-lg shadow-purple-sm">
            <MarkdownRenderer
              content={sanitizedContent}
              loading={message.streaming}
              fontSize={fontSize}
              fontFamily={fontFamily}
              onDoubleClick={handleCopy}
            />
          </div>

          {/* 多媒体内容 */}
          {(multimedia.images.length > 0 || 
            multimedia.audios.length > 0 || 
            multimedia.videos.length > 0 || 
            multimedia.files.length > 0 || 
            multimedia.codeBlocks.length > 0 || 
            multimedia.data.length > 0) && (
            <div className="bg-white dark:bg-tech-800 rounded-lg shadow-purple-sm">
              <MultimediaRenderer
                images={multimedia.images}
                audios={multimedia.audios}
                videos={multimedia.videos}
                files={multimedia.files}
                codeBlocks={multimedia.codeBlocks}
                data={multimedia.data}
              />
            </div>
          )}

          {/* 工具调用状态 */}
          {hasTools && toolStats && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg shadow-purple-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-tech-700 dark:text-tech-200">
                    工具调用状态
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs border-purple-200 dark:border-purple-700',
                      toolStats.completed > 0 ? 'text-success-600 dark:text-success-400 border-success-200 dark:border-success-700' : '',
                      toolStats.failed > 0 ? 'text-error-600 dark:text-error-400 border-error-200 dark:border-error-700' : '',
                      toolStats.pending > 0 ? 'text-warning-600 dark:text-warning-400 border-warning-200 dark:border-warning-700' : ''
                    )}
                  >
                    {toolStats.completed > 0 && `${toolStats.completed} 完成`}
                    {toolStats.failed > 0 && `${toolStats.failed} 失败`}
                    {toolStats.pending > 0 && `${toolStats.pending} 进行中`}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                {message.tool_calls?.map((toolCall) => (
                  <ToolCallRenderer
                    key={toolCall.id}
                    toolCall={toolCall}
                    onRetry={() => onToolCallRetry?.(toolCall.id)}
                    onCancel={() => onToolCallCancel?.(toolCall.id)}
                    onViewResult={() => onToolCallViewResult?.(toolCall.id)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
