import { ChatMessage, MultimodalContent, ToolCall, AgentType } from '@/types/chat';

/**
 * 从消息中提取文本内容
 */
export function getMessageTextContent(message: ChatMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    const textParts: string[] = [];
    for (const c of message.content) {
      if (c.type === "text" && c.text) {
        textParts.push(c.text);
      }
    }
    return textParts.join('\n');
  }
  
  return "";
}

/**
 * 从消息中提取文本内容（排除思考内容）
 */
export function getMessageTextContentWithoutThinking(message: ChatMessage): string {
  let content = getMessageTextContent(message);

  // 过滤掉思考行（以 "> " 开头）
  return content
    .split("\n")
    .filter((line) => !line.startsWith("> ") && line.trim() !== "")
    .join("\n")
    .trim();
}

/**
 * 从消息中提取图片URL
 */
export function getMessageImages(message: ChatMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  
  if (!Array.isArray(message.content)) {
    return [];
  }
  
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url" && c.image_url?.url) {
      urls.push(c.image_url.url);
    }
  }
  return urls;
}

/**
 * 从消息中提取音频URL
 */
export function getMessageAudios(message: ChatMessage): Array<{url: string; duration?: number; format?: string}> {
  if (typeof message.content === "string" || !Array.isArray(message.content)) {
    return [];
  }
  
  const audios: Array<{url: string; duration?: number; format?: string}> = [];
  for (const c of message.content) {
    if (c.type === "audio_url" && c.audio_url?.url) {
      audios.push({
        url: c.audio_url.url,
        duration: c.audio_url.duration,
        format: c.audio_url.format,
      });
    }
  }
  return audios;
}

/**
 * 从消息中提取视频URL
 */
export function getMessageVideos(message: ChatMessage): Array<{url: string; duration?: number; format?: string; thumbnail?: string}> {
  if (typeof message.content === "string" || !Array.isArray(message.content)) {
    return [];
  }
  
  const videos: Array<{url: string; duration?: number; format?: string; thumbnail?: string}> = [];
  for (const c of message.content) {
    if (c.type === "video_url" && c.video_url?.url) {
      videos.push({
        url: c.video_url.url,
        duration: c.video_url.duration,
        format: c.video_url.format,
        thumbnail: c.video_url.thumbnail,
      });
    }
  }
  return videos;
}

/**
 * 从消息中提取文件
 */
export function getMessageFiles(message: ChatMessage): Array<{url: string; filename: string; size?: number; mime_type?: string}> {
  if (typeof message.content === "string" || !Array.isArray(message.content)) {
    return [];
  }
  
  const files: Array<{url: string; filename: string; size?: number; mime_type?: string}> = [];
  for (const c of message.content) {
    if (c.type === "file_url" && c.file_url?.url) {
      files.push({
        url: c.file_url.url,
        filename: c.file_url.filename,
        size: c.file_url.size,
        mime_type: c.file_url.mime_type,
      });
    }
  }
  return files;
}

/**
 * 从消息中提取代码块
 */
export function getMessageCodeBlocks(message: ChatMessage): Array<{language: string; code: string; filename?: string}> {
  if (typeof message.content === "string" || !Array.isArray(message.content)) {
    return [];
  }
  
  const codeBlocks: Array<{language: string; code: string; filename?: string}> = [];
  for (const c of message.content) {
    if (c.type === "code" && c.code?.code) {
      codeBlocks.push({
        language: c.code.language,
        code: c.code.code,
        filename: c.code.filename,
      });
    }
  }
  return codeBlocks;
}

/**
 * 从消息中提取数据
 */
export function getMessageData(message: ChatMessage): Array<{format: string; content: string; schema?: any}> {
  if (typeof message.content === "string" || !Array.isArray(message.content)) {
    return [];
  }
  
  const data: Array<{format: string; content: string; schema?: any}> = [];
  for (const c of message.content) {
    if (c.type === "data" && c.data?.content) {
      data.push({
        format: c.data.format,
        content: c.data.content,
        schema: c.data.schema,
      });
    }
  }
  return data;
}

/**
 * 获取消息的所有多媒体内容
 */
export function getMessageMultimedia(message: ChatMessage): {
  images: string[];
  audios: Array<{url: string; duration?: number; format?: string}>;
  videos: Array<{url: string; duration?: number; format?: string; thumbnail?: string}>;
  files: Array<{url: string; filename: string; size?: number; mime_type?: string}>;
  codeBlocks: Array<{language: string; code: string; filename?: string}>;
  data: Array<{format: string; content: string; schema?: any}>;
} {
  return {
    images: getMessageImages(message),
    audios: getMessageAudios(message),
    videos: getMessageVideos(message),
    files: getMessageFiles(message),
    codeBlocks: getMessageCodeBlocks(message),
    data: getMessageData(message),
  };
}

