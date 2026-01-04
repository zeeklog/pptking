import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Brain, Sparkles, CheckCircle } from 'lucide-react';
import type { GenerationStage, ProgressStep } from '../types';

export function useProgressSteps(
  generationStage: GenerationStage,
  progress: number
): ProgressStep[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const steps: ProgressStep[] = [
      { 
        icon: FileText, 
        label: t('generate.progress.connectService'), 
        stage: 'connecting',
        progress: 10,
        status: generationStage === 'connecting' ? 'processing' : 
                (progress >= 10) ? 'completed' : 'waiting'
      },
      { 
        icon: Brain, 
        label: t('generate.progress.aiAnalyzeContent'), 
        stage: 'generating',
        progress: 30,
        status: generationStage === 'generating' && progress >= 10 && progress < 50 ? 'processing' : 
                (progress >= 30) ? 'completed' : 'waiting'
      },
      { 
        icon: Sparkles, 
        label: t('generate.progress.generateOutline'), 
        stage: 'generating',
        progress: 70,
        status: generationStage === 'generating' && progress >= 30 && progress < 90 ? 'processing' : 
                (progress >= 70) ? 'completed' : 'waiting'
      },
      { 
        icon: CheckCircle, 
        label: t('generate.progress.completeGeneration'), 
        stage: 'completing',
        progress: 100,
        status: generationStage === 'completing' || progress === 100 ? 'completed' : 
                generationStage === 'error' ? 'error' : 'waiting'
      }
    ];
    
    // 处理错误状态
    if (generationStage === 'error') {
      return steps.map(step => ({ ...step, status: 'error' }));
    }
    
    // 处理完成状态：当进度为100%且不在生成中时，所有步骤都应该显示为完成
    if (progress === 100 && generationStage === 'idle') {
      return steps.map(step => ({ ...step, status: 'completed' }));
    }
    
    return steps;
  }, [generationStage, progress, t]);
}

