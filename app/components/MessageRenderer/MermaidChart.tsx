'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidChartProps {
  code: string;
  hasError: boolean;
  theme?: string;
  config?: any;
}

export function MermaidChart({ code, hasError, theme = 'default', config }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(hasError);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code || !ref.current) return;

    const renderMermaid = async () => {
      try {
        setIsLoading(true);
        setError(false);
        
        // 动态导入mermaid
        const mermaid = (await import('mermaid')).default;
        
        // 配置mermaid
        mermaid.initialize({
          theme: theme,
          startOnLoad: false,
          ...config,
        });

        // 渲染图表
        await mermaid.run({
          nodes: [ref.current!],
          suppressErrors: true,
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('[Mermaid]', err);
        setError(true);
        setIsLoading(false);
      }
    };

    renderMermaid();
  }, [code, theme, config]);

  const viewInNewWindow = () => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.document.title = 'Mermaid Chart';
    }
  };

  const downloadSvg = () => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-chart.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <span className="text-sm text-red-700">Mermaid 图表渲染失败</span>
        </div>
        <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* 操作按钮 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={viewInNewWindow}
          className="bg-background/80 backdrop-blur-smborder-border hover:bg-background"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={downloadSvg}
          className="bg-background/80 backdrop-blur-smborder-border hover:bg-background"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Mermaid 图表容器 */}
      <div
        ref={ref}
        className={cn(
          'border border-border rounded-lg p-4 bg-background',
          'cursor-pointer overflow-auto',
          isLoading && 'animate-pulse'
        )}
        onClick={viewInNewWindow}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="ml-2 text-sm text-muted-foreground">渲染图表中...</span>
          </div>
        )}
        {!isLoading && <div className="mermaid">{code}</div>}
      </div>
    </div>
  );
}
