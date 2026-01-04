import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "./server-config";
import { OPENROUTER_BASE_URL } from "./constants";
import { sanitizeResponseHeaders } from "./security-utils";

const serverConfig = getServerSideConfig();

export async function requestOpenRouter(req: NextRequest) {
  const controller = new AbortController();

  let authValue = req.headers.get("Authorization") ?? "";
  const authHeaderName = "Authorization";

  // 如果客户端没有提供 API KEY，使用服务器端的 API KEY
  if (!authValue || authValue === "Bearer ") {
    const serverApiKey = serverConfig.openrouterApiKey;
    if (serverApiKey) {
      authValue = `Bearer ${serverApiKey}`;
      console.log("[OpenRouter] Using server API key");
    } else {
      console.error("[OpenRouter] No API key provided by client or server");
    }
  }

  let path = `${req.nextUrl.pathname}`.replace(/\/api\/chat\/openrouter\//g, "");

  let baseUrl = serverConfig.openrouterUrl || OPENROUTER_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[OpenRouter Proxy] ", path);
  console.log("[OpenRouter Base Url]", baseUrl);
  // 安全：不记录 API KEY 的具体内容
  console.log("[OpenRouter Auth]", authValue ? "API Key provided" : "No API Key");

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const fetchUrl = `${baseUrl}/${path}`;
  console.log("fetchUrl", fetchUrl);

  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
      // OpenRouter 特定的头部信息
      "HTTP-Referer": "https://ppt-visionary-ai.vercel.app",
      "X-Title": "PPT Visionary AI",
    },
    method: req.method,
    body: req.body,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // 对于聊天完成请求，处理请求体以支持模型选择
  if (path === "v1/chat/completions" && req.body) {
    try {
      const clonedBody = await req.text();
      const jsonBody = JSON.parse(clonedBody);

      // 如果没有指定模型，使用默认模型
      if (!jsonBody.model) {
        jsonBody.model = "openai/gpt-3.5-turbo";
        console.log("[OpenRouter] Using default model: openai/gpt-3.5-turbo");
      } else {
        console.log(`[OpenRouter] Using specified model: ${jsonBody.model}`);
      }

      fetchOptions.body = JSON.stringify(jsonBody);
    } catch (e) {
      console.error("[OpenRouter] Error processing request body", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // 检查响应状态，如果是错误状态码，进行安全处理
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[OpenRouter] API Error: ${res.status} - ${errorText}`);
      
      // 根据错误类型返回安全的错误响应
      let errorMessage = "Service temporarily unavailable";
      if (res.status === 401) {
        errorMessage = "Authentication failed";
      } else if (res.status === 403) {
        errorMessage = "Access denied";
      } else if (res.status === 400) {
        errorMessage = "Invalid request";
      } else if (res.status === 429) {
        errorMessage = "Rate limit exceeded";
      }
      
      return new Response(
        JSON.stringify({
          error: true,
          message: errorMessage,
          ...(process.env.NODE_ENV === "development" && {
            details: errorText
          })
        }),
        {
          status: res.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 安全地处理响应头
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    newHeaders.set("X-Accel-Buffering", "no");
    
    // 对于流式响应，确保正确的Content-Type
    const originalContentType = res.headers.get("content-type");
    if (originalContentType) {
      newHeaders.set("Content-Type", originalContentType);
    }
    
    // 对于流式响应，删除可能干扰的头部
    if (originalContentType?.includes("text/event-stream") || originalContentType?.includes("text/plain")) {
      newHeaders.delete("content-encoding");
      newHeaders.delete("content-length");
    } else {
      newHeaders.delete("content-encoding");
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
