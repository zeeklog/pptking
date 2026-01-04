# 获取 Supabase 服务角色密钥

## 步骤

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 `aowvrhasuregcsqliqnl`
3. 在左侧菜单中点击 "Settings" → "API"
4. 在 "Project API keys" 部分找到 "service_role" 密钥
5. 复制该密钥（以 `eyJ...` 开头的长字符串）
6. 在 Cloudflare Pages 环境变量中设置：
   ```
   SUPABASE_SERVICE_ROLE_KEY=你复制的密钥
   ```

## 注意事项

- **安全警告**：服务角色密钥具有完全的管理权限，请妥善保管
- **不要提交到代码库**：该密钥不应该出现在任何公开的代码仓库中
- **仅用于服务端**：该密钥只在服务端 API 路由中使用，不会暴露给客户端

## 验证配置

部署后，可以通过以下方式验证配置是否正确：

1. 访问你的网站
2. 尝试使用微信登录功能
3. 检查浏览器控制台是否有相关错误信息
4. 检查 Cloudflare Pages 的构建日志

如果仍然遇到问题，请检查：
- 环境变量名称是否正确（`SUPABASE_SERVICE_ROLE_KEY`）
- 密钥是否完整复制（没有多余的空格或换行）
- 项目 ID 是否正确（`aowvrhasuregcsqliqnl`）
