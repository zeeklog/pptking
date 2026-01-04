/**
 * AI流式服务 - 处理PPT内容的实时生成
 * 参考chat页面的流式响应设计
 */

export interface StreamAIRequest {
  type: 'outline' | 'optimize';
  data: any;
}

export class AIStreamService {
  private static instance: AIStreamService;
  private baseUrl: string = '/api/ppt/ai/stream';

  private constructor() {}

  public static getInstance(): AIStreamService {
    if (!AIStreamService.instance) {
      AIStreamService.instance = new AIStreamService();
    }
    return AIStreamService.instance;
  }

  async streamGenerate(
    request: StreamAIRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(fullContent);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onComplete(fullContent);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
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

  // 流式生成PPT大纲
  async streamPPTOutline(
    request: { topic: string; slideCount: number; style: string; language: string },
    onChunk: (chunk: string) => void,
    onComplete: (outline: any) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let accumulatedContent = "";

    await this.streamGenerate(
      {
        type: 'outline',
        data: request,
      },
      (chunk) => {
        accumulatedContent += chunk;
        onChunk(chunk);
      },
      (fullContent) => {
        try {
          console.log('fullContent')
          console.log(fullContent)
          // 尝试解析完整的JSON
          const outline = JSON.parse(fullContent);
          onComplete(outline);
        } catch (error) {
          console.error('JSON解析失败:', error);
          onError(new Error('AI返回的内容格式不正确'));
        }
      },
      onError
    );
  }

  // 流式内容优化
  async streamOptimizeContent(
    request: { content: string; optimizeType: string; language: string },
    onChunk: (chunk: string) => void,
    onComplete: (content: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    await this.streamGenerate(
      {
        type: 'optimize',
        data: request,
      },
      onChunk,
      onComplete,
      onError
    );
  }
}

export const aiStreamService = AIStreamService.getInstance();