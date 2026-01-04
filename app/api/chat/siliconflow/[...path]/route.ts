export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { type OpenAIListModelResponse } from "../../openai/openai-types";
import { getServerSideConfig } from "../../server-config";
import { ModelProvider, OpenaiPath, ServiceProvider } from "../../constants";
import { prettyObject } from "../../format-utils";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestSiliconFlow } from "../../siliconflow-common";
import { isModelNotavailableInServer } from "../../model-utils";
import { createSafeErrorResponse, logSafeRequestInfo } from "../../security-utils";

const ALLOWED_PATH = new Set(Object.values(OpenaiPath));

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();
  return remoteModelRes;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handle(req, { params });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handle(req, { params });
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return NextResponse.json({ body: "OK" }, { status: 200 });
}

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const subpath = resolvedParams.path.join("/");
  
  // 安全地记录请求信息
  logSafeRequestInfo(`/api/chat/siliconflow/${subpath}`, req.method, !!req.headers.get("Authorization"));

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  if (!ALLOWED_PATH.has(subpath as any)) {
    console.log("[SiliconFlow Route] forbidden path ", subpath);
    return createSafeErrorResponse(
      new Error(`Forbidden path: ${subpath}`),
      "SiliconFlow"
    );
  }

  const authResult = auth(req, ModelProvider.SiliconFlow);
  if (authResult.error) {
    return createSafeErrorResponse(
      new Error("Authentication failed"),
      "SiliconFlow"
    );
  }

  try {
    // 检查自定义模型过滤
    const serverConfig = getServerSideConfig();
    if (serverConfig.customModels && req.body && subpath === "v1/chat/completions") {
      try {
        const clonedBody = await req.text();
        const jsonBody = JSON.parse(clonedBody) as { model?: string };

        if (
          isModelNotavailableInServer(
            serverConfig.customModels,
            jsonBody?.model as string,
            ServiceProvider.SiliconFlow as string,
          )
        ) {
          return createSafeErrorResponse(
            new Error(`Model not allowed: ${jsonBody?.model}`),
            "SiliconFlow"
          );
        }

        // 重新设置请求体
        req = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: clonedBody,
        });
      } catch (e) {
        console.error(`[SiliconFlow] filter`, e);
      }
    }

    const response = await requestSiliconFlow(req);

    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    }

    return response;
  } catch (e) {
    console.error("[SiliconFlow] ", e);
    return createSafeErrorResponse(e, "SiliconFlow");
  }
}
