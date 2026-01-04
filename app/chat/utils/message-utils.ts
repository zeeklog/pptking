import { ChatMessage } from "../types/chat";

// 获取消息文本内容
export function getMessageTextContent(message: ChatMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}

// 获取消息文本内容（不包含思考过程）
export function getMessageTextContentWithoutThinking(message: ChatMessage): string {
  let content = "";

  if (typeof message.content === "string") {
    content = message.content;
  } else {
    for (const c of message.content) {
      if (c.type === "text") {
        content = c.text ?? "";
        break;
      }
    }
  }

  // 过滤掉思考行（以 "> " 开头）
  return content
    .split("\n")
    .filter((line) => !line.startsWith("> ") && line.trim() !== "")
    .join("\n")
    .trim();
}

// 获取消息中的图片
export function getMessageImages(message: ChatMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
}

// 复制到剪贴板
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("复制失败:", error);
    return false;
  }
}

// 选择或复制文本
export function selectOrCopy(element: HTMLElement, text: string) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
  
  const success = document.execCommand("copy");
  if (success) {
    return true;
  } else {
    return copyToClipboard(text);
  }
}

// 计算消息长度
export function countMessages(messages: ChatMessage[]): number {
  return messages.reduce((pre, cur) => pre + getMessageTextContent(cur).length, 0);
}
