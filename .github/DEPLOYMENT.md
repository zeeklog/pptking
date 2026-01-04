# GitHub Pages 部署指南

本项目已配置为自动部署到 GitHub Pages。

## 部署步骤

### 1. 启用 GitHub Pages

1. 前往 GitHub 仓库的 **Settings** > **Pages**
2. 在 **Source** 部分，选择 **GitHub Actions** 作为部署源
3. 保存设置

### 2. 配置环境变量

在 GitHub 仓库的 **Settings** > **Secrets and variables** > **Actions** 中添加以下密钥：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase 公开密钥

### 3. 触发部署

部署会在以下情况自动触发：
- 推送到 `main` 分支
- 手动触发（在 Actions 标签页中点击 "Run workflow"）

### 4. 访问部署的网站

部署完成后，网站将可通过以下 URL 访问：
- `https://zeeklog.github.io/pptking/`

## 重要说明

⚠️ **限制**：GitHub Pages 只支持静态站点，因此：

1. **API 路由不可用**：所有 `/api/*` 路由在静态导出模式下不会工作
2. **服务器端功能受限**：需要服务器端渲染的功能可能无法正常工作
3. **环境变量**：需要在 GitHub Secrets 中配置所有必要的环境变量

## 本地测试静态导出

在本地测试 GitHub Pages 构建：

```bash
yarn build:github-pages
```

构建输出将在 `out/` 目录中。可以使用以下命令本地预览：

```bash
npx serve out
```

## 故障排除

### 构建失败

- 检查 GitHub Actions 日志中的错误信息
- 确保所有环境变量都已正确配置
- 确保 `package.json` 中的依赖项都是最新的

### 页面无法加载

- 检查 basePath 配置是否正确（当前为 `/pptking`）
- 确保所有资源路径都使用相对路径或正确的 basePath

### API 调用失败

- 记住：GitHub Pages 不支持 API 路由
- 如果应用依赖 API 路由，考虑使用其他部署平台（如 Vercel、Netlify）