/**
 * 检查消息是否包含工具调用
 */
export function hasToolCalls(message: ChatMessage): boolean {
  return message.tool_calls && message.tool_calls.length > 0;
}

/**
 * 获取工具调用的状态统计
 */
export function getToolCallStats(toolCalls: ToolCall[]): {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
} {
  const stats = {
    total: toolCalls.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };

  toolCalls.forEach(call => {
    switch (call.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'running':
        stats.running++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
    }
  });

  return stats;
}

/**
 * 检查是否为AI Agent消息
 */
export function isAgentMessage(message: ChatMessage): boolean {
  return message.role === 'agent' || !!message.agent_type;
}

/**
 * 获取Agent类型图标
 */
export function getAgentTypeIcon(agentType: AgentType): string {
  const iconMap: Record<AgentType, string> = {
    general: '🤖',
    code_assistant: '💻',
    data_analyst: '📊',
    designer: '🎨',
    writer: '✍️',
    translator: '🌐',
    researcher: '🔍',
    planner: '📋',
    executor: '⚡',
    reviewer: '👀',
    custom: '🔧',
  };
  return iconMap[agentType] || '🤖';
}

/**
 * 获取Agent类型颜色
 */
export function getAgentTypeColor(agentType: AgentType): string {
  const colorMap: Record<AgentType, string> = {
    general: 'bg-blue-500',
    code_assistant: 'bg-green-500',
    data_analyst: 'bg-purple-500',
    designer: 'bg-pink-500',
    writer: 'bg-yellow-500',
    translator: 'bg-indigo-500',
    researcher: 'bg-orange-500',
    planner: 'bg-teal-500',
    executor: 'bg-red-500',
    reviewer: 'bg-gray-500',
    custom: 'bg-slate-500',
  };
  return colorMap[agentType] || 'bg-blue-500';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * 转义数学公式中的括号
 */
export function escapeBrackets(text: string): string {
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

/**
 * 尝试包装HTML代码
 */
export function tryWrapHtmlCode(text: string): string {
  // 如果包含代码块，不处理
  if (text.includes("```")) {
    return text;
  }
  
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

/**
 * 处理消息内容，包括转义和HTML包装
 */
export function processMessageContent(content: string): string {
  return tryWrapHtmlCode(escapeBrackets(content));
}

/**
 * 计算消息的估计token长度
 */
export function estimateTokenLength(text: string): number {
  // 简单的token估算：中文字符算1个token，英文单词算1个token
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const otherChars = text.length - chineseChars - englishWords;
  
  return chineseChars + englishWords + Math.ceil(otherChars / 4);
}

/**
 * 检查是否为视觉模型
 */
export function isVisionModel(model: string): boolean {
  const visionModelPatterns = [
    /gpt-4-vision/i,
    /claude-3.*vision/i,
    /gemini.*vision/i,
    /qwen.*vision/i,
    /llava/i,
    /cogvlm/i,
    /instructblip/i,
  ];
  
  return visionModelPatterns.some(pattern => pattern.test(model));
}

/**
 * 检查是否为DALL-E 3模型
 */
export function isDalle3(model: string): boolean {
  return model.toLowerCase().includes("dall-e-3");
}

/**
 * 获取模型支持的图片尺寸
 */
export function getModelSizes(model: string): string[] {
  if (isDalle3(model)) {
    return ["1024x1024", "1792x1024", "1024x1792"];
  }
  if (model.toLowerCase().includes("cogview")) {
    return [
      "1024x1024",
      "768x1344",
      "864x1152",
      "1344x768",
      "1152x864",
      "1440x720",
      "720x1440",
    ];
  }
  return [];
}

/**
 * 检查消息是否包含敏感内容
 */
export function containsSensitiveContent(text: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /private[_-]?key/i,
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * 脱敏处理文本
 */
export function sanitizeText(text: string): string {
  if (!containsSensitiveContent(text)) {
    return text;
  }
  
  return text
    .replace(/(password\s*[:=]\s*)([^\s\n]+)/gi, '$1***')
    .replace(/(api[_-]?key\s*[:=]\s*)([^\s\n]+)/gi, '$1***')
    .replace(/(secret\s*[:=]\s*)([^\s\n]+)/gi, '$1***')
    .replace(/(token\s*[:=]\s*)([^\s\n]+)/gi, '$1***');
}

/**
 * 获取消息的优先级颜色
 */
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-foreground',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colorMap[priority] || 'text-foreground';
}

/**
 * 获取消息状态图标
 */
export function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
    retrying: '🔄',
  };
  return iconMap[status] || '📝';
}

/**
 * 获取消息状态颜色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-500',
    processing: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500',
    retrying: 'text-orange-500',
  };
  return colorMap[status] || 'text-foreground';
}
