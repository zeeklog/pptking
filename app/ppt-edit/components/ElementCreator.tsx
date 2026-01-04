'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Triangle,
  Minus,
  BarChart3,
  Table,
  FileText,
  Video,
  Music,
  Plus
} from 'lucide-react';
import { usePPTStore, PPTElement } from '../store/ppt-store';
import { ColorPicker } from './ColorPicker';
import { MediaUploader } from './MediaUploader';
import { ChartEditor } from './ChartEditor';
import { TableEditor } from './TableEditor';
import { LaTeXEditor } from './LaTeXEditor';
import { cn } from '@/lib/utils';

interface ElementCreatorProps {
  trigger?: React.ReactNode;
}

export function ElementCreator({ trigger }: ElementCreatorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
  const { addElement, canvasScale } = usePPTStore();

  // 创建文本元素
  const createTextElement = useCallback((content: string = '请输入文本') => {
    const element: Omit<PPTElement, 'id'> = {
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
      text: {
        content,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#374151',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
      },
    };
    
    addElement(element);
    setIsOpen(false);
  }, [addElement]);

  // 创建形状元素
  const createShapeElement = useCallback((shapeType: 'rectangle' | 'circle' | 'triangle', borderRadius?: number) => {
    const element: Omit<PPTElement, 'id'> = {
      type: 'shape',
      x: 100,
      y: 100,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
      shape: {
        type: shapeType,
        fill: '#6366F1',
        stroke: '#4F46E5',
        strokeWidth: 2,
        borderRadius: borderRadius || 0,
      },
    };
    
    addElement(element);
    setIsOpen(false);
  }, [addElement]);

  // 创建线条元素
  const createLineElement = useCallback(() => {
    const element: Omit<PPTElement, 'id'> = {
      type: 'line',
      x: 100,
      y: 200,
      width: 200,
      height: 2,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
      line: {
        type: 'straight',
        stroke: '#374151',
        strokeWidth: 2,
        points: [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
        ],
      },
    };
    
    addElement(element);
    setIsOpen(false);
  }, [addElement]);

  // 创建图表元素
  const createChartElement = useCallback((chartType: 'bar' | 'line' | 'pie') => {
    const sampleData = chartType === 'pie' 
      ? [
          { name: 'A', value: 30 },
          { name: 'B', value: 25 },
          { name: 'C', value: 45 },
        ]
      : [
          { name: '一月', value: 30 },
          { name: '二月', value: 45 },
          { name: '三月', value: 35 },
          { name: '四月', value: 50 },
        ];

    const element: Omit<PPTElement, 'id'> = {
      type: 'chart',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
      chart: {
        type: chartType,
        data: sampleData,
        theme: 'default',
        options: {},
      },
    };
    
    addElement(element);
    setIsOpen(false);
  }, [addElement]);

  // 创建表格元素
  const createTableElement = useCallback((rows: number = 3, cols: number = 3) => {
    const data = Array(rows).fill(null).map((_, rowIndex) => 
      Array(cols).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? `标题${colIndex + 1}` : `内容${rowIndex}-${colIndex + 1}`
      )
    );

    const element: Omit<PPTElement, 'id'> = {
      type: 'table',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
      table: {
        rows,
        cols,
        data,
        cellStyle: {
          fontSize: 14,
          color: '#374151',
          backgroundColor: '#FFFFFF',
          align: 'left',
          bold: false,
          italic: false,
        },
        borderStyle: {
          width: 1,
          color: '#E5E7EB',
          style: 'solid',
        },
      },
    };
    
    addElement(element);
    setIsOpen(false);
  }, [addElement]);

  return (
    <>
      {/* 覆盖Dialog的默认z-index */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-radix-popper-content-wrapper] {
            z-index: ${Z_INDEX.DIALOG};
          }
          [data-overlay] {
            z-index: ${Z_INDEX.MODAL_BASE};
          }
        `
      }} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {t('pptEditor.quickActions.addElement')}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
          style={{ zIndex: Z_INDEX.DIALOG }}
        >
        <DialogHeader>
          <DialogTitle>{t('pptEditor.elementCreator.addNewElement')}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="w-3 h-3" />
              {t('pptEditor.elementCreator.text')}
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              {t('pptEditor.elementCreator.image')}
            </TabsTrigger>
            <TabsTrigger value="shape" className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              {t('pptEditor.elementCreator.shape')}
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {t('pptEditor.elementCreator.chart')}
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1">
              <Table className="w-3 h-3" />
              {t('pptEditor.elementCreator.table')}
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {t('pptEditor.elementCreator.media')}
            </TabsTrigger>
          </TabsList>

          {/* 文本元素创建 */}
          <TabsContent value="text" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => createTextElement('标题文本')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Type className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.title')}</span>
              </Button>
              <Button 
                onClick={() => createTextElement('正文内容')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.content')}</span>
              </Button>
              <Button 
                onClick={() => createTextElement('• 项目符号\n• 列表内容')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center text-lg">•</div>
                <span className="text-sm">{t('pptEditor.elementCreator.list')}</span>
              </Button>
              <Button 
                onClick={() => createTextElement('1. 编号列表\n2. 有序内容')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center text-lg">1.</div>
                <span className="text-sm">{t('pptEditor.elementCreator.numbered')}</span>
              </Button>
            </div>
          </TabsContent>

          {/* 图片元素创建 */}
          <TabsContent value="image" className="space-y-4">
            <MediaUploader 
              accept="image/*"
              onUpload={(url) => {
                const element: Omit<PPTElement, 'id'> = {
                  type: 'image',
                  x: 100,
                  y: 100,
                  width: 300,
                  height: 200,
                  rotation: 0,
                  opacity: 1,
                  locked: false,
                  hidden: false,
                  zIndex: 1,
                  image: {
                    src: url,
                    alt: '图片',
                    filters: {
                      blur: 0,
                      brightness: 100,
                      contrast: 100,
                      grayscale: 0,
                      saturate: 100,
                      hue: 0,
                    },
                    borderRadius: 0,
                  },
                };
                addElement(element);
                setIsOpen(false);
              }}
            />
          </TabsContent>

          {/* 形状元素创建 */}
          <TabsContent value="shape" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                onClick={() => createShapeElement('rectangle')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Square className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.rectangle')}</span>
              </Button>
              <Button 
                onClick={() => createShapeElement('rectangle', 12)}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <div className="w-6 h-6 border-2 border-gray-400 rounded-lg" />
                <span className="text-sm">圆角矩形</span>
              </Button>
              <Button 
                onClick={() => createShapeElement('circle')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Circle className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.circle')}</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Button 
                onClick={() => createShapeElement('triangle')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Triangle className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.triangle')}</span>
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <Button 
                onClick={createLineElement}
                className="w-full h-16 flex items-center gap-3"
                variant="outline"
              >
                <Minus className="w-6 h-6" />
                <span>{t('pptEditor.elementCreator.line')}</span>
              </Button>
            </div>
          </TabsContent>

          {/* 图表元素创建 */}
          <TabsContent value="chart" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                onClick={() => createChartElement('bar')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.barChart')}</span>
              </Button>
              <Button 
                onClick={() => createChartElement('line')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                    <polyline points="3,17 9,11 13,15 21,7" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-sm">{t('pptEditor.elementCreator.lineChart')}</span>
              </Button>
              <Button 
                onClick={() => createChartElement('pie')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeWidth="2"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-sm">{t('pptEditor.elementCreator.pieChart')}</span>
              </Button>
            </div>
          </TabsContent>

          {/* 表格元素创建 */}
          <TabsContent value="table" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('pptEditor.elementCreator.rows')}</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('pptEditor.elementCreator.cols')}</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => createTableElement(3, 3)}
                className="h-16 flex flex-col gap-2"
                variant="outline"
              >
                <Table className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.table3x3')}</span>
              </Button>
              <Button 
                onClick={() => createTableElement(4, 3)}
                className="h-16 flex flex-col gap-2"
                variant="outline"
              >
                <Table className="w-6 h-6" />
                <span className="text-sm">{t('pptEditor.elementCreator.table4x3')}</span>
              </Button>
            </div>
          </TabsContent>

          {/* 媒体元素创建 */}
          <TabsContent value="media" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('pptEditor.elementCreator.videoFile')}</Label>
                <MediaUploader 
                  accept="video/*"
                  onUpload={(url) => {
                    const element: Omit<PPTElement, 'id'> = {
                      type: 'video',
                      x: 100,
                      y: 100,
                      width: 400,
                      height: 300,
                      rotation: 0,
                      opacity: 1,
                      locked: false,
                      hidden: false,
                      zIndex: 1,
                      media: {
                        src: url,
                        autoplay: false,
                        loop: false,
                        controls: true,
                      },
                    };
                    addElement(element);
                    setIsOpen(false);
                  }}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('pptEditor.elementCreator.audioFile')}</Label>
                <MediaUploader 
                  accept="audio/*"
                  onUpload={(url) => {
                    const element: Omit<PPTElement, 'id'> = {
                      type: 'audio',
                      x: 100,
                      y: 100,
                      width: 300,
                      height: 50,
                      rotation: 0,
                      opacity: 1,
                      locked: false,
                      hidden: false,
                      zIndex: 1,
                      media: {
                        src: url,
                        autoplay: false,
                        loop: false,
                        controls: true,
                      },
                    };
                    addElement(element);
                    setIsOpen(false);
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}