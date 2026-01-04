'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Type,
  Image,
  Square,
  BarChart3,
  Table,
  Upload,
  Download,
  Undo,
  Redo,
  Copy,
  Trash2,
  Play,
  MousePointer,
  Minus,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Ruler,
  Eye,
  Maximize,
  Plus
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { ElementCreator } from './ElementCreator';
import { FileImporterComponent } from './FileImporter';
import { StyledButton } from './StyledButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { TableEditor } from './TableEditor';
import { ChartEditor } from './ChartEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';

export function QuickActions() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const {
    activeElementIds,
    canUndo,
    canRedo,
    undo,
    redo,
    duplicateElement,
    deleteElement,
    exportToPPTX,
    exportProgress,
    setSelectedTool,
    selectedTool,
    canvasScale,
    showGrid,
    showRuler,
    gridSize,
    setCanvasScale,
    toggleGrid,
    toggleRuler,
    setGridSize,
    resetCanvas,
    addElement,
    toggleFullscreen,
  } = usePPTStore();

  const hasSelection = activeElementIds.length > 0;

  // 创建表格元素
  const createTableElement = (rows: number = 3, cols: number = 3) => {
    const data = Array(rows).fill(null).map((_, rowIndex) => 
      Array(cols).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? `标题${colIndex + 1}` : `内容${rowIndex}-${colIndex + 1}`
      )
    );

    const element = {
      type: 'table' as const,
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
          align: 'left' as const,
          bold: false,
          italic: false,
        },
        borderStyle: {
          width: 1,
          color: '#E5E7EB',
          style: 'solid' as const,
        },
      },
    };
    
    addElement(element);
    setTableDialogOpen(false);
  };

  // 创建图表元素
  const createChartElement = (chartType: 'bar' | 'line' | 'pie') => {
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

    const element = {
      type: 'chart' as const,
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
    setChartDialogOpen(false);
  };

  const quickTools = [
    { tool: 'select' as const, icon: MousePointer, label: t('pptEditor.quickActions.selectTool'), shortcut: 'V' },
    { tool: 'text' as const, icon: Type, label: t('pptEditor.quickActions.textTool'), shortcut: 'T' },
    { tool: 'image' as const, icon: Image, label: t('pptEditor.quickActions.imageTool'), shortcut: 'I' },
    { tool: 'shape' as const, icon: Square, label: t('pptEditor.quickActions.shapeTool'), shortcut: 'S' },
    { tool: 'line' as const, icon: Minus, label: t('pptEditor.quickActions.lineTool'), shortcut: 'L' },
    { tool: 'table' as const, icon: Table, label: t('pptEditor.quickActions.tableTool'), shortcut: 'Tab' },
    { tool: 'chart' as const, icon: BarChart3, label: t('pptEditor.quickActions.chartTool'), shortcut: 'C' },
    { tool: 'media' as const, icon: Settings, label: t('pptEditor.quickActions.mediaTool'), shortcut: 'M' },
  ];

  // 获取当前工具的图标和名称
  const getCurrentToolDisplay = () => {
    switch (selectedTool) {
      case 'select':
        return { icon: MousePointer, name: t('pptEditor.quickActions.selectTool') };
      case 'text':
        return { icon: Type, name: t('pptEditor.quickActions.textTool') };
      case 'image':
        return { icon: Image, name: t('pptEditor.quickActions.imageTool') };
      case 'shape':
        return { icon: Square, name: t('pptEditor.quickActions.shapeTool') };
      case 'line':
        return { icon: Minus, name: t('pptEditor.quickActions.lineTool') };
      case 'table':
        return { icon: Table, name: t('pptEditor.quickActions.tableTool') };
      case 'chart':
        return { icon: BarChart3, name: t('pptEditor.quickActions.chartTool') };
      case 'media':
        return { icon: Settings, name: t('pptEditor.quickActions.mediaTool') };
      default:
        return { icon: MousePointer, name: t('pptEditor.quickActions.selectTool') };
    }
  };

  const { icon: CurrentToolIcon, name: currentToolName } = getCurrentToolDisplay();

  return (
    <div 
      className={cn(
        "h-12 border-b border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 flex items-center gap-2 overflow-x-auto shadow-sm",
        isMobile ? "px-2" : "px-4 gap-3"
      )}
      style={{ 
        boxShadow: '0 2px 4px rgba(99, 102, 241, 0.05)'
      }}
    >
      {/* 历史操作 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={undo}
          disabled={!canUndo()}
          title={`${t('pptEditor.quickActions.undo')} (${t('pptEditor.quickActions.undoDesc')})`}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={redo}
          disabled={!canRedo()}
          title={`${t('pptEditor.quickActions.redo')} (${t('pptEditor.quickActions.redoDesc')})`}
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {!isMobile && <Separator orientation="vertical" className="h-6" />}

      {/* 当前工具状态 - 移动端简化显示 */}
      {isMobile ? (
        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-700 flex-shrink-0">
          <CurrentToolIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-700 flex-shrink-0">
          <CurrentToolIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{currentToolName}</span>
        </div>
      )}

      {!isMobile && <Separator orientation="vertical" className="h-6" />}

      {/* 快速工具 - 移动端只显示核心工具 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {(isMobile ? quickTools.slice(0, 4) : quickTools).map(({ tool, icon: Icon, label, shortcut }) => (
          <Button
            key={tool}
            variant={selectedTool === tool ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              selectedTool === tool && "bg-purple-500 text-white hover:bg-purple-600"
            )}
            onClick={() => {
              if (tool === 'image') {
                // 图片工具直接打开文件选择器
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const result = e.target?.result as string;
                      // 在画布中心添加图片
                      const centerX = 480 - 100; // 960/2 - 200/2
                      const centerY = 270 - 75;  // 540/2 - 150/2
                      
                      // 通过全局事件通知Canvas添加图片
                      window.dispatchEvent(new CustomEvent('addImageElement', {
                        detail: {
                          src: result,
                          alt: file.name,
                          x: centerX,
                          y: centerY,
                          width: 200,
                          height: 150
                        }
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                };
                fileInput.click();
              } else if (tool === 'table') {
                // 表格工具打开设置弹窗
                setTableDialogOpen(true);
              } else if (tool === 'chart') {
                // 图表工具打开设置弹窗
                setChartDialogOpen(true);
              } else {
                setSelectedTool(tool);
              }
            }}
            title={`${label} (${shortcut})`}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {!isMobile && <Separator orientation="vertical" className="h-6" />}

      {/* 元素操作 - 移动端简化 */}
      {hasSelection && (
        <>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1",
                isMobile ? "w-8 p-0" : "px-3"
              )}
              onClick={() => {
                activeElementIds.forEach(id => duplicateElement(id));
              }}
              title={t('pptEditor.quickActions.copyDesc')}
            >
              <Copy className="w-3 h-3" />
              {!isMobile && t('pptEditor.quickActions.copy')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50",
                isMobile ? "w-8 p-0" : "px-3"
              )}
              onClick={() => {
                activeElementIds.forEach(id => deleteElement(id));
              }}
              title={t('pptEditor.quickActions.deleteDesc')}
            >
              <Trash2 className="w-3 h-3" />
              {!isMobile && t('pptEditor.quickActions.delete')}
            </Button>
          </div>
          {!isMobile && <Separator orientation="vertical" className="h-6" />}
        </>
      )}

      <div className="flex-1" />

      {/* 视图控制 - 移动端简化 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCanvasScale(Math.max(0.25, canvasScale - 0.1))}
          disabled={canvasScale <= 0.25}
          title={`${t('pptEditor.quickActions.zoomOut')} (${t('pptEditor.quickActions.zoomOutDesc')})`}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 min-w-16"
            onClick={() => setCanvasScale(1)}
            title={t('pptEditor.quickActions.resetView')}
          >
            {Math.round(canvasScale * 100)}%
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCanvasScale(Math.min(4, canvasScale + 0.1))}
          disabled={canvasScale >= 4}
          title={`${t('pptEditor.quickActions.zoomIn')} (${t('pptEditor.quickActions.zoomInDesc')})`}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={resetCanvas}
            title={t('pptEditor.quickActions.resetView')}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!isMobile && (
        <>
          <Separator orientation="vertical" className="h-6" />

          {/* 显示控制 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant={showRuler ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                showRuler && "bg-purple-500 text-white hover:bg-purple-600"
              )}
              onClick={toggleRuler}
              title={t('pptEditor.quickActions.showRuler')}
            >
              <Ruler className="w-4 h-4" />
            </Button>

            <Button
              variant={showGrid ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                showGrid && "bg-purple-500 text-white hover:bg-purple-600"
              )}
              onClick={toggleGrid}
              title={t('pptEditor.quickActions.showGrid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          {/* 网格大小调节 */}
          {showGrid && (
            <>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('pptEditor.quickActions.grid')}:</span>
                <div className="w-20">
                  <Slider
                    value={[gridSize]}
                    onValueChange={(value) => setGridSize(value[0])}
                    min={10}
                    max={100}
                    step={10}
                    className="h-8"
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-8">
                  {gridSize}px
                </span>
              </div>
            </>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* 添加元素 */}
          <ElementCreator
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-shrink-0"
                title={t('pptEditor.quickActions.addElement')}
              >
                <Plus className="w-4 h-4" />
                {t('pptEditor.quickActions.add')}
              </Button>
            }
          />

          <Separator orientation="vertical" className="h-6" />

          {/* 预览和全屏 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 gap-1"
              onClick={toggleFullscreen}
              title={t('pptEditor.quickActions.fullscreenEdit')}
            >
              <Maximize className="w-4 h-4" />
              {t('pptEditor.quickActions.fullscreen')}
            </Button>
          </div>
        </>
      )}

      {/* 表格设置弹窗 */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-md" style={{ zIndex: Z_INDEX.DIALOG }}>
          <DialogHeader>
            <DialogTitle>{t('pptEditor.elementCreator.table')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => createTableElement(3, 3)}
                className="h-16 flex flex-col items-center justify-center"
                variant="outline"
              >
                <Table className="w-6 h-6 mb-1" />
                <span className="text-xs">{t('pptEditor.elementCreator.table3x3')}</span>
              </Button>
              <Button 
                onClick={() => createTableElement(4, 3)}
                className="h-16 flex flex-col items-center justify-center"
                variant="outline"
              >
                <Table className="w-6 h-6 mb-1" />
                <span className="text-xs">{t('pptEditor.elementCreator.table4x3')}</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => createTableElement(2, 4)}
                className="h-16 flex flex-col items-center justify-center"
                variant="outline"
              >
                <Table className="w-6 h-6 mb-1" />
                <span className="text-xs">2×4 表格</span>
              </Button>
              <Button 
                onClick={() => createTableElement(5, 3)}
                className="h-16 flex flex-col items-center justify-center"
                variant="outline"
              >
                <Table className="w-6 h-6 mb-1" />
                <span className="text-xs">5×3 表格</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图表设置弹窗 */}
      <Dialog open={chartDialogOpen} onOpenChange={setChartDialogOpen}>
        <DialogContent className="max-w-md" style={{ zIndex: Z_INDEX.DIALOG }}>
          <DialogHeader>
            <DialogTitle>{t('pptEditor.elementCreator.chart')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                onClick={() => createChartElement('bar')}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <BarChart3 className="w-6 h-6 mb-1" />
                <span className="text-xs">{t('pptEditor.elementCreator.barChart')}</span>
              </Button>
              <Button 
                onClick={() => createChartElement('line')}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center mb-1">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                    <polyline points="3,17 9,11 13,15 21,7" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-xs">{t('pptEditor.elementCreator.lineChart')}</span>
              </Button>
              <Button 
                onClick={() => createChartElement('pie')}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <div className="w-6 h-6 flex items-center justify-center mb-1">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeWidth="2"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-xs">{t('pptEditor.elementCreator.pieChart')}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}