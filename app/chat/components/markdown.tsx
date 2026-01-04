"use client";

import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import mermaid from "mermaid";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import clsx from "clsx";

// Mermaid图表组件
export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
  }, [props.code]);

  if (hasError) {
    return null;
  }

  return (
    <div
      className={clsx("no-dark", "mermaid")}
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
    >
      {props.code}
    </div>
  );
}

// 代码块组件
export function PreCode(props: { children: any; className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
  }, 600);

  useEffect(() => {
    renderArtifacts();
  }, [props.children]);

  const copyCode = async () => {
    if (!ref.current) return;
    const codeElement = ref.current.querySelector("code");
    if (codeElement) {
      await navigator.clipboard.writeText(codeElement.textContent || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const renderShowMoreButton = () => {
    const codeElement = ref.current?.querySelector("code");
    if (!codeElement) return null;

    const codeHeight = codeElement.scrollHeight;
    const shouldShowButton = codeHeight > 400;

    if (shouldShowButton) {
      return (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="text-xs"
          >
            {collapsed ? (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                展开
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                收起
              </>
            )}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="relative group">
        <pre
          className={clsx(props?.className)}
          ref={ref}
          style={{
            maxHeight: collapsed ? "400px" : "none",
            overflowY: "hidden",
          }}
        >
          {props.children}
        </pre>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      {renderShowMoreButton()}
      {mermaidCode && <Mermaid code={mermaidCode} />}
    </>
  );
}

// 自定义代码组件
export function CustomCode(props: any) {
  const { children, className, ...rest } = props;
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
}

// 转义括号函数
function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

// 包装HTML代码函数
function tryWrapHtmlCode(text: string) {
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

// Markdown内容组件
function MarkDownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(props.content));
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode,
        code: CustomCode,
        p: (pProps) => <p {...pProps} dir="auto" />,
        a: (aProps) => {
          const href = aProps.href || "";
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure>
                <audio controls src={href}></audio>
              </figure>
            );
          }
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video controls width="99.9%">
                <source src={href} />
              </video>
            );
          }
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          return <a {...aProps} target={target} />;
        },
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(MarkDownContent);

// 主Markdown组件
export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
        fontFamily: props.fontFamily || "inherit",
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-pulse">正在生成...</div>
        </div>
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}
