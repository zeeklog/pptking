import { ChatRequest, ChatResponse } from "./api";

export interface SiliconFlowListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export interface SiliconFlowModel {
  name: string;
  available: boolean;
  sorted: number;
  provider: {
    id: string;
    providerName: string;
    providerType: string;
    sorted: number;
  };
}

export class SiliconFlowApi {
  private baseUrl: string;
  private disableListModels = false;

  constructor(baseUrl: string = "/api/chat/siliconflow") {
    this.baseUrl = baseUrl;
  }

  private path(path: string): string {
    if (this.baseUrl.endsWith("/")) {
      this.baseUrl = this.baseUrl.slice(0, this.baseUrl.length - 1);
    }

    console.log("[SiliconFlow Proxy Endpoint] ", this.baseUrl, path);
    return [this.baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(this.path("v1/chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 注意：SiliconFlow API KEY 由服务端处理，不在前端暴露
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 4000,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`SiliconFlow API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) {
    try {
      const response = await fetch(this.path("v1/chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 注意：SiliconFlow API KEY 由服务端处理，不在前端暴露
        },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`SiliconFlow stream request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<SiliconFlowModel[]> {
    if (this.disableListModels) {
      return [];
    }

    const res = await fetch(this.path("v1/models?&sub_type=chat"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 注意：SiliconFlow API KEY 由服务端处理，不在前端暴露
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch SiliconFlow models: ${res.status} ${res.statusText}`);
    }

    const resJson = (await res.json()) as SiliconFlowListModelResponse;
    const chatModels = resJson.data;
    console.log("[SiliconFlow Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    let seq = 1000; // 同原项目保持一致
    return chatModels.map((m) => ({
      name: m.id,
      available: true,
      sorted: seq++,
      provider: {
        id: "siliconflow",
        providerName: "SiliconFlow",
        providerType: "siliconflow",
        sorted: 14,
      },
    }));
  }
}

export const siliconFlowApi = new SiliconFlowApi();
