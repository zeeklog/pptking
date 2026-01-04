export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../../../chat/server-config";
import { auth } from "../../../chat/auth";
import { ModelProvider } from "../../../chat/constants";
import { requestSiliconFlow } from "../../../chat/siliconflow-common";
import { createSafeErrorResponse, logSafeRequestInfo } from "../../../chat/security-utils";

export async function POST(req: NextRequest) {
  // 安全地记录请求信息
  logSafeRequestInfo("/api/ppt/ai/stream", "POST", !!req.headers.get("Authorization"));

  // 身份验证
  const authResult = auth(req, ModelProvider.SiliconFlow);
  if (authResult.error) {
    return createSafeErrorResponse(
      new Error("Authentication failed"),
      "PPT AI Stream"
    );
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'outline') {
      // PPT大纲生成
      systemPrompt = '你是一个专业的演示文稿策划师，擅长创建结构清晰、逻辑严密的PPT大纲。你必须严格按照用户要求的JSON格式返回数据，不要添加任何额外的文字说明。';
      userPrompt = `
请为主题"${data.topic}"生成${data.slideCount}张PPT的大纲。
风格要求：${data.style}
语言：${data.language}

请返回JSON格式的大纲数据，格式如下：
{
  "title": "演示文稿标题",
  "slides": [
    {
      "title": "幻灯片标题",
      "content": ["要点1", "要点2", "要点3"],
      "notes": "演讲者备注",
      "layout": "title|content|two-column|image-content|conclusion"
    }
  ]
}

要求：
1. 第一张幻灯片应该是标题页，layout设为"title"
2. 最后一张幻灯片应该是结论页，layout设为"conclusion"  
3. 中间的幻灯片根据内容选择合适的layout
4. 每张幻灯片的content应该是要点列表
5. 确保内容逻辑清晰、结构合理
`;
    } else if (type === 'optimize') {
      // 内容优化
      systemPrompt = `你是一个专业的内容编辑师，擅长优化和改进文本内容。请用${data.language}回复，直接返回优化后的内容，不要添加任何额外的说明。`;
      
      switch (data.optimizeType) {
        case 'rewrite':
          userPrompt = `请重写以下内容，使其更加清晰、专业：\n\n${data.content}`;
          break;
        case 'expand':
          userPrompt = `请扩展以下内容，添加更多细节和解释：\n\n${data.content}`;
          break;
        case 'summarize':
          userPrompt = `请总结以下内容，提取关键要点：\n\n${data.content}`;
          break;
        default:
          throw new Error('不支持的优化类型');
      }
    } else {
      throw new Error('不支持的请求类型');
    }

    // 构建SiliconFlow流式请求
    const siliconFlowRequest = new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: true, // 启用流式响应
      }),
    });

    // 调用SiliconFlow API并返回流式响应
    const response = await requestSiliconFlow(siliconFlowRequest);
    
    return response;

  } catch (error) {
    console.error('[PPT AI Stream] Error:', error);
    return createSafeErrorResponse(error, "PPT AI Stream");
  }
}