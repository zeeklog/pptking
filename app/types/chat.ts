export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'function' | 'agent';
  content: string | MultimodalContent[];
  date: string;
  streaming?: boolean;
  preview?: boolean;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  // AI Agent 扩展字段
  agent_type?: AgentType;
  agent_name?: string;
  agent_avatar?: string;
  agent_description?: string;
  // 消息元数据
  metadata?: MessageMetadata;
  // 消息状态
  status?: MessageStatus;
  // 消息标签
  tags?: string[];
  // 消息优先级
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // 消息来源
  source?: MessageSource;
  // 消息关联
  parent_id?: string;
  children_ids?: string[];
  // 消息上下文
  context?: MessageContext;
}

export interface MultimodalContent {
  type: 'text' | 'image_url' | 'audio_url' | 'video_url' | 'file_url' | 'code' | 'data';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
    alt_text?: string;
  };
  audio_url?: {
    url: string;
    duration?: number;
    format?: string;
  };
  video_url?: {
    url: string;
    duration?: number;
    format?: string;
    thumbnail?: string;
  };
  file_url?: {
    url: string;
    filename: string;
    size?: number;
    mime_type?: string;
  };
  code?: {
    language: string;
    code: string;
    filename?: string;
  };
  data?: {
    format: 'json' | 'csv' | 'xml' | 'yaml';
    content: string;
    schema?: any;
  };
}

export interface ToolCall {
  id: string;
  type: 'function' | 'api' | 'database' | 'file' | 'web_search' | 'code_execution';
  function?: {
    name: string;
    arguments: string;
    description?: string;
  };
  api?: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  database?: {
    query: string;
    database: string;
    table?: string;
  };
  file?: {
    operation: 'read' | 'write' | 'delete' | 'list';
    path: string;
    content?: string;
  };
  web_search?: {
    query: string;
    engine?: string;
    filters?: any;
  };
  code_execution?: {
    language: string;
    code: string;
    environment?: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
}

export interface ChatSession {
  id: string;
  topic: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  provider?: string;
  agents?: AgentConfig[];
  context?: SessionContext;
}

export interface ChatConfig {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  enableCodeFold: boolean;
  enableArtifacts: boolean;
  fontSize: number;
  fontFamily: string;
}

export interface MessageAction {
  type: 'edit' | 'delete' | 'retry' | 'copy' | 'pin' | 'bookmark' | 'share' | 'export';
  messageId: string;
  data?: any;
}

export interface CodeBlock {
  language: string;
  code: string;
  isCollapsed?: boolean;
  showToggle?: boolean;
  filename?: string;
  lineNumbers?: boolean;
  highlightLines?: number[];
}

export interface MermaidChart {
  code: string;
  hasError: boolean;
  theme?: string;
  config?: any;
}

export interface HTMLPreview {
  code: string;
  isFullscreen: boolean;
  sandbox?: string;
}

// AI Agent 相关类型
export type AgentType = 
  | 'general' 
  | 'code_assistant' 
  | 'data_analyst' 
  | 'designer' 
  | 'writer' 
  | 'translator' 
  | 'researcher' 
  | 'planner' 
  | 'executor' 
  | 'reviewer' 
  | 'custom';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  avatar?: string;
  capabilities: string[];
  tools: string[];
  model?: string;
  temperature?: number;
  system_prompt?: string;
  examples?: string[];
  constraints?: string[];
}

export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokens_used?: number;
  processing_time?: number;
  confidence_score?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  entities?: Entity[];
  language?: string;
  detected_language?: string;
  translation_source?: string;
  quality_score?: number;
  user_feedback?: UserFeedback;
}

export interface Entity {
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface UserFeedback {
  rating?: number;
  helpful?: boolean;
  comment?: string;
  timestamp: string;
}

export type MessageStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'retrying';

export interface MessageSource {
  type: 'user_input' | 'api_call' | 'webhook' | 'scheduled' | 'manual' | 'integration';
  name?: string;
  url?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MessageContext {
  session_id: string;
  conversation_id?: string;
  thread_id?: string;
  user_id?: string;
  workspace_id?: string;
  project_id?: string;
  environment?: 'development' | 'staging' | 'production';
  client_info?: {
    user_agent: string;
    ip_address?: string;
    location?: string;
  };
  previous_messages?: string[];
  related_files?: string[];
  external_references?: ExternalReference[];
}

export interface ExternalReference {
  type: 'url' | 'file' | 'database' | 'api' | 'document';
  url?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SessionContext {
  agents: AgentConfig[];
  tools: ToolDefinition[];
  settings: SessionSettings;
  permissions: Permission[];
  constraints: Constraint[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type: 'function' | 'api' | 'database' | 'file' | 'web_search' | 'code_execution';
  parameters: ToolParameter[];
  examples: ToolExample[];
  enabled: boolean;
  rate_limit?: RateLimit;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

export interface ToolExample {
  input: Record<string, any>;
  output: any;
  description: string;
}

export interface RateLimit {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
}

export interface SessionSettings {
  language: string;
  timezone: string;
  date_format: string;
  number_format: string;
  theme: 'light' | 'dark' | 'auto';
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
}

export interface AccessibilitySettings {
  screen_reader: boolean;
  high_contrast: boolean;
  large_text: boolean;
  reduced_motion: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  in_app: boolean;
  sound: boolean;
}

export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
  conditions?: Record<string, any>;
}

export interface Constraint {
  type: 'content' | 'rate' | 'size' | 'format' | 'security';
  rule: string;
  description: string;
  enforced: boolean;
}

// 渲染相关类型
export interface RenderConfig {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  codeTheme: string;
  enableAnimations: boolean;
  enableTooltips: boolean;
  enableKeyboardShortcuts: boolean;
  maxImageSize: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  security: SecurityConfig;
}

export interface SecurityConfig {
  allowExternalImages: boolean;
  allowExternalLinks: boolean;
  allowScripts: boolean;
  allowIframes: boolean;
  sanitizeHtml: boolean;
  contentSecurityPolicy: string;
}

// 消息渲染组件类型
export interface MessageRenderProps {
  message: ChatMessage;
  config: RenderConfig;
  onAction: (action: MessageAction) => void;
  onToolCall: (toolCall: ToolCall) => void;
  onAgentSwitch: (agentId: string) => void;
  className?: string;
}

export interface ToolCallRenderProps {
  toolCall: ToolCall;
  onRetry: () => void;
  onCancel: () => void;
  onViewResult: () => void;
  className?: string;
}

export interface AgentRenderProps {
  agent: AgentConfig;
  isActive: boolean;
  onSelect: () => void;
  onConfigure: () => void;
  className?: string;
}
