import { openDB, IDBPDatabase } from 'idb';

// 资源类型定义
export interface Resource {
  id: string;
  type: 'image' | 'video' | 'audio' | 'font' | 'other';
  data: string; // base64 或 blob URL
  size: number;
  mimeType: string;
  name?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  refCount: number; // 引用计数
}

export interface ResourceReference {
  resourceId: string;
  elementId: string;
  slideIndex: number;
}

// 资源管理器配置
const RESOURCE_CONFIG = {
  DB_NAME: 'ppt-resources-v1',
  DB_VERSION: 1,
  MAX_RESOURCE_SIZE: 5 * 1024 * 1024, // 5MB 单个资源最大大小
  CLEANUP_THRESHOLD: 100, // 超过100个未使用资源时清理
};

export class ResourceManager {
  private db: IDBPDatabase | null = null;
  private resourceCache = new Map<string, Resource>();

  constructor() {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.log('服务端渲染环境，跳过资源管理器初始化');
    }
  }

  // 初始化数据库
  private async initDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(RESOURCE_CONFIG.DB_NAME, RESOURCE_CONFIG.DB_VERSION, {
      upgrade(db) {
        // 资源存储
        if (!db.objectStoreNames.contains('resources')) {
          const resourceStore = db.createObjectStore('resources', { keyPath: 'id' });
          resourceStore.createIndex('type', 'type');
          resourceStore.createIndex('timestamp', 'timestamp');
          resourceStore.createIndex('refCount', 'refCount');
        }

        // 引用关系存储
        if (!db.objectStoreNames.contains('references')) {
          const refStore = db.createObjectStore('references', { keyPath: ['resourceId', 'elementId'] });
          refStore.createIndex('resourceId', 'resourceId');
          refStore.createIndex('elementId', 'elementId');
          refStore.createIndex('slideIndex', 'slideIndex');
        }
      },
    });

    return this.db;
  }

  // 生成资源哈希ID
  private generateResourceHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 1000); i++) { // 只计算前1000个字符的哈希
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `resource_${hash.toString(16)}_${data.length}`;
  }

  // 添加资源
  async addResource(
    data: string,
    type: Resource['type'],
    mimeType: string,
    name?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return data; // 服务端环境直接返回原数据
    }

    try {
      const db = await this.initDB();
      const resourceId = this.generateResourceHash(data);

      // 检查是否已存在相同资源
      const existingResource = await db.get('resources', resourceId);
      if (existingResource) {
        // 更新引用计数
        existingResource.refCount++;
        await db.put('resources', existingResource);
        console.log(`📎 重用已存在资源: ${resourceId}`);
        return resourceId;
      }

      // 检查资源大小
      if (data.length > RESOURCE_CONFIG.MAX_RESOURCE_SIZE) {
        console.warn(`⚠️ 资源过大 (${(data.length / 1024 / 1024).toFixed(2)}MB)，不进行去重存储`);
        return data; // 返回原数据
      }

      const resource: Resource = {
        id: resourceId,
        type,
        data,
        size: data.length,
        mimeType,
        name,
        metadata,
        timestamp: Date.now(),
        refCount: 1,
      };

      await db.put('resources', resource);
      this.resourceCache.set(resourceId, resource);

      console.log(`💾 添加新资源: ${resourceId}, 大小: ${(data.length / 1024).toFixed(2)}KB`);
      return resourceId;

    } catch (error) {
      console.error('❌ 添加资源失败:', error);
      return data; // 失败时返回原数据
    }
  }

  // 获取资源
  async getResource(resourceId: string): Promise<string | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return resourceId; // 服务端环境返回ID作为数据
    }

    // 如果不是资源ID格式，直接返回
    if (!resourceId.startsWith('resource_')) {
      return resourceId;
    }

    try {
      // 先检查缓存
      if (this.resourceCache.has(resourceId)) {
        return this.resourceCache.get(resourceId)!.data;
      }

      const db = await this.initDB();
      const resource = await db.get('resources', resourceId);
      
      if (resource) {
        this.resourceCache.set(resourceId, resource);
        return resource.data;
      }

      console.warn(`⚠️ 资源未找到: ${resourceId}`);
      return null;

    } catch (error) {
      console.error('❌ 获取资源失败:', error);
      return null;
    }
  }

  // 添加引用关系
  async addReference(resourceId: string, elementId: string, slideIndex: number): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    if (!resourceId.startsWith('resource_')) {
      return; // 不是资源ID，跳过
    }

    try {
      const db = await this.initDB();
      const reference: ResourceReference = {
        resourceId,
        elementId,
        slideIndex,
      };

      await db.put('references', reference);
    } catch (error) {
      console.error('❌ 添加引用关系失败:', error);
    }
  }

  // 移除引用关系
  async removeReference(resourceId: string, elementId: string): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    if (!resourceId.startsWith('resource_')) {
      return;
    }

    try {
      const db = await this.initDB();
      await db.delete('references', [resourceId, elementId]);

      // 减少资源引用计数
      const resource = await db.get('resources', resourceId);
      if (resource) {
        resource.refCount = Math.max(0, resource.refCount - 1);
        if (resource.refCount === 0) {
          console.log(`🗑️ 资源无引用，标记为可清理: ${resourceId}`);
        }
        await db.put('resources', resource);
        this.resourceCache.delete(resourceId); // 清除缓存
      }

    } catch (error) {
      console.error('❌ 移除引用关系失败:', error);
    }
  }

  // 更新引用关系（元素移动到其他幻灯片时）
  async updateReference(resourceId: string, elementId: string, newSlideIndex: number): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    if (!resourceId.startsWith('resource_')) {
      return;
    }

    try {
      const db = await this.initDB();
      const tx = db.transaction(['references'], 'readwrite');
      const store = tx.objectStore('references');
      
      // 查找并更新引用
      const reference = await store.get([resourceId, elementId]);
      if (reference) {
        reference.slideIndex = newSlideIndex;
        await store.put(reference);
      }

      await tx.done;
    } catch (error) {
      console.error('❌ 更新引用关系失败:', error);
    }
  }

  // 获取幻灯片的所有资源引用
  async getSlideReferences(slideIndex: number): Promise<ResourceReference[]> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return [];
    }

    try {
      const db = await this.initDB();
      const tx = db.transaction(['references'], 'readonly');
      const index = tx.store.index('slideIndex');
      const references = await index.getAll(slideIndex);
      
      return references;
    } catch (error) {
      console.error('❌ 获取幻灯片引用失败:', error);
      return [];
    }
  }

  // 清理未使用的资源
  async cleanupUnusedResources(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const db = await this.initDB();
      const tx = db.transaction(['resources'], 'readwrite');
      const store = tx.objectStore('resources');
      const index = store.index('refCount');
      
      // 获取所有引用计数为0的资源
      const unusedResources = await index.getAll(0);
      
      if (unusedResources.length > RESOURCE_CONFIG.CLEANUP_THRESHOLD) {
        console.log(`🧹 开始清理 ${unusedResources.length} 个未使用的资源`);
        
        for (const resource of unusedResources) {
          await store.delete(resource.id);
          this.resourceCache.delete(resource.id);
        }
        
        console.log(`✅ 资源清理完成`);
      }

      await tx.done;
    } catch (error) {
      console.error('❌ 清理资源失败:', error);
    }
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    totalResources: number;
    totalSize: number;
    unusedResources: number;
    resourcesByType: Record<string, number>;
  }> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return {
        totalResources: 0,
        totalSize: 0,
        unusedResources: 0,
        resourcesByType: {},
      };
    }

    try {
      const db = await this.initDB();
      const resources = await db.getAll('resources');
      
      const stats = {
        totalResources: resources.length,
        totalSize: resources.reduce((sum, r) => sum + r.size, 0),
        unusedResources: resources.filter(r => r.refCount === 0).length,
        resourcesByType: {} as Record<string, number>,
      };

      // 按类型统计
      for (const resource of resources) {
        stats.resourcesByType[resource.type] = (stats.resourcesByType[resource.type] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('❌ 获取存储统计失败:', error);
      return {
        totalResources: 0,
        totalSize: 0,
        unusedResources: 0,
        resourcesByType: {},
      };
    }
  }

  // 批量处理资源引用（用于删除幻灯片时）
  async removeSlideReferences(slideIndex: number): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const references = await this.getSlideReferences(slideIndex);
      
      for (const ref of references) {
        await this.removeReference(ref.resourceId, ref.elementId);
      }

      console.log(`🗑️ 移除幻灯片 ${slideIndex} 的 ${references.length} 个资源引用`);
    } catch (error) {
      console.error('❌ 移除幻灯片引用失败:', error);
    }
  }

  // 检查是否为资源引用
  static isResourceReference(value: string): boolean {
    return typeof value === 'string' && value.startsWith('resource_');
  }

  // 清除所有数据
  async clear(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const db = await this.initDB();
      const tx = db.transaction(['resources', 'references'], 'readwrite');
      
      await tx.objectStore('resources').clear();
      await tx.objectStore('references').clear();
      
      await tx.done;
      this.resourceCache.clear();
      
      console.log('🗑️ 资源管理器数据清除完成');
    } catch (error) {
      console.error('❌ 清除资源数据失败:', error);
    }
  }
}

// 导出资源管理器实例
export const resourceManager = new ResourceManager();
