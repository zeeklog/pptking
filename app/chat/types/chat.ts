import { nanoid } from "nanoid";

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  date: string;
  streaming?: boolean;
  isError?: boolean;
  model?: string;
  pinned?: boolean;
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;
  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;
  modelConfig: ModelConfig;
}



export interface ModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  sendMemory: boolean;
  historyMessageCount: number;
  compressMessageLengthThreshold: number;
  enableInjectSystemPrompts?: boolean;
  apiKey?: string;
}

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export const DEFAULT_TOPIC = "新对话";
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: "你好，我是PPTKing，一个专业的PPT设计助手。",
});

export function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,
    modelConfig: {
      model: "Qwen/Qwen2.5-72B-Instruct",
      temperature: 0.7,
      max_tokens: 4000,
      presence_penalty: 0,
      frequency_penalty: 0,
      sendMemory: true,
      historyMessageCount: 32,
      compressMessageLengthThreshold: 1000,
      enableInjectSystemPrompts: true,
    },
  };
}


