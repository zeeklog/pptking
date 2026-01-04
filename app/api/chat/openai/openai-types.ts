// OpenAI API 类型定义

export interface OpenAIListModelResponse {
  data: Array<{
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
  }>;
  object: string;
}

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}