'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Group,
  Ungroup,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import { usePPTStore } from '../../store/ppt-store';

export function MultiSelectionPanel() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    updateElement,
    groupElements,
    ungroupElements,
    duplicateElement,
    deleteElement,
    lockElement,
    unlockElement,
    hideElement,
    showElement,
    bringToFront,
    sendToBack,
    alignElements,
    distributeElements,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const selectedElements = currentSlide?.elements.filter(el => activeElementIds.includes(el.id)) || [];

  if (selectedElements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Group className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">请选择多个元素</p>
      </div>
    );
  }

  // 计算选中元素的边界
  const getBoundingRect = () => {
    const rects = selectedElements.map(el => ({
      left: el.x,
      top: el.y,
      right: el.x + el.width,
      bottom: el.y + el.height,
    }));
    
    return {
      left: Math.min(...rects.map(r => r.left)),
      top: Math.min(...rects.map(r => r.top)),
      right: Math.max(...rects.map(r => r.right)),
      bottom: Math.max(...rects.map(r => r.bottom)),
    };
  };





  // 批量操作
  const batchOperation = (operation: string) => {
    selectedElements.forEach(element => {
      switch (operation) {
        case 'duplicate':
          duplicateElement(element.id);
          break;
        case 'delete':
          deleteElement(element.id);
          break;
        case 'lock':
          lockElement(element.id);
          break;
        case 'unlock':
          unlockElement(element.id);
          break;
        case 'hide':
          hideElement(element.id);
          break;
        case 'show':
          showElement(element.id);
          break;
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 选择信息 */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          已选择 {selectedElements.length} 个元素
        </p>
      </div>

      {/* 对齐操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">对齐</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">水平对齐</Label>
              <div className="flex gap-1 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('left', activeElementIds)}
                  title="左对齐"
                >
                  <AlignHorizontalJustifyStart className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('center', activeElementIds)}
                  title="水平居中"
                >
                  <AlignHorizontalJustifyCenter className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('right', activeElementIds)}
                  title="右对齐"
                >
                  <AlignHorizontalJustifyEnd className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">垂直对齐</Label>
              <div className="flex gap-1 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('top', activeElementIds)}
                  title="顶部对齐"
                >
                  <AlignVerticalJustifyStart className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('middle', activeElementIds)}
                  title="垂直居中"
                >
                  <AlignVerticalJustifyCenter className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => alignElements('bottom', activeElementIds)}
                  title="底部对齐"
                >
                  <AlignVerticalJustifyEnd className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分布操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8"
              onClick={() => distributeElements('horizontal', activeElementIds)}
              disabled={selectedElements.length < 3}
              title="水平分布"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              <span className="text-xs">水平</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8"
              onClick={() => distributeElements('vertical', activeElementIds)}
              disabled={selectedElements.length < 3}
              title="垂直分布"
            >
              <ArrowDown className="w-4 h-4 mr-1" />
              <span className="text-xs">垂直</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 组合操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">组合</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8"
              onClick={() => groupElements(activeElementIds)}
            >
              <Group className="w-4 h-4 mr-1" />
              <span className="text-xs">组合</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8"
              onClick={() => {
                if (selectedElements.length === 1 && selectedElements[0].isGroup) {
                  ungroupElements(selectedElements[0].id);
                }
              }}
              disabled={!(selectedElements.length === 1 && selectedElements[0].isGroup)}
            >
              <Ungroup className="w-4 h-4 mr-1" />
              <span className="text-xs">取消组合</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 批量操作 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">批量操作</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => batchOperation('duplicate')}
          >
            <Copy className="w-4 h-4 mr-1" />
            <span className="text-xs">复制</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700"
            onClick={() => batchOperation('delete')}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="text-xs">删除</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => batchOperation('lock')}
          >
            <Lock className="w-4 h-4 mr-1" />
            <span className="text-xs">锁定</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => batchOperation('unlock')}
          >
            <Unlock className="w-4 h-4 mr-1" />
            <span className="text-xs">解锁</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => batchOperation('hide')}
          >
            <EyeOff className="w-4 h-4 mr-1" />
            <span className="text-xs">隐藏</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => batchOperation('show')}
          >
            <Eye className="w-4 h-4 mr-1" />
            <span className="text-xs">显示</span>
          </Button>
        </div>
      </div>
    </div>
  );
}