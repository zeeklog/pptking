#!/bin/bash

# PPT Visionary AI - Cloudflare Workers 部署脚本
# 自动化部署到 Cloudflare Workers 的完整流程

set -e

echo "🚀 开始部署 PPT Visionary AI 到 Cloudflare Workers..."

# 1. 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf .next .vercel

# 2. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 3. 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
npm run build

# 4. 检查构建是否成功
if [ ! -d ".next" ]; then
    echo "❌ Next.js 构建失败！"
    exit 1
fi

echo "✅ Next.js 构建成功！"

# 5. 运行 Vercel 构建以生成输出
echo "📦 生成 Vercel 输出..."
npx vercel build

# 6. 检查 Vercel 输出
if [ ! -d ".vercel/output" ]; then
    echo "❌ Vercel 构建输出未找到！"
    exit 1
fi

# 7. 尝试使用 @cloudflare/next-on-pages 转换
echo "⚡ 转换为 Cloudflare Workers 格式..."
set +e  # 允许命令失败
npx @cloudflare/next-on-pages --skip-build
TRANSFORM_EXIT_CODE=$?
set -e  # 重新启用严格模式

# 8. 检查转换结果
if [ $TRANSFORM_EXIT_CODE -eq 0 ]; then
    echo "✅ Cloudflare Workers 转换成功！"
elif [ -f ".vercel/output/static/_worker.js" ]; then
    echo "⚠️ 转换有警告但输出文件存在，继续部署..."
else
    echo "❌ Cloudflare Workers 转换失败！"
    exit 1
fi

# 9. 部署到 Cloudflare Pages
echo "🌐 部署到 Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static

echo "🎉 部署完成！"
echo ""
echo "📋 部署摘要："
echo "  - Next.js 版本: $(npx next --version)"
echo "  - 构建模式: SSR (Edge Runtime)"
echo "  - 目标平台: Cloudflare Workers"
echo "  - 输出目录: .vercel/output/static"
echo ""
echo "🔗 请在 Cloudflare Pages 控制台中查看部署状态和配置域名。"