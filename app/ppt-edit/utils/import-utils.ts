// 文件验证工具类
// 注意：实际的PPTX导入解析逻辑在 ppt-store.ts 中实现

/**
 * 文件导入验证工具类
 * 仅用于文件类型和大小验证，不包含实际的解析逻辑
 */
export class FileImporter {
  /**
   * 验证文件类型是否受支持
   * @param file 要验证的文件
   * @returns 是否为支持的文件类型
   */
  static isValidFileType(file: File): boolean {
    const validExtensions = ['pptx', 'ppt', 'json'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return validExtensions.includes(fileExtension || '');
  }

  /**
   * 获取文件大小限制
   * @returns 最大文件大小（字节）
   */
  static getMaxFileSize(): number {
    return 100 * 1024 * 1024; // 100MB
  }

  /**
   * 验证文件大小是否在限制范围内
   * @param file 要验证的文件
   * @returns 是否在大小限制内
   */
  static isValidFileSize(file: File): boolean {
    return file.size <= this.getMaxFileSize();
  }
}

// 单例文件导入管理器（为了保持向后兼容性）
export const fileImporter = new FileImporter();
