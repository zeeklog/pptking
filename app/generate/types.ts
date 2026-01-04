export type GenerationStage = 'idle' | 'connecting' | 'generating' | 'completing' | 'error';

export type DisplayMode = 'form' | 'renderer';

export interface FormData {
  content: string;
  style: string;
  colorScheme: string;
  slideCount: string;
}

export interface GenerationState {
  isGenerating: boolean;
  isGeneratingOutline: boolean;
  progress: number;
  streamingContent: string;
  generationStage: GenerationStage;
  errorMessage: string;
  displayMode: DisplayMode;
}

export interface APIError {
  error: boolean;
  message: string;
  details?: any;
  code?: number;
}

export interface ProgressStep {
  icon: any;
  label: string;
  stage: GenerationStage;
  progress: number;
  status: 'waiting' | 'processing' | 'completed' | 'error';
}

