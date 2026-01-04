'use client';

import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism-tomorrow.css';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useRef, useState, useEffect, useMemo } from 'react';
import { processMessageContent } from '@/lib/message-utils';
import { CodeBlock, MermaidChart, HTMLPreview } from './index';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  loading?: boolean;
  fontSize?: number;
  fontFamily?: string;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

export function MarkdownRenderer({
  content,
  loading = false,
  fontSize = 14,
  fontFamily = 'inherit',
  className,
  onContextMenu,
  onDoubleClick,
}: MarkdownRendererProps) {
  const mdRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 处理内容，包括转义和HTML包装
  const processedContent = useMemo(() => {
    // 如果内容已经包含代码块标记，直接返回原始内容
    if (content.includes('```')) {
      return content;
    }
    // 只对不包含代码块的内容进行转义和HTML包装处理
    return processMessageContent(content);
  }, [content]);

  // 检测代码块类型
  useEffect(() => {
    if (!mdRef.current) return;

    const mermaidDom = mdRef.current.querySelector('code.language-mermaid');
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }

    const htmlDom = mdRef.current.querySelector('code.language-html');
    const refText = mdRef.current.querySelector('code')?.innerText;
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText);
    } else if (
      refText?.startsWith('<!DOCTYPE') ||
      refText?.startsWith('<svg') ||
      refText?.startsWith('<?xml')
    ) {
      setHtmlCode(refText);
    }
  }, [processedContent]);

  if (loading && !content.trim()) {
    return (
      <div className="flex items-center space-x-3 p-4 text-tech-600 dark:text-tech-400">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-sm font-medium">AI正在生成内容...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'markdown-body prose prose-sm max-w-none dark:prose-invert p-0',
        'prose-headings:font-semibold prose-headings:text-tech-700 dark:prose-headings:text-tech-200',
        'prose-p:text-tech-600 dark:prose-p:text-tech-300 prose-p:leading-relaxed',
        'prose-strong:text-tech-700 dark:prose-strong:text-tech-200 prose-strong:font-semibold',
        'prose-em:text-tech-600 dark:prose-em:text-tech-300 prose-em:italic',
        'prose-code:text-[#374151] dark:prose-code:text-[#F9FAFB] prose-code:bg-[#C7D2FE] dark:prose-code:bg-[#374151] prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:border prose-code:border-[#A5B4FC] dark:prose-code:border-[#4B5563]',
        'prose-pre:bg-[#EEF2FF] dark:prose-pre:bg-[#1F2937] prose-pre:border prose-pre:border-[#C7D2FE] dark:prose-pre:border-[#374151] prose-pre:rounded-xl prose-pre:shadow-[0_4px_6px_rgba(99,102,241,0.1)]',
        'prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-900/30',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-li:text-tech-600 dark:prose-li:text-tech-300',
        'prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-purple-700 dark:hover:prose-a:text-purple-300',
        'prose-table:border-collapse prose-table:w-full prose-table:my-4',
        'prose-th:border prose-th:border-purple-200 dark:prose-th:border-purple-700 prose-th:p-3 prose-th:text-left prose-th:bg-purple-50 dark:prose-th:bg-purple-900/50 prose-th:text-tech-700 dark:prose-th:text-tech-200',
        'prose-td:border prose-td:border-purple-200 dark:prose-td:border-purple-700 prose-td:p-3 prose-td:text-tech-600 dark:prose-td:text-tech-300',
        'prose-tr:hover:bg-purple-50/50 dark:prose-tr:hover:bg-purple-900/30',
        className
      )}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily,
      }}
      ref={mdRef}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      dir="auto"
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypeHighlight,
            {
              detect: false,
              ignoreMissing: true,
            },
          ],
        ]}
        components={{
          pre: ({ children, ...props }) => {
            // 直接返回CodeBlock，不通过ReactMarkdown的code组件
            return <CodeBlock {...props}>{children}</CodeBlock>;
          },
          code: ({ children, className, ...props }) => {
            const language = className?.replace('language-', '') || '';
            const isInline = !className;

            if (isInline) {
              // 内联代码，直接渲染
              return (
                <code
                  className={cn(
                    'text-[#374151] dark:text-[#F9FAFB] bg-[#b7c2ef51] dark:bg-[#374151] px-2 py-1 rounded-md text-sm',
                    ' dark:border-[#4B5563] font-mono rounded',
                    'selection:bg-[#a5b4fc86] dark:selection:bg-[#4B5563] selection:text-[#374151] dark:selection:text-[#F9FAFB]'
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // 代码块，直接返回内容，让pre组件处理
            return children;
          },
          p: (props) => <p {...props} dir="auto" />,
          // 表格组件 - 升级为代码编辑器风格
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xlborder-purple-200  shadow-purple-lg bg-white dark:bg-tech-800">
              <div className="relative">
                {/* 表格顶部装饰条 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 rounded-t-xl opacity-60"></div>

                {/* 表格工具栏 */}
                <div className="flex items-center justify-between px-4 py-3   border-b border-purple-200 ">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-tech-700 dark:text-tech-200">数据表格</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-warning-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-error-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>

                <table className="w-full border-collapse data-table" {...props}>
                  {children}
                </table>
              </div>
            </div>
          ),
          thead: (props) => (
            <thead className=" " {...props} />
          ),
          tbody: (props) => <tbody {...props} />,
          tr: (props) => (
            <tr className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30 border-b border-purple-200  transition-all duration-200" {...props} />
          ),
          th: ({ children, ...props }) => (
            <th className="border border-purple-200  p-4 text-left font-semibold   text-tech-700 dark:text-tech-200 text-sm" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-purple-200  p-4 text-tech-600 dark:text-tech-300 text-sm" {...props}>
              {children}
            </td>
          ),
          ul: (props) => <ul className="list-disc list-inside space-y-2 text-tech-600 dark:text-tech-300" {...props} />,
          ol: (props) => <ol className="list-decimal list-inside space-y-2 text-tech-600 dark:text-tech-300" {...props} />,
          li: (props) => <li className="text-tech-600 dark:text-tech-300" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic text-tech-600 dark:text-tech-300 rounded-r-lg py-2" {...props} />
          ),
          h1: (props) => <h1 className="text-2xl font-bold text-tech-700 dark:text-tech-200 mb-4 border-b border-purple-200  pb-2" {...props} />,
          h2: (props) => <h2 className="text-xl font-bold text-tech-700 dark:text-tech-200 mb-3 border-b border-purple-200  pb-1" {...props} />,
          h3: (props) => <h3 className="text-lg font-bold text-tech-700 dark:text-tech-200 mb-2" {...props} />,
          h4: (props) => <h4 className="text-base font-bold text-tech-700 dark:text-tech-200 mb-2" {...props} />,
          h5: (props) => <h5 className="text-sm font-bold text-tech-700 dark:text-tech-200 mb-1" {...props} />,
          h6: (props) => <h6 className="text-xs font-bold text-tech-700 dark:text-tech-200 mb-1" {...props} />,
          a: (props) => {
            const href = props.href || '';

            // 音频文件
            if (/\.(aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure className="my-4 p-4 rounded-lgborder-purple-200 ">
                  <audio controls src={href} className="w-full" />
                </figure>
              );
            }

            // 视频文件
            if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
              return (
                <figure className="my-4 p-4 rounded-lgborder-purple-200 ">
                  <video controls width="99.9%" className="rounded-lg">
                    <source src={href} />
                  </video>
                </figure>
              );
            }

            // 图片文件
            if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(href)) {
              return (
                <figure className="my-4 p-4 rounded-lgborder-purple-200 ">
                  <img src={href} alt="" className="max-w-full h-auto rounded-lg shadow-purple-sm" />
                </figure>
              );
            }

            const isInternal = /^\/#/i.test(href);
            const target = isInternal ? '_self' : props.target ?? '_blank';

            return (
              <a
                {...props}
                target={target}
                rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors duration-200"
              />
            );
          },
          img: (props) => (
            <img
              {...props}
              className="max-w-full h-auto rounded-lgborder-purple-200  shadow-purple-sm"
              loading="lazy"
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Mermaid 图表 */}
      {mermaidCode && (
        <div className="my-4 p-4 rounded-lgborder-purple-200 ">
          <MermaidChart code={mermaidCode} hasError={false} />
        </div>
      )}

      {/* HTML 预览 */}
      {htmlCode && (
        <div className="my-4 p-4 rounded-lgborder-purple-200 ">
          <HTMLPreview code={htmlCode} isFullscreen={isFullscreen} />
        </div>
      )}
    </div>
  );
}
