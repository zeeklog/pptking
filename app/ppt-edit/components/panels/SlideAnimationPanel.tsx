'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Layers,
  Play,
  ArrowRight,
  RotateCw,
  Maximize2,
  Minimize2,
  Layout
} from 'lucide-react';
import { usePPTStore } from '../../store/ppt-store';

// 页面切换动画类型
const TRANSITION_TYPES = [
  { value: 'none', label: '无', icon: '—' },
  { value: 'fade', label: '淡入淡出', icon: '○' },
  { value: 'slide', label: '滑动', icon: '→' },
  { value: 'zoom', label: '缩放', icon: '⚬' },
  { value: 'rotate3d', label: '3D旋转', icon: '↻' },
  { value: 'cube', label: '立方体', icon: '⬛' },
  { value: 'flip', label: '翻转', icon: '⟲' },
  { value: 'push', label: '推入', icon: '⇥' },
  { value: 'reveal', label: '揭开', icon: '⟶' },
  { value: 'wipe', label: '擦除', icon: '⟨' },
];

export function SlideAnimationPanel() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    updateSlideTransition,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const transition = currentSlide?.transition;

  if (!currentSlide) return null;

  const handleTransitionChange = (updates: Partial<typeof transition>) => {
    const newTransition = {
      ...transition,
      ...updates,
    };
    updateSlideTransition(activeSlideIndex, newTransition);
  };

  return (
    <div className="space-y-4">
      {/* 页面切换动画 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            页面切换动画
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 动画类型选择 */}
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">切换类型</Label>
            <Select
              value={transition?.type || 'none'}
              onValueChange={(value) => handleTransitionChange({ type: value as any })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">{type.icon}</span>
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 动画时长 */}
          {transition?.type !== 'none' && (
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                动画时长: {transition?.duration || 500}ms
              </Label>
              <Slider
                value={[transition?.duration || 500]}
                onValueChange={(value) => handleTransitionChange({ duration: value[0] })}
                min={100}
                max={3000}
                step={100}
                className="mt-1"
              />
            </div>
          )}

          {/* 切换方向 */}
          {transition?.type && ['slide', 'push', 'reveal', 'wipe'].includes(transition.type) && (
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">切换方向</Label>
              <Select
                value={transition?.direction || 'right'}
                onValueChange={(value) => handleTransitionChange({ direction: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">从左到右</SelectItem>
                  <SelectItem value="right">从右到左</SelectItem>
                  <SelectItem value="up">从上到下</SelectItem>
                  <SelectItem value="down">从下到上</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 预览按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8"
            onClick={() => {
              // 实现切换动画预览
              const slideElement = document.querySelector('[data-slide-canvas]');
              if (slideElement && transition && transition.type !== 'none') {
                // 添加动画样式
                const element = slideElement as HTMLElement;
                const animationName = `ppt-transition-${transition.type}`;
                const direction = transition.direction || 'right';
                
                // 动态创建CSS动画
                const style = document.createElement('style');
                style.textContent = `
                  @keyframes ${animationName} {
                    ${transition.type === 'fade' ? `
                      0% { opacity: 0; }
                      100% { opacity: 1; }
                    ` : transition.type === 'slide' ? `
                      0% { transform: translateX(${direction === 'left' ? '-' : direction === 'right' ? '' : '0'}100%); }
                      100% { transform: translateX(0); }
                    ` : transition.type === 'zoom' ? `
                      0% { transform: scale(0.8); opacity: 0; }
                      100% { transform: scale(1); opacity: 1; }
                    ` : `
                      0% { opacity: 0; }
                      100% { opacity: 1; }
                    `}
                  }
                `;
                document.head.appendChild(style);
                
                // 应用动画
                element.style.animation = `${animationName} ${transition.duration || 500}ms ease-in-out`;
                
                // 清理动画
                setTimeout(() => {
                  element.style.animation = '';
                  document.head.removeChild(style);
                }, transition.duration || 500);
              }
            }}
            disabled={transition?.type === 'none'}
          >
            <Play className="w-4 h-4 mr-2" />
            预览切换效果
          </Button>
        </CardContent>
      </Card>

      {/* 页面布局模板 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layout className="w-4 h-4" />
            布局模板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {/* 布局模板预览 */}
            {[
              { name: '标题页', layout: 'title' },
              { name: '内容页', layout: 'content' },
              { name: '两栏页', layout: 'two-column' },
              { name: '图片页', layout: 'image' },
              { name: '空白页', layout: 'blank' },
              { name: '结束页', layout: 'end' },
            ].map((template) => (
              <Button
                key={template.layout}
                variant="outline"
                size="sm"
                className="h-16 p-2 flex flex-col items-center justify-center"
                onClick={() => {
                  // TODO: 应用布局模板
                  console.log('Apply layout template:', template.layout);
                }}
              >
                <div className="w-8 h-5 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <span className="text-xs">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 页面设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            页面设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">页面尺寸</Label>
            <Select defaultValue="16:9">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (宽屏)</SelectItem>
                <SelectItem value="4:3">4:3 (标准)</SelectItem>
                <SelectItem value="16:10">16:10 (宽屏)</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">页面方向</Label>
            <Select defaultValue="landscape">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">横向</SelectItem>
                <SelectItem value="portrait">纵向</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}