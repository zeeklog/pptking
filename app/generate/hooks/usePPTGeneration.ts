import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import type { GenerationStage, FormData, APIError } from '../types';

interface UsePPTGenerationOptions {
  onSuccess?: (content: string) => void;
  onError?: (error: string) => void;
}

export function usePPTGeneration(options: UsePPTGenerationOptions = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [streamingContent, setStreamingContent] = useState('');
  const [htmlContents, setHtmlContents] = useState<string[]>([]);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<APIError | null>(null);

  // 解析 API 错误响应
  const parseErrorResponse = async (response: Response): Promise<APIError> => {
    try {
      const errorText = await response.text();
      let errorData: any = {};
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // 如果不是 JSON，使用原始文本
        errorData = { message: errorText };
      }

      // 尝试从 OpenRouter 错误格式中提取信息
      if (errorData.error) {
        const openRouterError = errorData.error;
        return {
          error: true,
          message: openRouterError.message || 'Unknown error',
          code: response.status,
          details: openRouterError.metadata?.raw ? JSON.parse(openRouterError.metadata.raw) : undefined
        };
      }

      return {
        error: true,
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
        details: errorData.details
      };
    } catch (e) {
      return {
        error: true,
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status
      };
    }
  };

  // 计算智能进度
  const calculateProgress = (fullContent: string, startTime: number, lastProgress: number): number => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    
    // 基于内容结构的进度估算
    const lines = fullContent.split('\n');
    const headings = lines.filter(line => line.trim().startsWith('#'));
    const bulletPoints = lines.filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
    const separators = lines.filter(line => line.trim() === '---');
    
    // 根据PPT结构特征计算进度
    let structureProgress = 0;
    if (headings.length > 0) structureProgress += 20;
    if (headings.length >= 3) structureProgress += 20;
    if (bulletPoints.length >= 5) structureProgress += 20;
    if (separators.length >= 2) structureProgress += 20;
    if (fullContent.length > 500) structureProgress += 20;
    
    // 基于时间的进度估算（假设总时间约15-30秒）
    const timeProgress = Math.min((elapsedTime / 20000) * 80, 80);
    
    // 综合计算进度
    const calculatedProgress = Math.min(
      10 + Math.max(structureProgress, timeProgress),
      90
    );
    
    // 避免进度倒退
    return Math.max(calculatedProgress, lastProgress);
  };

  // 验证生成的内容
  const validateContent = (content: string): { valid: boolean; error?: string } => {
    if (!content.trim()) {
      return { valid: false, error: t('generate.errors.emptyContent') };
    }
    
    const headingCount = content.split('\n').filter(line => line.trim().startsWith('#')).length;
    if (headingCount === 0) {
      return { valid: false, error: t('generate.errors.invalidFormat') };
    }
    
    return { valid: true };
  };

  // 将 markdown 内容按 "---" 分割成章节数组
  const splitIntoChapters = (content: string): string[] => {
    // 匹配独立的 "---" 行（前后可能有空行）
    // 使用正则表达式匹配：\n---\n 或 \n---\r\n 或前后有空行的 ---
    const separatorPattern = /\n\s*---\s*\n/;
    
    // 按分隔符分割
    const parts = content.split(separatorPattern);
    
    // 过滤空字符串和只包含空白字符的章节
    const chapters = parts
      .map(chapter => chapter.trim())
      .filter(chapter => chapter.length > 0);
    
    // 如果没有找到分隔符，将整个内容作为一个章节
    return chapters.length > 0 ? chapters : [content.trim()];
  };

  // 调用后台接口生成单个章节的 HTML
  const generateChapterHTML = async (
    chapterData: {
      chapterContent: string,
      chapterIndex: number,
      totalChapters: number,
      style: string,
      colorScheme: string,
    }
  ): Promise<string> => {
    const response = await fetch("/api/chat/openrouter/ppt-page-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chapterContent: chapterData.chapterContent,
        chapterIndex: chapterData.chapterIndex,
        totalChapters: chapterData.totalChapters,
        style: chapterData.style,
        colorScheme: chapterData.colorScheme,
      }),
    });

    if (!response.ok) {
      const apiError = await parseErrorResponse(response);
      throw new Error(`Failed to generate HTML for chapter ${chapterData.chapterIndex + 1}: ${apiError.message}`);
    }

    // 读取流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let htmlContent = "";

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
            
            // 检查是否有错误
            if (parsed.error) {
              const errorMsg = parsed.error.message || 'Stream error occurred';
              throw new Error(errorMsg);
            }
            
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              htmlContent += content;
            }
          } catch (e: any) {
            // 如果是我们抛出的错误，重新抛出
            if (e.message && e.message.includes('Stream error')) {
              throw e;
            }
            console.warn(`[Chapter ${chapterData.chapterIndex + 1}] Parse SSE error:`, e);
          }
        }
      }
    }

    return htmlContent;
  };

  const generate = useCallback(async (formData: FormData) => {
    if (!formData.content.trim()) {
      toast({
        title: t('generate.errors.fillRequiredInfo'),
        description: t('generate.errors.inputContentDescription'),
        variant: "destructive",
      });
      return;
    }

    // 重置状态
    setIsGenerating(true);
    setProgress(0);
    setStreamingContent("");
    setHtmlContents([]);
    setGenerationStage('connecting');
    setErrorMessage('');
    setErrorDetails(null);

    try {
      // 阶段1: 连接到API (0-10%)
      setGenerationStage('connecting');
      setProgress(5);
      const response = await fetch("/api/chat/openrouter/ppt-outline-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formData.content,
          style: formData.style,
          colorScheme: formData.colorScheme,
          slideCount: formData.slideCount,
        }),
      });

      if (!response.ok) {
        const apiError = await parseErrorResponse(response);
        setErrorDetails(apiError);
        
        // 构建友好的错误消息
        let userMessage = apiError.message;
        
        // 检查 details 中的错误信息
        if (apiError.details && typeof apiError.details === 'object') {
          const detailsError = (apiError.details as any).error;
          if (detailsError?.code === 'unsupported_country_region_territory') {
            userMessage = t('generate.errors.unsupportedRegion') || 'Your region is not supported by the AI service. Please try again later.';
          }
        }
        
        // 根据 HTTP 状态码提供友好消息
        if (apiError.code === 404) {
          userMessage = t('generate.errors.modelNotFound') || 'The AI model is not available. Please try again later.';
        } else if (apiError.code === 403) {
          userMessage = t('generate.errors.accessDenied') || 'Access denied. Please check your settings.';
        } else if (apiError.code === 429) {
          userMessage = t('generate.errors.rateLimit') || 'Too many requests. Please try again later.';
        }
        
        throw new Error(userMessage);
      }

      // 阶段2: 流式生成大纲，同时并行生成PPT页面 (10-100%)
      setGenerationStage('generating');
      setProgress(10);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let startTime = Date.now();
      let lastProgressUpdate = 0;
      
      // 跟踪已识别和正在生成的章节
      let lastProcessedChapterCount = 0;
      const chapterGenerationPromises = new Map<number, Promise<string>>();
      const htmlResults: string[] = [];
      let totalExpectedChapters = 0;

      // 实时解析章节并开始生成HTML
      const processNewChapters = (content: string) => {
        const currentChapters = splitIntoChapters(content);
        const newChapterCount = currentChapters.length;
        
        // 检查是否有新章节
        if (newChapterCount > lastProcessedChapterCount) {
          // 更新总章节数
          totalExpectedChapters = Math.max(totalExpectedChapters, newChapterCount);
          
          // 为新章节初始化占位符
          while (htmlResults.length < newChapterCount) {
            const index = htmlResults.length;
            htmlResults.push(
              `<div class="p-8 text-center text-blue-500 animate-pulse">
                <div class="flex flex-col items-center justify-center h-full space-y-4">
                  <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p class="text-lg font-medium">正在生成第 ${index + 1} 页...</p>
                  <p class="text-sm text-gray-500">Generating page ${index + 1}</p>
                </div>
              </div>`
            );
          }
          
          // 立即更新UI显示所有占位符
          setHtmlContents([...htmlResults]);
          
          // 为新识别的章节启动HTML生成（除了最后一个章节，因为它可能还在生成中）
          for (let i = lastProcessedChapterCount; i < newChapterCount - 1; i++) {
            if (!chapterGenerationPromises.has(i)) {
              const chapterIndex = i;
              const promise = generateChapterHTML({
                chapterContent: currentChapters[chapterIndex],
                chapterIndex,
                totalChapters: totalExpectedChapters,
                style: formData.style,
                colorScheme: formData.colorScheme,
              }).then(htmlContent => {
                // 生成成功，更新对应位置的HTML
                htmlResults[chapterIndex] = htmlContent;
                setHtmlContents([...htmlResults]);
                return htmlContent;
              }).catch(error => {
                // 生成失败，显示错误信息
                console.error(`[Chapter ${chapterIndex + 1}] Failed to generate HTML:`, error);
                const errorHtml = `<div class="p-8 text-center text-red-500">
                  <div class="flex flex-col items-center justify-center h-full space-y-4">
                    <svg class="h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-lg font-medium">生成第 ${chapterIndex + 1} 页失败</p>
                    <p class="text-sm">${error.message}</p>
                  </div>
                </div>`;
                htmlResults[chapterIndex] = errorHtml;
                setHtmlContents([...htmlResults]);
                return errorHtml;
              });
              
              chapterGenerationPromises.set(chapterIndex, promise);
            }
          }
          
          lastProcessedChapterCount = newChapterCount - 1; // 保留最后一个章节，等待完整
        }
      };

      // 流式读取大纲内容
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
              
              // 检查是否有错误
              if (parsed.error) {
                const errorMsg = parsed.error.message || 'Stream error occurred';
                throw new Error(errorMsg);
              }
              
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
                
                // 实时处理新章节
                processNewChapters(fullContent);
                
                // 智能进度计算（只计算大纲生成进度，设置为0-70%）
                const calculatedProgress = calculateProgress(fullContent, startTime, lastProgressUpdate);
                const outlineProgress = Math.min(calculatedProgress * 0.7, 70); // 大纲占70%进度
                if (outlineProgress > lastProgressUpdate) {
                  setProgress(outlineProgress);
                  lastProgressUpdate = outlineProgress;
                }
              }
            } catch (e: any) {
              // 如果是我们抛出的错误，重新抛出
              if (e.message && e.message.includes('Stream error')) {
                throw e;
              }
              console.warn(t('generate.errors.parseSSEError'), e);
            }
          }
        }
      }

      // 大纲生成完成，验证内容
      const validation = validateContent(fullContent);
      if (!validation.valid) {
        throw new Error(validation.error || t('generate.errors.invalidFormat'));
      }

      // 处理最后一个章节（现在已经完整）
      const finalChapters = splitIntoChapters(fullContent);
      totalExpectedChapters = finalChapters.length;
      
      // 确保htmlResults数组长度正确
      while (htmlResults.length < finalChapters.length) {
        const index = htmlResults.length;
        htmlResults.push(
          `<div class="p-8 text-center text-blue-500 animate-pulse">
            <div class="flex flex-col items-center justify-center h-full space-y-4">
              <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-lg font-medium">正在生成第 ${index + 1} 页...</p>
              <p class="text-sm text-gray-500">Generating page ${index + 1} of ${finalChapters.length}</p>
            </div>
          </div>`
        );
      }
      setHtmlContents([...htmlResults]);
      
      // 生成最后一个章节
      if (!chapterGenerationPromises.has(finalChapters.length - 1)) {
        const lastIndex = finalChapters.length - 1;
        const promise = generateChapterHTML({
          chapterContent: finalChapters[lastIndex],
          chapterIndex: lastIndex,
          totalChapters: finalChapters.length,
          style: formData.style,
          colorScheme: formData.colorScheme,
        }).then(htmlContent => {
          htmlResults[lastIndex] = htmlContent;
          setHtmlContents([...htmlResults]);
          return htmlContent;
        }).catch(error => {
          console.error(`[Chapter ${lastIndex + 1}] Failed to generate HTML:`, error);
          const errorHtml = `<div class="p-8 text-center text-red-500">
            <div class="flex flex-col items-center justify-center h-full space-y-4">
              <svg class="h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-lg font-medium">生成第 ${lastIndex + 1} 页失败</p>
              <p class="text-sm">${error.message}</p>
            </div>
          </div>`;
          htmlResults[lastIndex] = errorHtml;
          setHtmlContents([...htmlResults]);
          return errorHtml;
        });
        chapterGenerationPromises.set(lastIndex, promise);
      }
      
      // 等待所有章节HTML生成完成
      setGenerationStage('completing');
      setProgress(75);
      
      const allPromises = Array.from(chapterGenerationPromises.values());
      await Promise.all(allPromises);
      
      // 完成
      setProgress(100);
      setGenerationStage('idle');
      options.onSuccess?.(fullContent);

    } catch (error: any) {
      console.error(t('generate.errors.pptGenerationFailed'), error);
      setGenerationStage('error');
      const errorMsg = error.message || t('generate.errors.unknownError');
      setErrorMessage(errorMsg);
      setProgress(0);
      
      toast({
        title: t('generate.errors.generationFailed'),
        description: errorMsg,
        variant: "destructive",
      });
      
      options.onError?.(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  }, [t, toast, options]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setStreamingContent('');
    setHtmlContents([]);
    setGenerationStage('idle');
    setErrorMessage('');
    setErrorDetails(null);
  }, []);

  // 更新指定索引的 HTML 内容
  const updateHtmlContent = useCallback((index: number, newContent: string) => {
    setHtmlContents(prev => {
      const updated = [...prev];
      updated[index] = newContent;
      return updated;
    });
  }, []);

  // 重新生成指定章节的 HTML
  const regenerateChapter = useCallback(async (index: number, formData: FormData) => {
    if (index < 0) return;

    try {
      // 从streamingContent中获取对应章节的内容
      const chapters = splitIntoChapters(streamingContent);
      if (index >= chapters.length) {
        toast({
          title: t('generate.errors.invalidChapterIndex'),
          description: `Chapter index ${index + 1} is out of range`,
          variant: "destructive",
        });
        return;
      }

      // 设置该章节为加载状态
      setHtmlContents(prev => {
        const updated = [...prev];
        updated[index] = '<div class="p-8 text-center text-blue-500 animate-pulse">Regenerating chapter ' + (index + 1) + '...</div>';
        return updated;
      });

      const htmlContent = await generateChapterHTML({
        chapterContent: chapters[index],
        chapterIndex: index,
        totalChapters: chapters.length,
        style: formData.style,
        colorScheme: formData.colorScheme,
      });

      // 更新生成的 HTML
      setHtmlContents(prev => {
        const updated = [...prev];
        updated[index] = htmlContent;
        return updated;
      });

      toast({
        title: t('generate.success.chapterRegenerated'),
        description: `Chapter ${index + 1} has been regenerated successfully`,
      });
    } catch (error: any) {
      console.error(`Failed to regenerate chapter ${index + 1}:`, error);
      
      // 设置错误状态
      setHtmlContents(prev => {
        const updated = [...prev];
        updated[index] = `<div class="p-8 text-center text-red-500">Failed to regenerate chapter ${index + 1}: ${error.message}</div>`;
        return updated;
      });

      toast({
        title: t('generate.errors.regenerationFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [streamingContent, t, toast]);

  // 删除指定章节的 HTML
  const deleteChapter = useCallback((index: number) => {
    setHtmlContents(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: t('generate.success.chapterDeleted'),
      description: `Chapter ${index + 1} has been deleted`,
    });
  }, [t, toast]);

  return {
    isGenerating,
    progress,
    streamingContent,
    htmlContents,
    generationStage,
    errorMessage,
    errorDetails,
    generate,
    reset,
    setStreamingContent,
    updateHtmlContent,
    regenerateChapter,
    deleteChapter,
  };
}

