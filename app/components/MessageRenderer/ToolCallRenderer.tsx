'use client';

import { useState } from 'react';
import { ToolCall } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Square, 
  RotateCcw, 
  Eye, 
  Copy, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Zap,
  Settings,
  Globe,
  Database,
  FolderOpen,
  Search,
  Code,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/message-utils';

interface ToolCallRendererProps {
  toolCall: ToolCall;
  onRetry?: () => void;
  onCancel?: () => void;
  onViewResult?: () => void;
  className?: string;
}

export function ToolCallRenderer({
  toolCall,
  onRetry,
  onCancel,
  onViewResult,
  className,
}: ToolCallRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-info-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-tech-500" />;
      default:
        return <Clock className="w-4 h-4 text-tech-500" />;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'pending':
        return 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 border-warning-200 dark:border-warning-700';
      case 'running':
        return 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-300 border-info-200 dark:border-info-700';
      case 'completed':
        return 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300 border-success-200 dark:border-success-700';
      case 'failed':
        return 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-300 border-error-200 dark:border-error-700';
      case 'cancelled':
        return 'bg-tech-50 text-tech-700 dark:bg-tech-900/30 dark:text-tech-300 border-tech-200 dark:border-tech-700';
      default:
        return 'bg-tech-50 text-tech-700 dark:bg-tech-900/30 dark:text-tech-300 border-tech-200 dark:border-tech-700';
    }
  };

  const getToolTypeIcon = () => {
    switch (toolCall.type) {
      case 'function':
        return <Settings className="w-5 h-5 text-purple-500" />;
      case 'api':
        return <Globe className="w-5 h-5 text-blue-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-green-500" />;
      case 'file':
        return <FolderOpen className="w-5 h-5 text-orange-500" />;
      case 'web_search':
        return <Search className="w-5 h-5 text-purple-500" />;
      case 'code_execution':
        return <Code className="w-5 h-5 text-indigo-500" />;
      default:
        return <Wrench className="w-5 h-5 text-tech-500" />;
    }
  };

  const getToolName = () => {
    if (toolCall.function) {
      return toolCall.function.name;
    }
    if (toolCall.api) {
      return `${toolCall.api.method} ${toolCall.api.endpoint}`;
    }
    if (toolCall.database) {
      return `Database: ${toolCall.database.database}`;
    }
    if (toolCall.file) {
      return `File: ${toolCall.file.operation}`;
    }
    if (toolCall.web_search) {
      return `Search: ${toolCall.web_search.query}`;
    }
    if (toolCall.code_execution) {
      return `Code: ${toolCall.code_execution.language}`;
    }
    return 'Unknown Tool';
  };

  const getToolDetails = () => {
    if (toolCall.function) {
      return {
        title: 'Function Call',
        details: [
          { label: 'Function', value: toolCall.function.name },
          { label: 'Arguments', value: toolCall.function.arguments },
          ...(toolCall.function.description ? [{ label: 'Description', value: toolCall.function.description }] : []),
        ],
      };
    }
    if (toolCall.api) {
      return {
        title: 'API Call',
        details: [
          { label: 'Method', value: toolCall.api.method },
          { label: 'Endpoint', value: toolCall.api.endpoint },
          ...(toolCall.api.headers ? [{ label: 'Headers', value: JSON.stringify(toolCall.api.headers, null, 2) }] : []),
          ...(toolCall.api.body ? [{ label: 'Body', value: JSON.stringify(toolCall.api.body, null, 2) }] : []),
        ],
      };
    }
    if (toolCall.database) {
      return {
        title: 'Database Query',
        details: [
          { label: 'Database', value: toolCall.database.database },
          ...(toolCall.database.table ? [{ label: 'Table', value: toolCall.database.table }] : []),
          { label: 'Query', value: toolCall.database.query },
        ],
      };
    }
    if (toolCall.file) {
      return {
        title: 'File Operation',
        details: [
          { label: 'Operation', value: toolCall.file.operation },
          { label: 'Path', value: toolCall.file.path },
          ...(toolCall.file.content ? [{ label: 'Content', value: toolCall.file.content }] : []),
        ],
      };
    }
    if (toolCall.web_search) {
      return {
        title: 'Web Search',
        details: [
          { label: 'Query', value: toolCall.web_search.query },
          ...(toolCall.web_search.engine ? [{ label: 'Engine', value: toolCall.web_search.engine }] : []),
          ...(toolCall.web_search.filters ? [{ label: 'Filters', value: JSON.stringify(toolCall.web_search.filters, null, 2) }] : []),
        ],
      };
    }
    if (toolCall.code_execution) {
      return {
        title: 'Code Execution',
        details: [
          { label: 'Language', value: toolCall.code_execution.language },
          ...(toolCall.code_execution.environment ? [{ label: 'Environment', value: toolCall.code_execution.environment }] : []),
          { label: 'Code', value: toolCall.code_execution.code },
        ],
      };
    }
    return {
      title: 'Tool Call',
      details: [],
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadResult = () => {
    if (!toolCall.result) return;
    
    const blob = new Blob([JSON.stringify(toolCall.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tool-result-${toolCall.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toolDetails = getToolDetails();

  return (
    <Card className={cn(
      'border-l-4 border-l-purple-500 bg-white dark:bg-tech-800',
      'border border-purple-200 dark:border-purple-700',
      'shadow-purple-sm hover:shadow-purple-md transition-all duration-300',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-lgborder-purple-200 dark:border-purple-700">
              {getToolTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-tech-700 dark:text-tech-200">
                {getToolName()}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon()}
                <Badge className={cn('text-xs border', getStatusColor())}>
                  {toolCall.status}
                </Badge>
                {toolCall.duration && (
                  <span className="text-xs text-tech-500 dark:text-tech-400">
                    {formatDuration(toolCall.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {toolCall.status === 'running' && onCancel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-800/50border-error-200 dark:border-error-700"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
            {toolCall.status === 'failed' && onRetry && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRetry}
                className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/50border-purple-200 dark:border-purple-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {toolCall.result && onViewResult && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewResult}
                className="bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 hover:bg-info-100 dark:hover:bg-info-800/50border-info-200 dark:border-info-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/50border-purple-200 dark:border-purple-700"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 工具详情 */}
            <div className="p-4 rounded-lgborder-purple-200 dark:border-purple-700">
              <h4 className="text-sm font-semibold mb-3 text-tech-700 dark:text-tech-200">{toolDetails.title}</h4>
              <div className="space-y-3">
                {toolDetails.details.map((detail, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-tech-600 dark:text-tech-300">{detail.label}: </span>
                    <pre className="mt-2 p-3 bg-white dark:bg-tech-900 rounded-lg text-xs overflow-x-autoborder-purple-200 dark:border-purple-700 shadow-purple-sm">
                      {detail.value}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* 错误信息 */}
            {toolCall.error && (
              <div className="p-4 bg-error-50 dark:bg-error-900/30border-error-200 dark:border-error-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-error-600 dark:text-error-400" />
                  <span className="text-sm font-semibold text-error-800 dark:text-error-200">Error</span>
                </div>
                <p className="text-sm text-error-700 dark:text-error-300 mt-2">{toolCall.error}</p>
              </div>
            )}

            {/* 执行结果 */}
            {toolCall.result && (
              <div className="p-4 bg-success-50 dark:bg-success-900/30border-success-200 dark:border-success-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-success-800 dark:text-success-200">Result</h4>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(toolCall.result, null, 2))}
                      className="bg-white dark:bg-tech-800 text-success-600 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-800/50border-success-200 dark:border-success-700"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={downloadResult}
                      className="bg-white dark:bg-tech-800 text-success-600 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-800/50border-success-200 dark:border-success-700"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <pre className="p-3 bg-white dark:bg-tech-900 rounded-lg text-xs overflow-x-auto max-h-64border-success-200 dark:border-success-700 shadow-purple-sm">
                  {JSON.stringify(toolCall.result, null, 2)}
                </pre>
              </div>
            )}

            {/* 时间信息 */}
            {(toolCall.start_time || toolCall.end_time) && (
              <div className="text-xs text-tech-500 dark:text-tech-400 p-3 bg-tech-50 dark:bg-tech-900/30 rounded-lgborder-tech-200 dark:border-tech-700">
                {toolCall.start_time && (
                  <div>Started: {new Date(toolCall.start_time).toLocaleString()}</div>
                )}
                {toolCall.end_time && (
                  <div>Ended: {new Date(toolCall.end_time).toLocaleString()}</div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
