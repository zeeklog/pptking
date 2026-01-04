'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Maximize2, Minimize2, RotateCcw, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

interface HTMLPreviewProps {
  code: string;
  isFullscreen?: boolean;
  sandbox?: string;
}

export interface HTMLPreviewHandler {
  reload: () => void;
}

export const HTMLPreview = forwardRef<HTMLPreviewHandler, HTMLPreviewProps>(
  function HTMLPreview({ code, isFullscreen = false, sandbox = 'allow-forms allow-modals allow-scripts' }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [frameId, setFrameId] = useState<string>(nanoid());
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
        const { id, height, title } = e.data;
        if (id === frameId) {
          setIframeHeight(height);
          setTitle(title || 'HTML Preview');
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [frameId]);

    useImperativeHandle(ref, () => ({
      reload: () => {
        setFrameId(nanoid());
      },
    }));

    const srcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>HTML Preview</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            * {
              box-sizing: border-box;
            }
          </style>
          <script>
            window.addEventListener('DOMContentLoaded', () => {
              const resizeObserver = new ResizeObserver((entries) => {
                parent.postMessage({
                  id: '${frameId}',
                  height: entries[0].target.clientHeight,
                  title: document.title
                }, '*');
              });
              resizeObserver.observe(document.body);
            });
          </script>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;

    const handleReload = () => {
      setFrameId(nanoid());
    };

    const handleShare = async () => {
      try {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        if (navigator.share) {
          await navigator.share({
            title: 'HTML Preview',
            text: 'Check out this HTML preview',
            url: url,
          });
        } else {
          // 降级到复制链接
          await navigator.clipboard.writeText(url);
          // 可以添加toast提示
        }
      } catch (err) {
        console.error('Failed to share:', err);
      }
    };

    const iframeComponent = (
      <iframe
        ref={iframeRef}
        key={frameId}
        className="w-fullborder-border rounded-lg bg-white"
        style={{ height: isFullscreen ? '100vh' : '600px' }}
        sandbox={sandbox}
        srcDoc={srcDoc}
        title="HTML Preview"
      />
    );

    if (isFullscreen) {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>HTML Preview</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReload}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {iframeComponent}
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <div className="relative group">
        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReload}
            className="bg-background/80 backdrop-blur-smborder-border hover:bg-background"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="bg-background/80 backdrop-blur-smborder-border hover:bg-background"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="bg-background/80 backdrop-blur-smborder-border hover:bg-background"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* HTML 预览容器 */}
        <div className="border border-border rounded-lg overflow-hidden">
          {iframeComponent}
        </div>
      </div>
    );
  }
);
