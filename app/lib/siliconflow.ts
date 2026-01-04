import { SILICONFLOW_BASE_URL } from "../constants";

export interface SiliconFlowListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export interface SiliconFlowChatOptions {
  messages: Array<{
    role: string;
    content: string;
  }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class SiliconFlowApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || "/api/chat/siliconflow";
    this.apiKey = apiKey || "";
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async chat(options: SiliconFlowChatOptions): Promise<Response> {
    const url = `${this.baseUrl}/v1/chat/completions`;

    const payload = {
      messages: options.messages,
      model: "Qwen/Qwen2.5-72B-Instruct", // 硬编码模型
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000,
      stream: options.stream || false,
    };

    return fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
  }

  async models(): Promise<SiliconFlowListModelResponse> {
    const url = `${this.baseUrl}/v1/models?&sub_type=chat`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return response.json();
  }

  async streamChat(options: SiliconFlowChatOptions): Promise<ReadableStream<Uint8Array> | null> {
    const streamOptions = { ...options, stream: true };
    const response = await this.chat(streamOptions);

    if (!response.ok) {
      throw new Error(`Stream chat failed: ${response.statusText}`);
    }

    return response.body;
  }
}
