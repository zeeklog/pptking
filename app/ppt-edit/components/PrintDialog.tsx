'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { 
  Printer,
  FileText,
  Grid,
  StickyNote
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';

interface PrintDialogProps {
  trigger?: React.ReactNode;
}

export function PrintDialog({ trigger }: PrintDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<'slides' | 'handouts' | 'notes'>('slides');
  const [slidesPerPage, setSlidesPerPage] = useState(6);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const { printSlides, slides } = usePPTStore();

  // 监听打印快捷键
  useEffect(() => {
    const handleOpenPrint = () => {
      setIsOpen(true);
    };

    window.addEventListener('openPrint', handleOpenPrint);
    
    return () => {
      window.removeEventListener('openPrint', handleOpenPrint);
    };
  }, []);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printSlides(layout, slidesPerPage);
      setIsOpen(false);
    } catch (error) {
      console.error('打印失败:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Printer className="w-4 h-4 mr-2" />
      打印
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            打印设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 打印布局 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">打印布局</Label>
            <RadioGroup value={layout} onValueChange={(value) => setLayout(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="slides" id="slides" />
                <Label htmlFor="slides" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  幻灯片 (每页一张)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="handouts" id="handouts" />
                <Label htmlFor="handouts" className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  讲义 (多张一页)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="notes" id="notes" />
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  备注页
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 讲义设置 */}
          {layout === 'handouts' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">每页幻灯片数量</Label>
              <Select value={slidesPerPage.toString()} onValueChange={(value) => setSlidesPerPage(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 张</SelectItem>
                  <SelectItem value="2">2 张</SelectItem>
                  <SelectItem value="4">4 张</SelectItem>
                  <SelectItem value="6">6 张</SelectItem>
                  <SelectItem value="9">9 张</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 备注设置 */}
          {layout !== 'notes' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-notes"
                checked={includeNotes}
                onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
              />
              <Label htmlFor="include-notes" className="text-sm">
                包含演讲者备注
              </Label>
            </div>
          )}

          {/* 预览信息 */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div>共 {slides.length} 张幻灯片</div>
            {layout === 'handouts' && (
              <div>将打印 {Math.ceil(slides.length / slidesPerPage)} 页讲义</div>
            )}
            {layout === 'notes' && (
              <div>将打印 {slides.length} 页备注</div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? '正在打印...' : '打印'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}