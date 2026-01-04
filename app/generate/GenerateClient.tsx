'use client';

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePPTGeneration } from "./hooks/usePPTGeneration";
import { usePromptEnhancement } from "./hooks/usePromptEnhancement";
import { useProgressSteps } from "./hooks/useProgressSteps";
import BackgroundDecorations from "./components/BackgroundDecorations";
import { GenerationForm } from "./components/GenerationForm";
import { GenerationProgress } from "./components/GenerationProgress";
import { GenerationPreview } from "./components/GenerationPreview";
import type { FormData } from "./types";

const STORAGE_KEY = 'ppt-generate-presets';

// 默认预设值
const DEFAULT_PRESETS = {
  style: "business",
  colorScheme: "purple",
  slideCount: "10"
};

// 从 LocalStorage 读取预设值
function loadPresetsFromStorage(): Partial<FormData> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        style: parsed.style || DEFAULT_PRESETS.style,
        colorScheme: parsed.colorScheme || DEFAULT_PRESETS.colorScheme,
        slideCount: parsed.slideCount || DEFAULT_PRESETS.slideCount,
      };
    }
  } catch (error) {
    console.error('Failed to load presets from localStorage:', error);
  }
  
  return {};
}

// 保存预设值到 LocalStorage
function savePresetsToStorage(presets: Partial<FormData>) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      style: presets.style,
      colorScheme: presets.colorScheme,
      slideCount: presets.slideCount,
    }));
  } catch (error) {
    console.error('Failed to save presets to localStorage:', error);
  }
}

export default function Generate() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  
  // 从 LocalStorage 加载预设值
  const [formData, setFormData] = useState<FormData>(() => {
    const savedPresets = loadPresetsFromStorage();
    return {
      content: '',
      style: savedPresets.style || DEFAULT_PRESETS.style,
      colorScheme: savedPresets.colorScheme || DEFAULT_PRESETS.colorScheme,
      slideCount: savedPresets.slideCount || DEFAULT_PRESETS.slideCount,
    };
  });

  const {
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
  } = usePPTGeneration({
    onSuccess: (content) => {
      setFormData(prev => ({ ...prev, content }));
      // Scroll to top after generation completes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const { isGeneratingOutline, enhance } = usePromptEnhancement();
  const progressSteps = useProgressSteps(generationStage, progress);

  const displayMode = (isGenerating || streamingContent) ? 'renderer' : 'form';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 当预设值改变时，保存到 LocalStorage
  useEffect(() => {
    savePresetsToStorage({
      style: formData.style,
      colorScheme: formData.colorScheme,
      slideCount: formData.slideCount,
    });
  }, [formData.style, formData.colorScheme, formData.slideCount]);

  const handleGenerate = useCallback(() => {
    generate(formData);
  }, [generate, formData]);

  const handleEnhance = useCallback(async () => {
    const enhanced = await enhance(formData.content);
    if (enhanced) {
      setFormData(prev => ({ ...prev, content: enhanced }));
    }
  }, [enhance, formData.content]);

  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    reset();
    setFormData(prev => ({ ...prev, content: '' }));
  }, [reset]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(streamingContent);
  }, [streamingContent]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleRegenerateChapter = useCallback((index: number) => {
    regenerateChapter(index, formData);
  }, [regenerateChapter, formData]);

  const handleDeleteChapter = useCallback((index: number) => {
    deleteChapter(index);
  }, [deleteChapter]);

  return (
    <div className="  overflow-y-hidden pt-16">
      <BackgroundDecorations />
      <div className="relative z-10 max-w-7xl mx-auto overflow-y-hidden">
        {/* Header */}
        {/* {displayMode === 'form' && (
            <div className={`text-center mb-8 lg:mb-16 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-tech-800 mb-6 lg:mb-8">
              {t('generate.hero.title')}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                {' '}{t('generate.hero.subtitle')}
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-tech-600 max-w-4xl mx-auto leading-relaxed px-4">
              <span className="text-purple-600 font-medium">{t('generate.hero.features')}</span>
            </p>
          </div>
        )} */}
       
        <div className="max-w-7xl">
          {/* Main Form */}
          {displayMode === 'form' && (
            <GenerationForm
              formData={formData}
              onFormDataChange={setFormData}
              onGenerate={handleGenerate}
              onEnhance={handleEnhance}
              isGenerating={isGenerating}
              isGeneratingOutline={isGeneratingOutline}
            />
          )}

          {/* Generation Progress and Preview */}
          {displayMode === 'renderer' && (
            <div className="space-y-6">
              {/* 只在生成中或出错时显示进度条，完成后隐藏 */}
              {(generationStage !== 'idle' || generationStage === 'error' || progress < 100) && (
                <GenerationProgress
                  progress={progress}
                  generationStage={generationStage}
                  errorMessage={errorMessage}
                  errorDetails={errorDetails}
                  streamingContent={streamingContent}
                  progressSteps={progressSteps}
                  onRetry={handleRetry}
                  onReset={handleReset}
                />
              )}

              <GenerationPreview
                streamingContent={streamingContent}
                htmlContents={htmlContents}
                isGenerating={isGenerating}
                onContentChange={setStreamingContent}
                onCopy={handleCopy}
                onRestart={handleReset}
                onRegenerate={handleRegenerate}
                onHtmlContentUpdate={updateHtmlContent}
                onRegenerateChapter={handleRegenerateChapter}
                onDeleteChapter={handleDeleteChapter}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
