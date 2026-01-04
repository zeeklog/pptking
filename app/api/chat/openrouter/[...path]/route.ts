export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { type OpenAIListModelResponse } from "../../openai/openai-types";
import { getServerSideConfig } from "../../server-config";
import { ModelProvider, OpenaiPath, ServiceProvider } from "../../constants";
import { prettyObject } from "../../format-utils";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestOpenRouter } from "../../openrouter-common";
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
  logSafeRequestInfo(`/api/chat/openrouter/${subpath}`, req.method, !!req.headers.get("Authorization"));

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  if (!ALLOWED_PATH.has(subpath as any)) {
    console.log("[OpenRouter Route] forbidden path ", subpath);
    return createSafeErrorResponse(
      new Error(`Forbidden path: ${subpath}`),
      "OpenRouter"
    );
  }

  const authResult = auth(req, ModelProvider.OpenRouter);
  if (authResult.error) {
    return createSafeErrorResponse(
      new Error("Authentication failed"),
      "OpenRouter"
    );
  }

  try {
    const response = await requestOpenRouter(req);

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
    console.error("[OpenRouter] ", e);
    return createSafeErrorResponse(e, "OpenRouter");
  }
}
