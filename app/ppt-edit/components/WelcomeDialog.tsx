'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles,
  Layout,
  Palette,
  Zap,
  Download,
  Play,
  Keyboard,
  Smartphone,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { FileImporterComponent } from './FileImporter';
import { TemplateSelector } from './TemplateSelector';
import { usePPTStore } from '../store/ppt-store';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  const { t } = useTranslation();
  const { addSlide } = usePPTStore();

  const features = [
    {
      icon: Layout,
      title: '专业编辑器',
      description: '完整的PPT编辑功能，支持文本、图片、形状、图表等多种元素',
      color: 'bg-purple-500',
    },
    {
      icon: Palette,
      title: '丰富主题',
      description: '6种内置主题，紫色科技风格，支持自定义主题配色',
      color: 'bg-blue-500',
    },
    {
      icon: Zap,
      title: '动画效果',
      description: '入场、退场、强调动画，让演示更生动有趣',
      color: 'bg-green-500',
    },
    {
      icon: Sparkles,
      title: 'AI助手',
      description: 'AI智能生成内容，优化布局，提供设计建议',
      color: 'bg-yellow-500',
    },
    {
      icon: Download,
      title: '多格式导出',
      description: '支持导出PPTX、PDF、图片、JSON等多种格式',
      color: 'bg-red-500',
    },
    {
      icon: Play,
      title: '放映模式',
      description: '全屏放映，演讲者视图，手写批注，倒计时器',
      color: 'bg-indigo-500',
    },
    {
      icon: Keyboard,
      title: '快捷键',
      description: '完整的快捷键系统，提高编辑效率',
      color: 'bg-gray-500',
    },
    {
      icon: Smartphone,
      title: '移动适配',
      description: '完美适配移动设备，随时随地编辑演示文稿',
      color: 'bg-pink-500',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
          
            欢迎使用 PPT KING 编辑器
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-1">
            {/* 功能介绍 */}
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                专业的在线PPT编辑器，让创作更简单
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                基于现代Web技术构建，提供桌面级的编辑体验
              </p>
            </div>

            {/* 核心功能展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 text-center space-y-3">
                      <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 快速开始 */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    快速开始指南
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">
                        1
                      </div>
                      <p className="font-medium">选择模板</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        从左侧面板选择合适的模板开始创作
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">
                        2
                      </div>
                      <p className="font-medium">编辑内容</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        使用工具栏添加文本、图片、图表等元素
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">
                        3
                      </div>
                      <p className="font-medium">导出分享</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        完成后导出为PPTX或直接在线放映
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快捷键提示 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  常用快捷键
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>撤销</span>
                    <Badge variant="outline" className="font-mono">Ctrl+Z</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>重做</span>
                    <Badge variant="outline" className="font-mono">Ctrl+Y</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>选择工具</span>
                    <Badge variant="outline" className="font-mono">V</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>文本工具</span>
                    <Badge variant="outline" className="font-mono">T</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>放大</span>
                    <Badge variant="outline" className="font-mono">Ctrl++</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>缩小</span>
                    <Badge variant="outline" className="font-mono">Ctrl+-</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>删除</span>
                    <Badge variant="outline" className="font-mono">Del</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>全选</span>
                    <Badge variant="outline" className="font-mono">Ctrl+A</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 快速开始选项 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => {
              addSlide();
              onClose();
            }}
            className="h-16 flex flex-col gap-2"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">空白开始</span>
          </Button>
          
          <TemplateSelector 
            trigger={
              <Button
                className="h-16 flex flex-col gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                <Layout className="w-5 h-5" />
                <span className="text-sm">选择模板</span>
              </Button>
            }
            onTemplateSelect={onClose}
          />
          
          <FileImporterComponent 
            trigger={
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-2"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">导入PPT</span>
              </Button>
            }
            onImportSuccess={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}