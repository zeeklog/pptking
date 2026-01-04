import { openDB, IDBPDatabase } from 'idb';
import { PPTState } from './ppt-store';
import { resourceManager, ResourceManager } from './resource-manager';

// 存储管理器接口
interface StorageManager {
  save(state: PPTState): Promise<void>;
  load(): Promise<Partial<PPTState> | null>;
  clear(): Promise<void>;
  getStorageInfo(): Promise<StorageInfo>;
}

interface StorageInfo {
  totalSize: number;
  usedSpace: number;
  availableSpace: number;
  itemCount: number;
}

// 数据分片配置
const STORAGE_CONFIG = {
  DB_NAME: 'ppt-editor-v3', // 升级版本，因为存储格式改变
  DB_VERSION: 1,
  CHUNK_SIZE: 1024 * 1024, // 1MB per chunk
  MAX_CHUNKS: 200, // 增加最大分片数，因为没有压缩
};

// 数据块结构（简化版本，移除压缩）
interface DataChunk {
  id: string;
  index: number;
  data: string;
  timestamp: number;
}

interface DataMetadata {
  id: string;
  totalChunks: number;
  originalSize: number;
  timestamp: number;
  checksum: string;
}

// 高性能存储管理器实现（无压缩版本）
export class AdvancedStorageManager implements StorageManager {
  private db: IDBPDatabase | null = null;

