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
  logSafeRequestInfo(`/api/chat/openrouter/ppt-outline-generate`, req.method, !!req.headers.get("Authorization"));

  const authResult = auth(req, ModelProvider.OpenRouter);
  if (authResult.error) {
    return createSafeErrorResponse(
      new Error("Authentication failed"),
      "OpenRouter"
    );
  }

  try {
    const { 
      prompt, 
      slideCount, 
      audience, 
      duration, 
      requirements,
      model = "openai/gpt-3.5-turbo" 
    } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: true, message: "Missing or invalid topic" },
        { status: 400 }
      );
    }

    // 读取服务端的 PPT 生成提示词模板
    const pptPromptPath = join(process.cwd(), 'app/prompts/ppt_prompt.md');
    const systemPrompt = await readFile(pptPromptPath, 'utf-8');

    // 构造用户输入内容
    let userContent = prompt

    const serverConfig = getServerSideConfig();
    const apiKey = serverConfig.openrouterApiKey;
    const openrouterUrl = serverConfig.openrouterUrl;
    
    if (!apiKey) {
      return createSafeErrorResponse(
        new Error("OpenRouter API key not configured"),
        "OpenRouter"
      );
    }

    console.log(openrouterUrl)

    // 调用 OpenRouter API
    const response = await fetch(`${openrouterUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pptking.cn',
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
      
      return createSafeErrorResponse(
        new Error("Failed to generate PPT"),
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