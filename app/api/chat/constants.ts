export const OWNER = "zeeklog";
export const REPO = "Catplanet";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const PLUGINS_REPO_URL = `https://github.com/${OWNER}/NextChat-Awesome-Plugins`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const STABILITY_BASE_URL = "https://api.stability.ai";

export const OPENAI_BASE_URL = "https://api.openai.com";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export const BAIDU_BASE_URL = "https://aip.baidubce.com";
export const BAIDU_OATUH_URL = `${BAIDU_BASE_URL}/oauth/2.0/token`;

export const BYTEDANCE_BASE_URL = "https://ark.cn-beijing.volces.com";

export const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/api/";

export const TENCENT_BASE_URL = "https://hunyuan.tencentcloudapi.com";

export const MOONSHOT_BASE_URL = "https://api.moonshot.ai";
export const IFLYTEK_BASE_URL = "https://spark-api-open.xf-yun.com";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export const XAI_BASE_URL = "https://api.x.ai";

export const CHATGLM_BASE_URL = "https://open.bigmodel.cn";

export const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api";

export const SiliconFlow = {
  ExampleEndpoint: SILICONFLOW_BASE_URL,
  ChatPath: "v1/chat/completions",
  ListModelPath: "v1/models?&sub_type=chat",
};

export const OpenRouter = {
  ExampleEndpoint: OPENROUTER_BASE_URL,
  ChatPath: "v1/chat/completions",
  ListModelPath: "v1/models",
};

export const AI302_BASE_URL = "https://api.302.ai";

export const CACHE_URL_PREFIX = "/api/cache";
export const UPLOAD_URL = `${CACHE_URL_PREFIX}/upload`;

export const ACCESS_CODE_PREFIX = "nk-";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Plugins = "/plugins",
  SD = "/sd",
  Artifacts = "/artifacts",
  SearchChat = "/search-chat",
}

export enum ApiPath {
  Cors = "",
  Azure = "/api/chat/azure",
  OpenAI = "/api/chat/openai",
  Anthropic = "/api/chat/anthropic",
  Google = "/api/chat/google",
  Baidu = "/api/chat/baidu",
  ByteDance = "/api/chat/bytedance",
  Alibaba = "/api/chat/alibaba",
  Tencent = "/api/chat/tencent",
  Moonshot = "/api/chat/moonshot",
  Iflytek = "/api/chat/iflytek",
  XAI = "/api/chat/xai",
  ChatGLM = "/api/chat/glm",
  Deepseek = "/api/chat/deepseek",
  SiliconFlow = "/api/chat/siliconflow",
  OpenRouter = "/api/chat/openrouter",
  AI302 = "/api/chat/302ai",
}

export enum ModelProvider {
  Stability = "stability",
  GPT = "gpt",
  GeminiPro = "gemini-pro",
  Claude = "claude",
  Ernie = "ernie",
  Doubao = "doubao",
  Qwen = "qwen",
  Hunyuan = "hunyuan",
  Moonshot = "moonshot",
  Iflytek = "iflytek",
  XAI = "xai",
  ChatGLM = "chatglm",
  Deepseek = "deepseek",
  SiliconFlow = "siliconflow",
  OpenRouter = "openrouter",
  AI302 = "302ai",
}

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
  Google = "Google",
  Anthropic = "Anthropic",
  Baidu = "Baidu",
  ByteDance = "ByteDance",
  Alibaba = "Alibaba",
  Tencent = "Tencent",
  Moonshot = "Moonshot",
  Stability = "Stability",
  Iflytek = "Iflytek",
  XAI = "XAI",
  ChatGLM = "ChatGLM",
  Deepseek = "Deepseek",
  SiliconFlow = "SiliconFlow",
  OpenRouter = "OpenRouter",
  AI302 = "302AI",
}

export enum OpenaiPath {
  ChatPath = "v1/chat/completions",
  UsagePath = "v1/dashboard/billing/usage",
  SubsPath = "v1/dashboard/billing/subscription",
  ListModelPath = "v1/models",
}

export enum AnthropicPath {
  ChatPath = "v1/messages",
  ListModelPath = "v1/models",
}

export enum GooglePath {
  ListModelPath = "v1beta/models",
  ChatPath = "v1beta/models",
}

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`;
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: $x^2$ 
Latex block: $$e=mc^2$$
`;

export const SUMMARIZE_MODEL = "gpt-4o-mini";
export const GEMINI_SUMMARIZE_MODEL = "gemini-1.5-flash";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4-turbo": "2024-04",
  "gpt-4-turbo-2024-04-09": "2024-04",
  "gpt-4o": "2023-10",
  "gpt-4o-2024-05-13": "2023-10",
  "gpt-4o-2024-08-06": "2023-10",
  "gpt-4o-mini": "2023-10",
  "gpt-4o-mini-2024-07-18": "2023-10",
  "o1-mini": "2023-10",
  "o1-preview": "2023-10",
  "o3-mini": "2023-10",
  "chatgpt-4o-latest": "2023-10",
  "gpt-4-vision-preview": "2023-04",
  "gpt-4-turbo-preview": "2023-12",
  "gpt-4-1106-preview": "2023-04",
  "gpt-4-0125-preview": "2023-12",
  "gpt-4-125-preview": "2023-12",
  "gemini-pro": "2023-12",
  "gemini-pro-vision": "2023-12",
  "gemini-1.5-pro-latest": "2024-04",
  "gemini-1.5-flash-latest": "2024-04",
  "claude-instant-1.2": "2023-08",
  "claude-2.0": "2023-07",
  "claude-2.1": "2024-04",
  "claude-3-opus-20240229": "2023-08",
  "claude-3-sonnet-20240229": "2023-08",
  "claude-3-haiku-20240307": "2023-08",
  "claude-3-5-sonnet-20240620": "2024-04",
  "claude-3-5-sonnet-20241022": "2024-04",
  "claude-3-5-haiku-20241022": "2024-04",
  "grok-beta": "2024-10",
};

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
