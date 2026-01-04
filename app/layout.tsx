import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from '@/components/Providers';
import { ClientLayout } from './components/ClientLayout';

// 使用系统字体替代Google Fonts以避免网络依赖
const inter = {
  className: '',
  style: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

// 强制动态渲染 - Cloudflare Pages需要Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PPT Visionary AI - AI驱动的PPT生成平台',
  description: '使用AI技术快速生成专业的PPT演示文稿，拥有海量模板库和智能设计功能',
  keywords: 'PPT, AI, 演示文稿, 模板, 设计',
  authors: [{ name: 'PPT Visionary AI Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'PPT Visionary AI',
    description: 'AI驱动的PPT生成平台',
    type: 'website',
    locale: 'zh_CN',
  },
};

// 移除 viewport 到单独的导出
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
