'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PPT_SIZES, type PPTSize } from '../../constants/canvas';
import { usePPTStore } from '../../store/ppt-store';

export function CanvasSizePanel() {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState<keyof typeof PPT_SIZES>('WIDESCREEN');
  const [customWidth, setCustomWidth] = useState(960);
  const [customHeight, setCustomHeight] = useState(540);

  // 获取当前配置的快捷方法（这里暂时使用状态，实际应该从store获取）
  const getCurrentSize = (): PPTSize => {
    if (selectedSize === 'CUSTOM') {
      return {
        name: '自定义',
        width: customWidth,
        height: customHeight,
        ratio: customWidth / customHeight,
        description: `自定义尺寸 ${customWidth}x${customHeight}`
      };
    }
    return PPT_SIZES[selectedSize];
  };

  const handleSizeChange = (sizeKey: keyof typeof PPT_SIZES) => {
    setSelectedSize(sizeKey);
    
    // TODO: 更新全局状态，影响画布渲染
    console.log('画布尺寸更改为:', PPT_SIZES[sizeKey]);
  };

  const handleCustomSizeChange = () => {
    if (selectedSize === 'CUSTOM') {
      // TODO: 更新全局状态
      console.log('自定义尺寸更改为:', { width: customWidth, height: customHeight });
    }
  };

  const currentSize = getCurrentSize();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('画布尺寸设置')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 预设尺寸选择 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('预设尺寸')}
          </Label>
          <Select
            value={selectedSize}
            onValueChange={(value) => handleSizeChange(value as keyof typeof PPT_SIZES)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PPT_SIZES).map(([key, size]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="text-sm">{size.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {size.width} × {size.height} ({size.ratio.toFixed(2)}:1)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 当前尺寸信息 */}
        <div className="rounded-lg border p-3 bg-muted/30">
          <div className="space-y-1">
            <div className="text-sm font-medium">{currentSize.name}</div>
            <div className="text-xs text-muted-foreground">
              {currentSize.width} × {currentSize.height} 像素
            </div>
            <div className="text-xs text-muted-foreground">
              比例: {currentSize.ratio.toFixed(2)}:1
            </div>
            <div className="text-xs text-muted-foreground">
              {currentSize.description}
            </div>
          </div>
        </div>

        {/* 自定义尺寸输入 */}
        {selectedSize === 'CUSTOM' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                {t('自定义尺寸')}
              </Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-width" className="text-xs">
                    {t('宽度')}
                  </Label>
                  <Input
                    id="custom-width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 960)}
                    onBlur={handleCustomSizeChange}
                    className="h-8"
                    min="200"
                    max="4000"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="custom-height" className="text-xs">
                    {t('高度')}
                  </Label>
                  <Input
                    id="custom-height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 540)}
                    onBlur={handleCustomSizeChange}
                    className="h-8"
                    min="150"
                    max="3000"
                  />
                </div>
              </div>

              {/* 常用比例快捷按钮 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t('快捷比例')}
                </Label>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setCustomWidth(960);
                      setCustomHeight(540);
                      handleCustomSizeChange();
                    }}
                  >
                    16:9
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setCustomWidth(960);
                      setCustomHeight(720);
                      handleCustomSizeChange();
                    }}
                  >
                    4:3
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setCustomWidth(customWidth);
                      setCustomHeight(customWidth);
                      handleCustomSizeChange();
                    }}
                  >
                    1:1
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* 操作按钮 */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8"
            onClick={() => {
              // TODO: 实现应用新尺寸的逻辑
              console.log('应用新的画布尺寸:', currentSize);
            }}
          >
            {t('应用新尺寸')}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            {t('更改尺寸会重新调整所有元素的位置和大小')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
