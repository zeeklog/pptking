'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Play, 
  Pause,
  RotateCw,
  TrendingUp,
  Sparkles,
  MousePointer,
  Timer
} from 'lucide-react';
import { usePPTStore } from '../../store/ppt-store';

// 动画类型定义
const ENTRANCE_ANIMATIONS = [
  { value: 'fadeIn', label: '淡入' },
  { value: 'slideInLeft', label: '从左滑入' },
  { value: 'slideInRight', label: '从右滑入' },
  { value: 'slideInUp', label: '从上滑入' },
  { value: 'slideInDown', label: '从下滑入' },
  { value: 'zoomIn', label: '缩放进入' },
  { value: 'rotateIn', label: '旋转进入' },
  { value: 'bounceIn', label: '弹跳进入' },
  { value: 'flipInX', label: '水平翻转进入' },
  { value: 'flipInY', label: '垂直翻转进入' },
];

const EXIT_ANIMATIONS = [
  { value: 'fadeOut', label: '淡出' },
  { value: 'slideOutLeft', label: '向左滑出' },
  { value: 'slideOutRight', label: '向右滑出' },
  { value: 'slideOutUp', label: '向上滑出' },
  { value: 'slideOutDown', label: '向下滑出' },
  { value: 'zoomOut', label: '缩放退出' },
  { value: 'rotateOut', label: '旋转退出' },
  { value: 'bounceOut', label: '弹跳退出' },
];

const EMPHASIS_ANIMATIONS = [
  { value: 'pulse', label: '脉冲' },
  { value: 'bounce', label: '弹跳' },
  { value: 'shake', label: '摇摆' },
  { value: 'swing', label: '摆动' },
  { value: 'wobble', label: '摆动' },
  { value: 'flash', label: '闪烁' },
  { value: 'rubberBand', label: '橡皮筋' },
];

export function ElementAnimationPanel() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    updateElement,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const selectedElements = currentSlide?.elements.filter(el => activeElementIds.includes(el.id)) || [];
  const firstElement = selectedElements[0];

  if (!firstElement) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">请先选择一个元素</p>
      </div>
    );
  }

  const animation = firstElement.animation || {};

  const updateAnimation = (type: 'entrance' | 'exit' | 'emphasis', updates: any) => {
    const newAnimation = {
      ...animation,
      [type]: {
        ...animation[type],
        ...updates,
      },
    };
    updateElement(firstElement.id, { animation: newAnimation });
  };

  const removeAnimation = (type: 'entrance' | 'exit' | 'emphasis') => {
    const newAnimation = { ...animation };
    delete newAnimation[type];
    updateElement(firstElement.id, { animation: newAnimation });
  };

  return (
    <div className="space-y-4">
      {/* 入场动画 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-green-500" />
            入场动画
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">动画类型</Label>
            <Select
              value={animation.entrance?.type || ''}
              onValueChange={(value) => {
                if (value) {
                  updateAnimation('entrance', { type: value });
                } else {
                  removeAnimation('entrance');
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择入场动画" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无动画</SelectItem>
                {ENTRANCE_ANIMATIONS.map((anim) => (
                  <SelectItem key={anim.value} value={anim.value}>
                    {anim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {animation.entrance && (
            <>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">触发方式</Label>
                <Select
                  value={animation.entrance.trigger || 'click'}
                  onValueChange={(value) => updateAnimation('entrance', { trigger: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click">点击时</SelectItem>
                    <SelectItem value="auto">自动</SelectItem>
                    <SelectItem value="with-previous">与上一动画同时</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  持续时间: {animation.entrance.duration || 500}ms
                </Label>
                <Slider
                  value={[animation.entrance.duration || 500]}
                  onValueChange={(value) => updateAnimation('entrance', { duration: value[0] })}
                  min={100}
                  max={3000}
                  step={100}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  延迟: {animation.entrance.delay || 0}ms
                </Label>
                <Slider
                  value={[animation.entrance.delay || 0]}
                  onValueChange={(value) => updateAnimation('entrance', { delay: value[0] })}
                  min={0}
                  max={2000}
                  step={100}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 强调动画 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            强调动画
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">动画类型</Label>
            <Select
              value={animation.emphasis?.type || ''}
              onValueChange={(value) => {
                if (value) {
                  updateAnimation('emphasis', { type: value });
                } else {
                  removeAnimation('emphasis');
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择强调动画" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无动画</SelectItem>
                {EMPHASIS_ANIMATIONS.map((anim) => (
                  <SelectItem key={anim.value} value={anim.value}>
                    {anim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {animation.emphasis && (
            <>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">触发方式</Label>
                <Select
                  value={animation.emphasis.trigger || 'click'}
                  onValueChange={(value) => updateAnimation('emphasis', { trigger: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click">点击时</SelectItem>
                    <SelectItem value="auto">自动</SelectItem>
                    <SelectItem value="with-previous">与上一动画同时</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  持续时间: {animation.emphasis.duration || 500}ms
                </Label>
                <Slider
                  value={[animation.emphasis.duration || 500]}
                  onValueChange={(value) => updateAnimation('emphasis', { duration: value[0] })}
                  min={100}
                  max={3000}
                  step={100}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 退场动画 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pause className="w-4 h-4 text-red-500" />
            退场动画
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">动画类型</Label>
            <Select
              value={animation.exit?.type || ''}
              onValueChange={(value) => {
                if (value) {
                  updateAnimation('exit', { type: value });
                } else {
                  removeAnimation('exit');
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择退场动画" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无动画</SelectItem>
                {EXIT_ANIMATIONS.map((anim) => (
                  <SelectItem key={anim.value} value={anim.value}>
                    {anim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {animation.exit && (
            <>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">触发方式</Label>
                <Select
                  value={animation.exit.trigger || 'click'}
                  onValueChange={(value) => updateAnimation('exit', { trigger: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click">点击时</SelectItem>
                    <SelectItem value="auto">自动</SelectItem>
                    <SelectItem value="with-previous">与上一动画同时</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  持续时间: {animation.exit.duration || 500}ms
                </Label>
                <Slider
                  value={[animation.exit.duration || 500]}
                  onValueChange={(value) => updateAnimation('exit', { duration: value[0] })}
                  min={100}
                  max={3000}
                  step={100}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  延迟: {animation.exit.delay || 0}ms
                </Label>
                <Slider
                  value={[animation.exit.delay || 0]}
                  onValueChange={(value) => updateAnimation('exit', { delay: value[0] })}
                  min={0}
                  max={2000}
                  step={100}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 预览动画 */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8"
          onClick={() => {
            // 实现动画预览
            const element = document.querySelector(`[data-element-id="${firstElement.id}"]`);
            if (element && firstElement.animation?.entrance) {
              const animation = firstElement.animation.entrance;
              element.classList.add('animate-pulse'); // 简单的预览动画
              setTimeout(() => {
                element.classList.remove('animate-pulse');
              }, animation.duration || 500);
            }
          }}
        >
          <Play className="w-4 h-4 mr-2" />
          预览动画
        </Button>
      </div>
    </div>
  );
}