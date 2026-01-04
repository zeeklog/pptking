import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "./server-config";
import { SILICONFLOW_BASE_URL } from "./constants";
import { sanitizeResponseHeaders } from "./security-utils";

const serverConfig = getServerSideConfig();

export async function requestSiliconFlow(req: NextRequest) {
  const controller = new AbortController();

  let authValue = req.headers.get("Authorization") ?? "";
  const authHeaderName = "Authorization";

  // 如果客户端没有提供 API KEY，使用服务器端的 API KEY
  if (!authValue || authValue === "Bearer ") {
    const serverApiKey = serverConfig.siliconFlowApiKey;
    if (serverApiKey) {
      authValue = `Bearer ${serverApiKey}`;
      console.log("[SiliconFlow] Using server API key");
    } else {
      console.error("[SiliconFlow] No API key provided by client or server");
    }
  }

  let path = `${req.nextUrl.pathname}`.replace(/\/api\/chat\/siliconflow\//g, "");

  let baseUrl = serverConfig.siliconFlowUrl || SILICONFLOW_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[SiliconFlow Proxy] ", path);
  console.log("[SiliconFlow Base Url]", baseUrl);
  // 安全：不记录 API KEY 的具体内容
  console.log("[SiliconFlow Auth]", authValue ? "API Key provided" : "No API Key");

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
    },
    method: req.method,
    body: req.body,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // 对于聊天完成请求，将模型写死为Qwen/Qwen2.5-72B-Instruct
  if (path === "v1/chat/completions" && req.body) {
    try {
      const clonedBody = await req.text();
      const jsonBody = JSON.parse(clonedBody);

      // 强制设置模型为Qwen/Qwen2.5-72B-Instruct
      jsonBody.model = "Qwen/Qwen2.5-72B-Instruct";

      fetchOptions.body = JSON.stringify(jsonBody);
      console.log("[SiliconFlow] Using fixed model: Qwen/Qwen2.5-72B-Instruct");
    } catch (e) {
      console.error("[SiliconFlow] Error processing request body", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // 检查响应状态，如果是错误状态码，进行安全处理
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[SiliconFlow] API Error: ${res.status} - ${errorText}`);
      
      // 根据错误类型返回安全的错误响应
      let errorMessage = "Service temporarily unavailable";
      if (res.status === 401) {
        errorMessage = "Authentication failed";
      } else if (res.status === 403) {
        errorMessage = "Access denied";
      } else if (res.status === 400) {
        errorMessage = "Invalid request";
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
    const newHeaders = sanitizeResponseHeaders(res.headers);
    newHeaders.delete("www-authenticate");
    newHeaders.set("X-Accel-Buffering", "no");
    
    // 对于流式响应，保持原始的Content-Type
    const originalContentType = res.headers.get("content-type");
    if (originalContentType) {
      newHeaders.set("Content-Type", originalContentType);
    }
    
    // 删除content-encoding可能会导致问题，只在非流式响应时删除
    if (!originalContentType?.includes("text/event-stream")) {
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
