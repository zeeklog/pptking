'use client';

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  Brain,
  RefreshCw,
} from "lucide-react";
import type { GenerationStage, ProgressStep } from '../types';

interface GenerationProgressProps {
  progress: number;
  generationStage: GenerationStage;
  errorMessage: string;
  errorDetails?: any;
  streamingContent: string;
  progressSteps: ProgressStep[];
  onRetry: () => void;
  onReset: () => void;
}

export function GenerationProgress({
  progress,
  generationStage,
  errorMessage,
  errorDetails,
  streamingContent,
  progressSteps,
  onRetry,
  onReset,
}: GenerationProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-md p-4 mb-4">
      <div className="flex items-center space-x-4">
        {/* Status icon and title */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
            generationStage === 'error' ? "bg-red-100 text-red-600" :
            generationStage === 'idle' && progress === 100 ? "bg-green-100 text-tech-600" :
            generationStage !== 'idle' ? "bg-purple-100 text-purple-600" :
            "bg-gray-100 text-gray-400"
          )}>
            {generationStage === 'error' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : generationStage === 'idle' && progress === 100 ? (
              <CheckCircle className="w-4 h-4" />
            ) : generationStage !== 'idle' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 truncate">
                {generationStage === 'idle' && progress === 100 ? t('generate.ui.pptOutlineGenerated') :
                 generationStage === 'connecting' ? t('generate.ui.connectingService') :
                 generationStage === 'generating' ? t('generate.ui.aiGenerating') :
                 generationStage === 'completing' ? t('generate.ui.completing') :
                 generationStage === 'error' ? t('generate.ui.generationFailed') :
                 t('generate.ui.pptOutlineGeneration')}
              </span>
              {streamingContent && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {streamingContent.split('\n').filter(line => line.trim().startsWith('#')).length} {t('generate.ui.chapters')}
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <div className={cn(
                    "h-2 rounded-full overflow-hidden transition-all duration-300",
                    generationStage === 'error' ? "bg-red-100" : "bg-gray-100"
                  )}>
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 ease-out relative overflow-hidden",
                        generationStage === 'error' ? "bg-red-400" :
                        progress === 100 ? "bg-gradient-to-r from-green-400 to-green-500" :
                        "bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500"
                      )}
                      style={{ width: `${progress}%` }}
                    >
                      {/* Progress bar animation */}
                      {progress > 0 && progress < 100 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "text-sm font-bold min-w-[3rem] text-right transition-colors duration-300",
                  generationStage === 'error' ? "text-red-600" :
                  progress === 100 ? "text-green-600" :
                  "text-purple-600"
                )}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact step indicators */}
        <div className="hidden lg:flex items-center space-x-2">
          {progressSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = step.status === 'completed';
            const isProcessing = step.status === 'processing';
            const isError = step.status === 'error';
            
            return (
              <div key={index} className="relative group">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && !isError ? "bg-green-500 text-white" :
                  isProcessing && !isError ? "bg-purple-500 text-white" : 
                  isError ? "bg-red-500 text-white" :
                  "bg-gray-300 text-gray-500"
                )}>
                  {isError ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {step.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error retry button */}
        {generationStage === 'error' && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {t('generate.ui.retry')}
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              {t('generate.ui.backToForm')}
            </Button>
          </div>
        )}
      </div>

      {/* Error details (collapsible) */}
      {generationStage === 'error' && (errorMessage || errorDetails) && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
            {errorMessage}
          </p>
          {errorDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Technical details</summary>
              <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

