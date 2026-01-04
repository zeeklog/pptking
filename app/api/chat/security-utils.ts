/**
 * 安全工具函数
 * 用于防止在客户端暴露敏感信息
 */

/**
 * 安全地记录 API KEY 信息
 * 只显示前6位和后4位，中间用 *** 代替
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 10) {
    return "***";
  }
  return `${apiKey.substring(0, 6)}***${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * 安全地处理错误响应
 * 确保不会在客户端暴露敏感信息
 */
export function createSafeErrorResponse(error: any, context: string = "API"): Response {
  console.error(`[${context}] Error:`, error);
  
  // 根据错误类型返回安全的错误信息
  let status = 500;
  let message = "Internal server error";
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // 认证相关错误
    if (errorMessage.includes("unauthorized") || errorMessage.includes("invalid token")) {
      status = 401;
      message = "Authentication failed";
    }
    // 权限相关错误
    else if (errorMessage.includes("forbidden") || errorMessage.includes("permission")) {
      status = 403;
      message = "Access denied";
    }
    // 请求相关错误
    else if (errorMessage.includes("bad request") || errorMessage.includes("invalid request")) {
      status = 400;
      message = "Invalid request";
    }
    // 模型相关错误
    else if (errorMessage.includes("model") || errorMessage.includes("not found")) {
      status = 400;
      message = "Model not available";
    }
    // 网络相关错误
    else if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
      status = 503;
      message = "Service temporarily unavailable";
    }
  }
  
  return new Response(
    JSON.stringify({
      error: true,
      message: message,
      // 不在生产环境中暴露详细错误信息
      ...(process.env.NODE_ENV === "development" && {
        details: error instanceof Error ? error.message : String(error)
      })
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * 安全地记录请求信息
 * 不包含敏感数据
 */
export function logSafeRequestInfo(path: string, method: string, hasAuth: boolean): void {
  console.log(`[Request] ${method} ${path} - Auth: ${hasAuth ? "Yes" : "No"}`);
}

/**
 * 验证 API KEY 格式（不验证有效性）
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }
  
  // 检查常见的 API KEY 格式
  const patterns = [
    /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI 格式
    /^[a-zA-Z0-9]{32,}$/, // 通用格式
    /^[a-zA-Z0-9_-]{20,}$/, // 其他格式
  ];
  
  return patterns.some(pattern => pattern.test(apiKey));
}

/**
 * 清理响应头，移除可能暴露敏感信息的头部
 */
export function sanitizeResponseHeaders(headers: Headers): Headers {
  const sanitizedHeaders = new Headers(headers);
  
  // 移除可能暴露服务器信息的头部
  const sensitiveHeaders = [
    "server",
    "x-powered-by",
    "x-aspnet-version",
    "x-aspnetmvc-version",
    "x-runtime",
    "x-version",
  ];
  
  sensitiveHeaders.forEach(header => {
    sanitizedHeaders.delete(header);
  });
  
  return sanitizedHeaders;
}
