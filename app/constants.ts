// API 路径常量
export const API_PATHS = {
  SiliconFlow: "/api/chat/siliconflow",
  OpenAI: "/api/chat/openai",
  Anthropic: "/api/chat/anthropic",
} as const;

// 基础URL常量
export const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn";
export const OPENAI_BASE_URL = "https://api.openai.com";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

// SiliconFlow 路径
export const SiliconFlow = {
  ExampleEndpoint: SILICONFLOW_BASE_URL,
  ChatPath: "v1/chat/completions",
  ListModelPath: "v1/models?&sub_type=chat",
} as const;

// 模型提供商
export const ModelProvider = {
  SiliconFlow: "siliconflow",
  OpenAI: "openai",
  Anthropic: "anthropic",
} as const;

// 服务提供商
export const ServiceProvider = {
  SiliconFlow: "SiliconFlow",
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
} as const;

// 默认模型配置
export const DEFAULT_MODELS = [
  {
    name: "Qwen/Qwen2.5-72B-Instruct",
    available: true,
    sorted: 1,
    provider: {
      id: "siliconflow",
      providerName: "SiliconFlow",
      providerType: "siliconflow",
      sorted: 1,
    },
  },
  {
    name: "gpt-4o",
    available: true,
    sorted: 2,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
      sorted: 2,
    },
  },
  {
    name: "gpt-4o-mini",
    available: true,
    sorted: 3,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
      sorted: 2,
    },
  },
  {
    name: "claude-3-5-sonnet-20241022",
    available: true,
    sorted: 4,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
      sorted: 3,
    },
  },
] as const;
