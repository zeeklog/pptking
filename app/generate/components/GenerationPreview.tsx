'use client';

import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye,
  Brain,
  Copy,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import EditableMarkdown from '@/components/EditableMarkdown';
import GenerationPreviewHTML from './GenerationPreviewHTML';

interface GenerationPreviewProps {
  streamingContent: string;
  htmlContents: string[];
  isGenerating: boolean;
  onContentChange: (content: string) => void;
  onCopy: () => void;
  onRestart: () => void;
  onRegenerate: () => void;
  onHtmlContentUpdate?: (index: number, content: string) => void;
  onRegenerateChapter?: (index: number) => void;
  onDeleteChapter?: (index: number) => void;
}

export function GenerationPreview({
  streamingContent,
  htmlContents,
  isGenerating,
  onContentChange,
  onCopy,
  onRestart,
  onRegenerate,
  onHtmlContentUpdate,
  onRegenerateChapter,
  onDeleteChapter,
}: GenerationPreviewProps) {
  const { t } = useTranslation();
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'preview'>('preview');

  // 处理视图模式变化
  const handleViewModeChange = (mode: 'grid' | 'preview') => {
    setCurrentViewMode(mode);
    if (mode === 'preview') {
      // 预览模式时自动收起左侧大纲
      setIsLeftPanelCollapsed(true);
    }
    // 注意：切换到grid模式时，不自动展开大纲，让用户手动控制
  };

  return (
    <Card className="template-card border-0 transition-all duration-300">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
          {/* Left: Editable outline structure */}
          {!isLeftPanelCollapsed && (
            <aside className="lg:col-span-1 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-r border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-tech-800 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-gray-600" />
                    {t('generate.ui.pptOutlineEdit')}
                    <Badge variant="outline" className="text-purple-600 border-purple-200 ml-2">
                      {t('generate.ui.realtimePreview')}
                    </Badge>
                  </h3>
                  <Button
                    onClick={() => setIsLeftPanelCollapsed(true)}
                    size="sm"
                    variant="ghost"
                    className="text-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-96 overflow-y-auto p-6">
                  {streamingContent ? (
                    <EditableMarkdown
                      content={streamingContent}
                      onChange={onContentChange}
                      className="max-w-none"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                      <div className="text-center">
                        <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg mb-2">{t('generate.ui.generatingPPTOutline')}</p>
                        <p className="text-sm">{t('generate.ui.outlineCompleteEdit')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={onCopy}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      disabled={!streamingContent}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t('generate.ui.copy')}
                    </Button>
                    <Button
                      onClick={onRestart}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t('generate.ui.restart')}
                    </Button>
                    {!isGenerating && streamingContent && (
                      <Button
                        onClick={onRegenerate}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        {t('generate.ui.regenerate')}
                      </Button>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Markdown
                  </Badge>
                </div>
                </div>
              </div>
            </aside>
          )}

          {/* Right: Real-time Markdown preview */}
          <main className={`${isLeftPanelCollapsed ? 'lg:col-span-2' : 'lg:col-span-1'} p-6 transition-all duration-300 relative`}>
            {isLeftPanelCollapsed && (
              <Button
                onClick={() => setIsLeftPanelCollapsed(false)}
                size="sm"
                variant="ghost"
                className="absolute top-2 left-2 z-10 text-gray-600 bg-white shadow-sm hover:shadow-md"
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                展开大纲
              </Button>
            )}
            <GenerationPreviewHTML
              htmlContents={htmlContents}
              isGenerating={isGenerating}
              onCopy={onCopy}
              onRestart={onRestart}
              onRegenerate={onRegenerate}
              onHtmlContentUpdate={onHtmlContentUpdate}
              onRegenerateChapter={onRegenerateChapter}
              onDeleteChapter={onDeleteChapter}
              onViewModeChange={handleViewModeChange}
            />
          </main>
        </div>
      </CardContent>
    </Card>
  );
}

