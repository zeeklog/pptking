import { PPTEditClient } from './PPTEditClient';
// import { TestClient } from './TestClient';

// 强制使用 Node.js 运行时，避免 Edge Runtime 问题
export const runtime = 'nodejs';

export default function PPTEditPage() {
  // 使用简化版PPT编辑器，包含基础功能
  return <PPTEditClient />;
}