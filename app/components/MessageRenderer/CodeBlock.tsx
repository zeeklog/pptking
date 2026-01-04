'use client';

import { useRef, useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  enableCodeFold?: boolean;
}

export function CodeBlock({ children, className, enableCodeFold = true }: CodeBlockProps) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('');
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    if (ref.current) {
      // 检测语言
      const codeElement = ref.current.querySelector('code');
      if (codeElement) {
        const classNames = codeElement.className.split(' ');
        const langClass = classNames.find(cls => cls.startsWith('language-'));
        if (langClass) {
          setLanguage(langClass.replace('language-', ''));
        }
        
        // 计算行数
        const text = codeElement.textContent || '';
        const lines = text.split('\n');
        setLineCount(lines.length);
      }
    }
  }, [children]);

  const copyCode = async () => {
    if (ref.current) {
      const codeElement = ref.current.querySelector('code');
      if (codeElement) {
        try {
          await navigator.clipboard.writeText(codeElement.textContent || '');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      }
    }
  };

  const renderLineNumbers = () => {
    if (!ref.current) return null;
    
    const lines = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(
        <div key={i} className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-mono select-none leading-6">
          {i}
        </div>
      );
    }
    return lines;
  };

  return (
    <div className="relative group my-6">
      {/* 代码块容器 */}
      <div className="relative bg-[#EEF2FF] dark:bg-[#1F2937] border border-[#C7D2FE] dark:border-[#374151] rounded-xl overflow-hidden shadow-[0_4px_6px_rgba(99,102,241,0.1)] backdrop-blur-sm">
        {/* 复制按钮 - 右上角 */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-all duration-300',
              'bg-[#C7D2FE] hover:bg-[#A5B4FC] border border-[#C7D2FE] hover:border-[#818CF8]',
              'dark:bg-[#374151] dark:hover:bg-[#4B5563] dark:border-[#374151] dark:hover:border-[#6B7280]',
              'text-[#374151] hover:text-[#1F2937] dark:text-[#F9FAFB] dark:hover:text-[#FFFFFF]',
              'h-7 px-3 shadow-[0_2px_4px_rgba(99,102,241,0.1)] hover:shadow-[0_4px_6px_rgba(99,102,241,0.15)]'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-success-400" />
                <span className="text-xs text-success-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                <span className="text-xs">复制</span>
              </>
            )}
          </Button>
        </div>

        {/* 代码内容区域 */}
        <div className="relative code-editor">
          {/* 行号栏 */}
          <div className="absolute left-0 top-0 w-8 h-full bg-[#C7D2FE] dark:bg-[#374151] border-r border-[#C7D2FE] dark:border-[#374151] flex flex-col items-center py-4 space-y-1 line-numbers">
            {renderLineNumbers()}
          </div>
          
          {/* 代码内容 */}
          <pre
            ref={ref}
            className={cn(
              'relative overflow-hidden bg-[#EEF2FF] dark:bg-[#1F2937]',
              'text-sm leading-relaxed font-mono',
              'pl-10 pr-16', // 为行号留出空间，为复制按钮留出右侧空间
              className
            )}
          >
            <code
              className={cn(
                'block p-4 text-[#374151] dark:text-[#F9FAFB]',
                'whitespace-pre-wrap break-words',
                'selection:bg-[#C7D2FE] dark:selection:bg-[#374151] selection:text-[#374151] dark:selection:text-[#F9FAFB]',
                'scrollbar-thin scrollbar-thumb-[#C7D2FE] dark:scrollbar-thumb-[#374151] scrollbar-track-[#EEF2FF] dark:scrollbar-track-[#1F2937]'
              )}
            >
              {children}
            </code>
          </pre>
        </div>
        
        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#6366F1] opacity-30"></div>
        
        {/* 右侧滚动指示器 */}
        <div className="absolute top-1/2 right-2 w-1 h-8 bg-[#C7D2FE] dark:bg-[#374151] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
}