  constructor() {
    // 确保只在浏览器环境中初始化
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端渲染环境，跳过存储管理器初始化');
    }
  }

  // 压缩功能已移除

  // 初始化数据库
  private async initDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(STORAGE_CONFIG.DB_NAME, STORAGE_CONFIG.DB_VERSION, {
      upgrade(db) {
        // 创建数据块存储
        if (!db.objectStoreNames.contains('chunks')) {
          const chunksStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunksStore.createIndex('timestamp', 'timestamp');
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
          metadataStore.createIndex('timestamp', 'timestamp');
        }
        
        // 创建配置存储
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      },
    });

    return this.db;
  }

  // 计算校验和
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  // 提取状态中的资源并替换为引用
  private async extractResources(state: PPTState): Promise<PPTState> {
    const processedState = JSON.parse(JSON.stringify(state)); // 深拷贝

    for (let slideIndex = 0; slideIndex < processedState.slides.length; slideIndex++) {
      const slide = processedState.slides[slideIndex];
      
      // 处理背景图片
      if (slide.background?.type === 'image' && slide.background.image && 
          !ResourceManager.isResourceReference(slide.background.image)) {
        const resourceId = await resourceManager.addResource(
          slide.background.image,
          'image',
          'image/jpeg', // 假设是JPEG，实际可以从base64头部解析
          `slide_${slideIndex}_background`
        );
        slide.background.image = resourceId;
      }

      // 处理元素中的图片
      if (slide.elements) {
        for (const element of slide.elements) {
          await this.processElementResources(element, slideIndex);
        }
      }
    }

    // 处理剪贴板中的元素
    if (processedState.clipboard?.elements) {
      for (const element of processedState.clipboard.elements) {
        await this.processElementResources(element, -1); // 剪贴板使用-1作为标识
      }
    }

    // 处理剪贴板中的幻灯片
    if (processedState.clipboard?.slides) {
      for (let slideIndex = 0; slideIndex < processedState.clipboard.slides.length; slideIndex++) {
        const slide = processedState.clipboard.slides[slideIndex];
        if (slide.elements) {
          for (const element of slide.elements) {
            await this.processElementResources(element, -2 - slideIndex); // 剪贴板幻灯片使用负数标识
          }
        }
      }
    }

    return processedState;
  }

  // 递归处理元素中的资源
  private async processElementResources(element: any, slideIndex: number): Promise<void> {
    // 处理图片元素
    if (element.type === 'image' && element.image?.src && 
        !ResourceManager.isResourceReference(element.image.src)) {
      const resourceId = await resourceManager.addResource(
        element.image.src,
        'image',
        'image/jpeg',
        element.image.alt || `element_${element.id}`
      );
      await resourceManager.addReference(resourceId, element.id, slideIndex);
      element.image.src = resourceId;
    }

    // 处理视频元素
    if (element.type === 'video' && element.video?.src && 
        !ResourceManager.isResourceReference(element.video.src)) {
      const resourceId = await resourceManager.addResource(
        element.video.src,
        'video',
        'video/mp4',
        `video_${element.id}`
      );
      await resourceManager.addReference(resourceId, element.id, slideIndex);
      element.video.src = resourceId;
    }

    // 处理音频元素
    if (element.type === 'audio' && element.audio?.src && 
        !ResourceManager.isResourceReference(element.audio.src)) {
      const resourceId = await resourceManager.addResource(
        element.audio.src,
        'audio',
        'audio/mp3',
        `audio_${element.id}`
      );
      await resourceManager.addReference(resourceId, element.id, slideIndex);
      element.audio.src = resourceId;
    }

    // 处理组合元素
    if (element.type === 'group' && element.groupedElements) {
      for (const groupedElement of element.groupedElements) {
        await this.processElementResources(groupedElement, slideIndex);
      }
    }

    // 处理兼容格式的elements数组
    if (element.elements) {
      for (const childElement of element.elements) {
        await this.processElementResources(childElement, slideIndex);
      }
    }
  }

  // 恢复状态中的资源引用
  private async restoreResources(state: Partial<PPTState>): Promise<Partial<PPTState>> {
    const restoredState = JSON.parse(JSON.stringify(state)); // 深拷贝

    if (restoredState.slides) {
      for (const slide of restoredState.slides) {
        // 恢复背景图片
        if (slide.background?.type === 'image' && slide.background.image && 
            ResourceManager.isResourceReference(slide.background.image)) {
          const resourceData = await resourceManager.getResource(slide.background.image);
          if (resourceData) {
            slide.background.image = resourceData;
          }
        }

        // 恢复元素中的图片
        if (slide.elements) {
          for (const element of slide.elements) {
            await this.restoreElementResources(element);
          }
        }
      }
    }

    // 恢复剪贴板中的资源
    if (restoredState.clipboard?.elements) {
      for (const element of restoredState.clipboard.elements) {
        await this.restoreElementResources(element);
      }
    }

    if (restoredState.clipboard?.slides) {
      for (const slide of restoredState.clipboard.slides) {
        if (slide.elements) {
          for (const element of slide.elements) {
            await this.restoreElementResources(element);
          }
        }
      }
    }

    return restoredState;
  }

  // 递归恢复元素中的资源
  private async restoreElementResources(element: any): Promise<void> {
    // 恢复图片元素
    if (element.type === 'image' && element.image?.src && 
        ResourceManager.isResourceReference(element.image.src)) {
      const resourceData = await resourceManager.getResource(element.image.src);
      if (resourceData) {
        element.image.src = resourceData;
      }
    }

    // 恢复视频元素
    if (element.type === 'video' && element.video?.src && 
        ResourceManager.isResourceReference(element.video.src)) {
      const resourceData = await resourceManager.getResource(element.video.src);
      if (resourceData) {
        element.video.src = resourceData;
      }
    }

    // 恢复音频元素
    if (element.type === 'audio' && element.audio?.src && 
        ResourceManager.isResourceReference(element.audio.src)) {
      const resourceData = await resourceManager.getResource(element.audio.src);
      if (resourceData) {
        element.audio.src = resourceData;
      }
    }

    // 恢复组合元素
    if (element.type === 'group' && element.groupedElements) {
      for (const groupedElement of element.groupedElements) {
        await this.restoreElementResources(groupedElement);
      }
    }

    // 恢复兼容格式的elements数组
    if (element.elements) {
      for (const childElement of element.elements) {
        await this.restoreElementResources(childElement);
      }
    }
  }

  // 不压缩数据，直接返回原始字符串
  private async processData(data: string): Promise<string> {
    // 直接返回原始数据，确保Unicode安全
    return data;
  }

  // 不需要解压缩，直接返回数据
  private async restoreData(data: string): Promise<string> {
    return data;
  }

  // 将数据分割成块（无压缩版本）
  private async chunkData(data: string): Promise<DataChunk[]> {
    const processedData = await this.processData(data);
    const chunks: DataChunk[] = [];
    const chunkSize = STORAGE_CONFIG.CHUNK_SIZE;
    
    for (let i = 0; i < processedData.length; i += chunkSize) {
      const chunkData = processedData.slice(i, i + chunkSize);
      const chunkId = `chunk_${Date.now()}_${i}`;
      
      chunks.push({
        id: chunkId,
        index: Math.floor(i / chunkSize),
        data: chunkData,
        timestamp: Date.now(),
      });
    }
    
    return chunks;
  }

  // 重组数据块（无压缩版本）
  private async reassembleChunks(chunks: DataChunk[]): Promise<string> {
    // 按索引排序
    chunks.sort((a, b) => a.index - b.index);
    
    // 重组数据并直接返回
    const reassembled = chunks.map(chunk => chunk.data).join('');
    return await this.restoreData(reassembled);
  }

  // 保存状态
  async save(state: PPTState): Promise<void> {
    // 检查浏览器环境
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端环境，跳过保存操作');
      return;
    }

    try {
      console.log('🔄 开始保存大数据状态...');
      const startTime = performance.now();
      
      // 提取资源到独立存储
      console.log('📎 提取资源引用...');
      const processedState = await this.extractResources(state);
      
      const db = await this.initDB();
      const serialized = JSON.stringify(processedState);
      
      console.log(`📊 原始数据大小: ${(serialized.length / 1024).toFixed(2)}KB`);
      
      // 如果数据很小，直接保存到单个块
      if (serialized.length < STORAGE_CONFIG.CHUNK_SIZE) {
        const processedData = await this.processData(serialized);
        const chunk: DataChunk = {
          id: 'single_chunk',
          index: 0,
          data: processedData,
          timestamp: Date.now(),
        };
        
        const metadata: DataMetadata = {
          id: 'ppt_state',
          totalChunks: 1,
          originalSize: serialized.length,
          timestamp: Date.now(),
          checksum: this.calculateChecksum(serialized),
        };
        
        // 使用事务确保原子性
        const tx = db.transaction(['chunks', 'metadata'], 'readwrite');
        
        // 清理旧数据
        await tx.objectStore('chunks').clear();
        await tx.objectStore('metadata').clear();
        
        // 保存新数据
        await tx.objectStore('chunks').put(chunk);
        await tx.objectStore('metadata').put(metadata);
        
        await tx.done;
        
        const endTime = performance.now();
        console.log(`✅ 单块保存完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`📊 数据大小: ${(processedData.length / 1024).toFixed(2)}KB`);
        
        // 保存完成后清理未使用的资源
        setTimeout(() => {
          resourceManager.cleanupUnusedResources().catch(error => {
            console.warn('⚠️ 资源清理失败:', error);
          });
        }, 5000); // 5秒后执行清理
        
        return;
      }
      
      // 大数据分块处理
      const chunks = await this.chunkData(serialized);
      
      if (chunks.length > STORAGE_CONFIG.MAX_CHUNKS) {
        throw new Error(`数据过大，需要${chunks.length}个块，超过限制${STORAGE_CONFIG.MAX_CHUNKS}`);
      }
      
      const totalDataSize = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
      
      const metadata: DataMetadata = {
        id: 'ppt_state',
        totalChunks: chunks.length,
        originalSize: serialized.length,
        timestamp: Date.now(),
        checksum: this.calculateChecksum(serialized),
      };
      
      // 使用事务确保原子性
      const tx = db.transaction(['chunks', 'metadata'], 'readwrite');
      
      // 清理旧数据
      await tx.objectStore('chunks').clear();
      await tx.objectStore('metadata').clear();
      
      // 保存元数据
      await tx.objectStore('metadata').put(metadata);
      
      // 批量保存数据块
      for (const chunk of chunks) {
        await tx.objectStore('chunks').put(chunk);
      }
      
      await tx.done;
      
      const endTime = performance.now();
      console.log(`✅ 分块保存完成，共${chunks.length}个块，耗时: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 总数据大小: ${(totalDataSize / 1024).toFixed(2)}KB`);
      
      // 保存完成后清理未使用的资源
      setTimeout(() => {
        resourceManager.cleanupUnusedResources().catch(error => {
          console.warn('⚠️ 资源清理失败:', error);
        });
      }, 5000); // 5秒后执行清理
      
    } catch (error) {
      console.error('❌ 保存状态失败:', error);
      throw error;
    }
  }

  // 加载状态
  async load(): Promise<Partial<PPTState> | null> {
    // 检查浏览器环境
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端环境，跳过加载操作');
      return null;
    }

    try {
      console.log('🔄 开始加载大数据状态...');
      const startTime = performance.now();
      
      const db = await this.initDB();
      
      // 获取元数据
      const metadata = await db.get('metadata', 'ppt_state');
      if (!metadata) {
        console.log('📭 没有找到存储的状态数据');
        return null;
      }
      
      console.log(`📊 元数据: ${metadata.totalChunks}个块, 数据大小${(metadata.originalSize / 1024).toFixed(2)}KB`);
      
      // 获取所有数据块
      const allChunks = await db.getAll('chunks');
      
      if (allChunks.length !== metadata.totalChunks) {
        console.warn(`⚠️ 数据块不完整: 期望${metadata.totalChunks}个，实际${allChunks.length}个`);
        throw new Error('数据块不完整');
      }
      
      // 重组数据
      const reassembled = await this.reassembleChunks(allChunks);
      
      // 验证校验和
      const checksum = this.calculateChecksum(reassembled);
      if (checksum !== metadata.checksum) {
        console.warn('⚠️ 数据校验失败，可能存在损坏');
        // 不抛出错误，尝试使用损坏的数据
      }
      
      // 解析状态
      const parsedState = JSON.parse(reassembled) as Partial<PPTState>;
      
      // 恢复资源引用
      console.log('🔗 恢复资源引用...');
      const state = await this.restoreResources(parsedState);
      
      const endTime = performance.now();
      console.log(`✅ 状态加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 加载数据: ${state.slides?.length || 0}个幻灯片`);
      
      return state;
      
    } catch (error) {
      console.error('❌ 加载状态失败:', error);
      return null;
    }
  }

  // 清除所有数据
  async clear(): Promise<void> {
    // 检查浏览器环境
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端环境，跳过清除操作');
      return;
    }

    try {
      const db = await this.initDB();
      const tx = db.transaction(['chunks', 'metadata'], 'readwrite');
      
      await tx.objectStore('chunks').clear();
      await tx.objectStore('metadata').clear();
      
      await tx.done;
      
      // 同时清理资源存储
      await resourceManager.clear();
      
      console.log('🗑️ 存储数据和资源清除完成');
    } catch (error) {
      console.error('❌ 清除数据失败:', error);
      throw error;
    }
  }

  // 获取存储信息
  async getStorageInfo(): Promise<StorageInfo> {
    // 检查浏览器环境
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端环境，返回默认存储信息');
      return {
        totalSize: 0,
        usedSpace: 0,
        availableSpace: 0,
        itemCount: 0,
      };
    }

    try {
      const db = await this.initDB();
      
      const metadata = await db.get('metadata', 'ppt_state');
      const allChunks = await db.getAll('chunks');
      
      const usedSpace = allChunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
      
      // 估算可用空间（IndexedDB通常限制在几GB）
      const estimatedQuota = 1024 * 1024 * 1024; // 1GB估算
      
      return {
        totalSize: metadata?.originalSize || 0,
        usedSpace,
        availableSpace: estimatedQuota - usedSpace,
        itemCount: allChunks.length,
      };
    } catch (error) {
      console.error('❌ 获取存储信息失败:', error);
      return {
        totalSize: 0,
        usedSpace: 0,
        availableSpace: 0,
        itemCount: 0,
      };
    }
  }

  // 清理资源（无需清理Worker）
  destroy() {
    // 无需清理压缩Worker，因为已移除
  }
}

// 导出存储管理器实例
export const storageManager = new AdvancedStorageManager();
