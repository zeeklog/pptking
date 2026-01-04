'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Wand2,
  FileText,
  Image,
  BarChart3,
  Lightbulb,
  Zap,
  RefreshCw,
  Download,
  Copy
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { aiStreamService } from '../services/ai-stream-service';
import { generatePPTJSONSystemPrompt } from '../services/PPT-Generate-system-prompt';

interface AIAssistantProps {
  trigger?: React.ReactNode;
}

export function AIAssistant({ trigger }: AIAssistantProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // 生成表单状态
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    slideCount: 10,
  });

  const {
    addSlide,
    applyTemplate,
    availableTemplates,
    availableThemes,
    slides,
    activeSlideIndex,
    updateElementBatch,
    setTitle
  } = usePPTStore();

  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
      <Sparkles className="w-4 h-4 mr-2" />
      AI助手
    </Button>
  );

  // 生成PPT
  const handleGeneratePPT = async () => {
    setIsGenerating(true);
    setIsStreaming(true);
    setProgress(0);
    setStreamingContent('');

    try {
      // 第一步：调用SiliconFlow流式API生成大纲
      setProgress(20);
      
      const systemPrompt = generatePPTJSONSystemPrompt(generateForm.topic, generateForm.slideCount);
      
      // 可以选择使用 SiliconFlow 或 OpenRouter
      const response = await fetch("/api/chat/siliconflow/v1/chat/completions", {
      // const response = await fetch("/api/chat/openrouter/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // SiliconFlow 模型
          // model: "Qwen/Qwen2.5-72B-Instruct",
          // OpenRouter 模型 - 可以使用免费或付费模型
          model: "openai/gpt-3.5-turbo", // 可用模型
          // model: "openai/gpt-4o-mini", // 付费模型
          // model: "anthropic/claude-3.5-sonnet", // 付费模型
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: `请为主题"${generateForm.topic}"生成${generateForm.slideCount}页PPT大纲`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setProgress(30);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
                
                // 更新进度（基于内容长度估算）
                const estimatedProgress = Math.min(30 + (fullContent.length / 50), 70);
                setProgress(estimatedProgress);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      setProgress(75);
      setIsStreaming(false);

      if (!fullContent) {
        throw new Error('AI返回结果为空');
      }

      // 解析AI返回的JSON
      let outline;
      console.log(fullContent)
      try {
        // 提取JSON部分（可能包含在```json```代码块中）
        const jsonMatch = fullContent.match(/```json\n?([\s\S]*?)\n?```/) || fullContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : fullContent;
        outline = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('解析AI返回的JSON失败:', parseError);
        console.log('原始内容:', fullContent);
        throw new Error('AI返回的格式不正确');
      }

      // 数据清理函数，确保表格数据格式正确
      const cleanElements = (elements: any[]) => {
        return elements?.map((element: any) => {
          if (element.type === 'table') {
            // 如果有table属性，保持现有结构
            if (element.table?.data) {
              return {
                ...element,
                table: {
                  ...element.table,
                  data: element.table.data.map((row: any) => 
                    Array.isArray(row) ? row.map((cell: any) => 
                      typeof cell === 'object' ? JSON.stringify(cell) : String(cell || '')
                    ) : []
                  )
                }
              };
            }
            // 如果是直接的表格数据格式
            else if (element.data) {
              return {
                ...element,
                type: 'table',
                x: element.left || element.x || 0,
                y: element.top || element.y || 0,
                width: element.width || 400,
                height: element.height || 300,
              };
            }
          }
          return element;
        }) || [];
      };

      // 转换为PPT数据结构
      const generatedSlides = outline.slides?.map((slide: any, index: number) => ({
        id: `ai-slide-${Date.now()}-${index}`,
        title: slide.title || `幻灯片 ${index + 1}`,
        elements: cleanElements(slide.elements),
        background: slide.background || {
          type: 'color',
          value: '#FFFFFF',
        },
        transition: slide.transition || {
          type: 'fade',
          duration: 500,
        },
        notes: slide.notes || '',
        tags: [],
      })) || [];

      setProgress(90);

      // 应用生成的幻灯片
      if (generatedSlides.length > 0) {
        // 更新演示文稿标题
        setTitle(outline.title || generateForm.topic);
        
        applyTemplate({
          id: 'ai-generated',
          name: 'AI生成',
          category: 'AI',
          thumbnail: '',
          slides: generatedSlides,
          theme: availableTemplates[0]?.theme || availableThemes[0],
          tags: ['AI', '自动生成'],
        });
      }

      setProgress(100);
      
      // 延迟关闭，让用户看到完成状态
      setTimeout(() => {
        setIsGenerating(false);
        setIsOpen(false);
        setStreamingContent('');
      }, 1000);

    } catch (error) {
      console.error('AI生成失败:', error);
      
      // 生成失败时使用默认模板
      const template = availableTemplates[0];
      if (template) {
        applyTemplate(template);
      }
      
      setIsGenerating(false);
      setIsStreaming(false);
      setStreamingContent('');
      // 可以显示错误提示
      alert('AI生成失败，已使用默认模板。请检查网络连接或稍后重试。');
    }
  };

  return (
    <>
      {/* 覆盖Dialog的默认z-index */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-radix-popper-content-wrapper] {
            z-index: ${Z_INDEX.DIALOG};
          }
          [data-overlay] {
            z-index: ${Z_INDEX.MODAL_BASE - 1};
          }
        `
      }} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl h-[80vh] flex flex-col"
        style={{ zIndex: Z_INDEX.DIALOG }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {t('pptEditor.aiAssistant.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {
            !isGenerating ? (<div className="space-y-4 p-4">
              {/* PPT主题内容 */}
              <div>
                <Label htmlFor="ppt-topic" className="text-base font-semibold mb-2 block">
                  {t('pptEditor.aiAssistant.topicLabel')}
                </Label>
                <Textarea
                  id="ppt-topic"
                  value={generateForm.topic}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder={t('pptEditor.aiAssistant.topicPlaceholder')}
                  className="min-h-[120px] resize-none"
                  style={{
                    height: 'auto',
                    minHeight: '120px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
  
              {/* 指定幻灯片数量 */}
              <div>
                <Label htmlFor="slide-count" className="text-base font-semibold mb-2 block">
                  {t('pptEditor.aiAssistant.slideCountLabel')}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="slide-count"
                    type="number"
                    value={generateForm.slideCount}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, slideCount: parseInt(e.target.value) || 10 }))}
                    min="5"
                    max="50"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('pptEditor.aiAssistant.slideCountDesc')}</span>
                </div>
              </div>
            </div>) : (
              <div className="space-y-4 p-4">
                {/* 生成进度 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('pptEditor.aiAssistant.generating')}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* AI生成的流式内容显示区域 */}
                {isStreaming && streamingContent && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium mb-2 block text-purple-600">
                      AI正在生成大纲...
                    </Label>
                    <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {streamingContent}
                        {isStreaming && (
                          <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse">|</span>
                        )}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 完成后的状态显示 */}
                {!isStreaming && progress === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                        <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">PPT大纲生成完成！正在应用到编辑器...</span>
                  </div>
                )}
              </div>
            )
          }
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t">
          <Button
            onClick={handleGeneratePPT}
            disabled={!generateForm.topic.trim() || isGenerating}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isGenerating ? t('pptEditor.aiAssistant.generatingButton') : t('pptEditor.aiAssistant.generateButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}