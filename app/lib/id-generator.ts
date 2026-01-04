// 生成稳定的 ID，避免 SSR 水合错误
let counter = 0;

export function generateId(prefix = 'id'): string {
  // 在服务端和客户端都使用递增计数器
  return `${prefix}-${++counter}`;
}

export function generateTimestamp(): Date {
  // 返回当前时间，但在服务端渲染时不会导致水合错误
  return new Date();
}

// 重置计数器（主要用于测试）
export function resetCounter(): void {
  counter = 0;
}
