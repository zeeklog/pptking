'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Copy, RefreshCw, Sparkles, Maximize2, Edit2, Save, X, Trash2, LayoutGrid, Presentation } from 'lucide-react';

type ViewMode = 'grid' | 'preview';

interface GenerationPreviewProps {
  htmlContents: string[];
  isGenerating: boolean;
  onCopy: () => void;
  onRestart: () => void;
  onRegenerate: () => void;
  onHtmlContentUpdate?: (index: number, content: string) => void;
  onRegenerateChapter?: (index: number) => void;
  onDeleteChapter?: (index: number) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

export default function GenerationPreview({
  htmlContents = [],
  isGenerating,
  onCopy,
  onRestart,
  onRegenerate,
  onHtmlContentUpdate,
  onRegenerateChapter,
  onDeleteChapter,
  onViewModeChange,
}: GenerationPreviewProps) {
  const { t } = useTranslation();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // 当视图模式改变时通知父组件
  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  // 当有内容时，确保当前预览索引有效
  useEffect(() => {
    if (htmlContents.length > 0 && currentPreviewIndex >= htmlContents.length) {
      setCurrentPreviewIndex(htmlContents.length - 1);
    }
  }, [htmlContents.length, currentPreviewIndex]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <Card className="template-card border-0 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-tech-800 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-gray-600" />
              实时预览
              <Badge variant="outline" className="text-purple-600 border-purple-200 ml-2">
                {htmlContents.length} Items
              </Badge>
            </h3>
            {/* View Mode Toggle */}
            {htmlContents.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  onClick={() => handleViewModeChange('preview')}
                  className="h-8 px-3"
                >
                  <Presentation className="w-4 h-4 mr-1" />
                  预览模式
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => handleViewModeChange('grid')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  平铺模式
                </Button>
              </div>
            )}
          </div>

          {/* Content Container */}
          <div className="bg-white">
            {htmlContents.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-gray-400 p-6">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No HTML Content</p>
                  <p className="text-sm">Waiting for HTML content to preview...</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid Mode (平铺模式)
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
                  {htmlContents.map((htmlContent, index) => (
                    <HTMLIframe
                      key={index}
                      htmlContent={htmlContent}
                      index={index}
                      onPreview={() => setPreviewIndex(index)}
                      onUpdate={(content) => onHtmlContentUpdate?.(index, content)}
                      onRegenerate={() => onRegenerateChapter?.(index)}
                      onDelete={() => onDeleteChapter?.(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Preview Mode (预览模式)
              <div className="flex h-[600px]">
                {/* Left: Thumbnail list */}
                <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
                  <div className="p-3 space-y-2">
                    {htmlContents.map((htmlContent, index) => (
                      <ThumbnailPreview
                        key={index}
                        htmlContent={htmlContent}
                        index={index}
                        isActive={index === currentPreviewIndex}
                        onClick={() => setCurrentPreviewIndex(index)}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: Large preview */}
                <div className="flex-1 p-6 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        第 {currentPreviewIndex + 1} 页 / 共 {htmlContents.length} 页
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setPreviewIndex(currentPreviewIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          全屏预览
                        </Button>
                        <Button
                          onClick={() => onRegenerateChapter?.(currentPreviewIndex)}
                          size="sm"
                          variant="outline"
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          重新生成
                        </Button>
                        <Button
                          onClick={() => {
                            if (htmlContents.length > 1) {
                              onDeleteChapter?.(currentPreviewIndex);
                              if (currentPreviewIndex >= htmlContents.length - 1) {
                                setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1));
                              }
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden shadow-xl">
                      <LargePreviewIframe
                        htmlContent={htmlContents[currentPreviewIndex]}
                        index={currentPreviewIndex}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Fullscreen Preview Dialog */}
      {previewIndex !== null && (
        <FullscreenPreviewDialog
          htmlContents={htmlContents}
          currentIndex={previewIndex}
          isOpen={previewIndex !== null}
          onClose={() => {
            setPreviewIndex(null);
            setIsEditing(false);
          }}
          onIndexChange={setPreviewIndex}
          isEditing={isEditing}
          onEditToggle={setIsEditing}
          onUpdate={(content) => {
            onHtmlContentUpdate?.(previewIndex, content);
          }}
        />
      )}
    </Card>
  );
}

/**
 * 缩略图预览组件
 */
interface ThumbnailPreviewProps {
  htmlContent: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function ThumbnailPreview({ htmlContent, index, isActive, onClick }: ThumbnailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: transparent;
              overflow: hidden;
            }
            
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            #content-wrapper {
              width: 100%;
              aspect-ratio: 16 / 9;
              overflow: hidden;
              background: transparent;
              position: relative;
              transform: scale(0.5);
              transform-origin: center;
            }
            
            #content-wrapper > * {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="content-wrapper"></div>
          <script>
            (function() {
              const contentWrapper = document.getElementById('content-wrapper');
              const htmlString = \`${escapeJs(htmlContent)}\`;
              const temp = document.createElement('div');
              temp.innerHTML = htmlString;
              let bodyContent = temp.querySelector('body');
              if (bodyContent) {
                contentWrapper.innerHTML = bodyContent.innerHTML;
              } else {
                contentWrapper.innerHTML = htmlString;
              }
              const scripts = contentWrapper.querySelectorAll('script');
              scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                  newScript.src = script.src;
                } else {
                  newScript.textContent = script.textContent;
                }
                script.parentNode.removeChild(script);
                document.body.appendChild(newScript);
              });
            })();
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHTML);
    doc.close();
  }, [htmlContent]);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border-2 overflow-hidden transition-all hover:shadow-md ${
        isActive
          ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-black relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 pointer-events-none"
          title={`Thumbnail ${index + 1}`}
          sandbox="allow-same-origin allow-scripts"
          style={{
            display: 'block',
            background: 'transparent',
          }}
        />
        {isActive && (
          <div className="absolute inset-0 border-2 border-purple-500 pointer-events-none" />
        )}
      </div>
      <div className="p-2 bg-white">
        <p className="text-xs font-medium text-gray-700 text-center">
          第 {index + 1} 页
        </p>
      </div>
    </button>
  );
}

/**
 * 大预览 iframe 组件
 */
interface LargePreviewIframeProps {
  htmlContent: string;
  index: number;
}

function LargePreviewIframe({ htmlContent, index }: LargePreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: transparent;
              overflow: hidden;
            }
            
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            #content-wrapper {
              width: 100%;
              aspect-ratio: 16 / 9;
              overflow: hidden;
              background: transparent;
              position: relative;
            }
            
            #content-wrapper > * {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="content-wrapper"></div>
          <script>
            (function() {
              const contentWrapper = document.getElementById('content-wrapper');
              const htmlString = \`${escapeJs(htmlContent)}\`;
              const temp = document.createElement('div');
              temp.innerHTML = htmlString;
              let bodyContent = temp.querySelector('body');
              if (bodyContent) {
                contentWrapper.innerHTML = bodyContent.innerHTML;
              } else {
                contentWrapper.innerHTML = htmlString;
              }
              const scripts = contentWrapper.querySelectorAll('script');
              scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                  newScript.src = script.src;
                } else {
                  newScript.textContent = script.textContent;
                }
                script.parentNode.removeChild(script);
                document.body.appendChild(newScript);
              });
            })();
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHTML);
    doc.close();
  }, [htmlContent, index]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title={`Large Preview ${index + 1}`}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
      style={{
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}

interface HTMLIframeProps {
  htmlContent: string;
  index: number;
  onPreview: () => void;
  onUpdate?: (content: string) => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

function HTMLIframe({ htmlContent, index, onPreview, onUpdate, onRegenerate, onDelete }: HTMLIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    // 创建完整的HTML文档，包含严格的16:9宽高比限制
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: transparent;
              overflow: hidden;
            }
            
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            #content-wrapper {
              width: 100%;
              aspect-ratio: 16 / 9;
              overflow: hidden;
              background: transparent;
              position: relative;
            }
            
            /* 样式隔离 */
            #content-wrapper > * {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="content-wrapper"></div>
          <script>
            (function() {
              const contentWrapper = document.getElementById('content-wrapper');
              
              // 提取HTML内容
              const htmlString = \`${escapeJs(htmlContent)}\`;
              
              // 创建临时容器用于解析
              const temp = document.createElement('div');
              temp.innerHTML = htmlString;
              
              // 提取body内容或整个内容
              let bodyContent = temp.querySelector('body');
              if (bodyContent) {
                contentWrapper.innerHTML = bodyContent.innerHTML;
              } else {
                contentWrapper.innerHTML = htmlString;
              }
              
              // 提取并执行脚本，隔离在iframe内部
              const scripts = contentWrapper.querySelectorAll('script');
              scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                  newScript.src = script.src;
                } else {
                  newScript.textContent = script.textContent;
                }
                script.parentNode.removeChild(script);
                document.body.appendChild(newScript);
              });
            })();
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHTML);
    doc.close();
  }, [htmlContent]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 p-4 relative group">
      <div className="w-full aspect-video bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-400 overflow-hidden shadow-lg relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title={`HTML Preview ${index + 1}`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
          style={{
            display: 'block',
            background: 'transparent',
          }}
        />
        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            onClick={onPreview}
            size="sm"
            className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            放大预览
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
      
        <div className="flex items-center gap-1">
          <Button
            onClick={onPreview}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            预览
          </Button>
          <Button
            onClick={onRegenerate}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            重新生成
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 全屏预览对话框组件
 */
interface FullscreenPreviewDialogProps {
  htmlContents: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  isEditing: boolean;
  onEditToggle: (editing: boolean) => void;
  onUpdate: (content: string) => void;
}

function FullscreenPreviewDialog({
  htmlContents,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  isEditing,
  onEditToggle,
  onUpdate,
}: FullscreenPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlContent = htmlContents[currentIndex] || '';
  const [editedContent, setEditedContent] = useState(htmlContent);

  // 当htmlContent或currentIndex改变时，同步更新editedContent
  useEffect(() => {
    if (htmlContent) {
      setEditedContent(htmlContent);
    }
  }, [htmlContent, currentIndex]);

  // 当编辑模式切换时，重置编辑内容
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(htmlContent);
    }
  }, [isEditing, htmlContent]);

  useEffect(() => {
    if (!iframeRef.current || !isOpen) return;

    const iframe = iframeRef.current;
    
    // 渲染内容的函数
    const renderContent = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          console.warn('Cannot access iframe document');
          return;
        }

        // 使用最新的htmlContent，而不是editedContent
        const contentToRender = htmlContent || '';
        
        if (!contentToRender.trim()) {
          console.warn('No content to render');
          return;
        }

      // 创建完整的HTML文档，支持编辑模式
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: transparent;
                overflow: ${isEditing ? 'auto' : 'hidden'};
              }
              
              body {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              
              #content-wrapper {
                width: 100%;
                max-width: 100%;
                aspect-ratio: 16 / 9;
                overflow: ${isEditing ? 'auto' : 'hidden'};
                background: transparent;
                position: relative;
                ${isEditing ? 'outline: 2px dashed #9333ea; outline-offset: 4px;' : ''}
              }
              
              /* 编辑模式下的样式 */
              ${isEditing ? `
              #content-wrapper [contenteditable="true"] {
                min-height: 20px;
                padding: 2px;
                border-radius: 4px;
                transition: background-color 0.2s;
              }
              
              #content-wrapper [contenteditable="true"]:hover {
                background-color: rgba(147, 51, 234, 0.1);
              }
              
              #content-wrapper [contenteditable="true"]:focus {
                background-color: rgba(147, 51, 234, 0.15);
                outline: 2px solid #9333ea;
                outline-offset: 2px;
              }
              ` : ''}
              
              /* 样式隔离 */
              #content-wrapper > * {
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <div id="content-wrapper" ${isEditing ? 'contenteditable="true"' : ''}></div>
            <script>
              (function() {
                const contentWrapper = document.getElementById('content-wrapper');
                const isEditing = ${isEditing};
                
                // 提取HTML内容 - 使用最新的内容
                const htmlString = \`${escapeJs(contentToRender)}\`;
                
                // 创建临时容器用于解析
                const temp = document.createElement('div');
                temp.innerHTML = htmlString;
                
                // 提取body内容或整个内容
                let bodyContent = temp.querySelector('body');
                if (bodyContent) {
                  contentWrapper.innerHTML = bodyContent.innerHTML;
                } else {
                  contentWrapper.innerHTML = htmlString;
                }
                
                // 编辑模式下，为所有元素添加 contenteditable
                if (isEditing) {
                  const makeEditable = (element) => {
                    if (element.nodeType === Node.ELEMENT_NODE) {
                      // 跳过 script 和 style 标签
                      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                        return;
                      }
                      element.setAttribute('contenteditable', 'true');
                      Array.from(element.children).forEach(makeEditable);
                    }
                  };
                  Array.from(contentWrapper.children).forEach(makeEditable);
                  
                  // 监听内容变化
                  contentWrapper.addEventListener('input', function() {
                    if (window.parent && window.parent.postMessage) {
                      window.parent.postMessage({
                        type: 'html-content-update',
                        content: contentWrapper.innerHTML
                      }, '*');
                    }
                  });
                }
                
                // 提取并执行脚本，隔离在iframe内部
                const scripts = contentWrapper.querySelectorAll('script');
                scripts.forEach(script => {
                  const newScript = document.createElement('script');
                  if (script.src) {
                    newScript.src = script.src;
                  } else {
                    newScript.textContent = script.textContent;
                  }
                  script.parentNode.removeChild(script);
                  document.body.appendChild(newScript);
                });
              })();
            </script>
          </body>
        </html>
      `;

        doc.open();
        doc.write(fullHTML);
        doc.close();
      } catch (error) {
        console.error('Error rendering content to iframe:', error);
        // 如果失败，等待iframe加载完成后再试
        setTimeout(() => {
          try {
            renderContent();
          } catch (retryError) {
            console.error('Retry render failed:', retryError);
          }
        }, 100);
      }
    };

    // 尝试渲染内容
    let loadHandler: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    const attemptRender = () => {
      // 检查iframe是否准备好
      if (iframe.contentDocument || iframe.contentWindow) {
        renderContent();
      } else {
        // 如果iframe还没准备好，等待load事件
        loadHandler = () => {
          renderContent();
          if (loadHandler) {
            iframe.removeEventListener('load', loadHandler);
            loadHandler = null;
          }
        };
        iframe.addEventListener('load', loadHandler);
        
        // 也尝试在短时间内重试（防止load事件没有触发）
        retryTimeout = setTimeout(() => {
          if (iframe.contentDocument || iframe.contentWindow) {
            renderContent();
          }
          retryTimeout = null;
        }, 100);
      }
    };

    // 使用requestAnimationFrame确保DOM已更新
    const rafId = requestAnimationFrame(() => {
      attemptRender();
    });

    // 监听来自 iframe 的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'html-content-update') {
        setEditedContent(event.data.content);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      cancelAnimationFrame(rafId);
      if (loadHandler) {
        iframe.removeEventListener('load', loadHandler);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent, currentIndex, isEditing, isOpen]);

  const handleSave = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    const contentWrapper = doc.getElementById('content-wrapper');
    if (contentWrapper) {
      const updatedContent = contentWrapper.innerHTML;
      onUpdate(updatedContent);
      onEditToggle(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              全屏预览 - Preview {currentIndex + 1} / {htmlContents.length}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                  <Button
                    onClick={() => onEditToggle(false)}
                    size="sm"
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    取消编辑
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => onEditToggle(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-gray-100 flex">
          {/* Left sidebar: Thumbnail list */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">页面列表</h3>
              {htmlContents.map((htmlContent, index) => (
                <ThumbnailPreview
                  key={index}
                  htmlContent={htmlContent}
                  index={index}
                  isActive={index === currentIndex}
                  onClick={() => onIndexChange(index)}
                />
              ))}
            </div>
          </div>

          {/* Right: Preview area */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full max-w-[85vw] bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  title={`Fullscreen Preview ${currentIndex + 1}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                  style={{
                    display: 'block',
                    background: 'transparent',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 安全地转义JavaScript字符串
 */
function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}