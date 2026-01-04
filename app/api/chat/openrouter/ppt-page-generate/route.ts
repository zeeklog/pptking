// export const runtime = 'edge';
// export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../../server-config";
import { auth } from "../../auth";
import { ModelProvider } from "../../constants";
import { createSafeErrorResponse, logSafeRequestInfo } from "../../security-utils";
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  // 安全地记录请求信息
  logSafeRequestInfo(`/api/chat/openrouter/ppt-page-generate`, req.method, !!req.headers.get("Authorization"));

  const authResult = auth(req, ModelProvider.OpenRouter);
  if (authResult.error) {
    return createSafeErrorResponse(
      new Error("Authentication failed"),
      "OpenRouter"
    );
  }

  try {
    const { 
      chapterContent, 
      chapterIndex, 
      totalChapters, 
      style,
      colorScheme,
      model = process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL,
    } = await req.json();
    
    // 读取服务端的 PPT 生成提示词模板
    const pptPromptPath = join(process.cwd(), 'app/prompts/ppt_page_prompt.md');
    const systemPrompt = await readFile(pptPromptPath, 'utf-8');
    // 读取服务端的 PPT 生成提示词模板
    const pptPromptPath2 = join(process.cwd(), 'app/prompts/ppt_best_pratice.md');
    const systemPrompt2 = await readFile(pptPromptPath2, 'utf-8');

    // 构造用户输入内容
    let userContent = `
      内容：${chapterContent}
      索引页码：${chapterIndex + 1}
      总页数：${totalChapters}
      风格：${style}
      主题色方案：${colorScheme}
      `;

    const serverConfig = getServerSideConfig();
    const apiKey = serverConfig.openrouterApiKey;
    const openrouterUrl = serverConfig.openrouterUrl;
    
    if (!apiKey) {
      return createSafeErrorResponse(
        new Error("OpenRouter API key not configured"),
        "OpenRouter"
      );
    }

    // 调用 OpenRouter API
    const response = await fetch(`${openrouterUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ppt-visionary-ai.vercel.app',
        'X-Title': 'PPT Visionary AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "system",
            content: systemPrompt2
          },
          {
            role: "user", 
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 20000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenRouter PPT Generate] API Error: ${response.status} - ${errorText}`);

      const normalizedErrorText = errorText.toLowerCase();
      const isRateLimitError =
        response.status === 429 ||
        normalizedErrorText.includes("rate limit") ||
        normalizedErrorText.includes("free-models-per-day");

      if (isRateLimitError) {
        return NextResponse.json(
          {
            error: {
              message: "模型服务网络拥堵，请稍后再试",
            },
          },
          { status: 429 }
        );
      }
      
      return createSafeErrorResponse(
        new Error(errorText || "Failed to generate PPT"),
        "OpenRouter"
      );
    }

    // 设置流式响应头
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('X-Accel-Buffering', 'no');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

  } catch (error) {
    console.error("[OpenRouter PPT Generate] ", error);
    return createSafeErrorResponse(error, "OpenRouter");
  }
}