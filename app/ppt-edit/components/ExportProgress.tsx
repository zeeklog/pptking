'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  Image, 
  FileX,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

export function ExportProgress() {
  const { t } = useTranslation();
  const { exportProgress } = usePPTStore();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isOpen = exportProgress.isExporting || showSuccess;

  useEffect(() => {
    if (exportProgress.progress === 100 && !exportProgress.isExporting) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [exportProgress.progress, exportProgress.isExporting]);

  const getExportIcon = () => {
    switch (exportProgress.type) {
      case 'pptx':
        return <FileText className="w-8 h-8 text-purple-600" />;
      case 'pdf':
        return <FileX className="w-8 h-8 text-red-600" />;
      case 'image':
        return <Image className="w-8 h-8 text-blue-600" />;
      case 'json':
        return <Download className="w-8 h-8 text-green-600" />;
      default:
        return <Download className="w-8 h-8 text-gray-600" />;
    }
  };

  const getExportTitle = () => {
    if (showSuccess) return '导出完成';
    
    switch (exportProgress.type) {
      case 'pptx':
        return '正在导出 PPTX 文件...';
      case 'pdf':
        return '正在导出 PDF 文件...';
      case 'image':
        return '正在导出图片文件...';
      case 'json':
        return '正在导出 JSON 文件...';
      default:
        return '正在导出...';
    }
  };

  const getExportDescription = () => {
    if (showSuccess) {
      return '文件已成功导出到您的下载文件夹';
    }
    
    switch (exportProgress.type) {
      case 'pptx':
        return '正在生成PowerPoint文件，包含所有元素和动画效果';
      case 'pdf':
        return '正在将幻灯片转换为PDF格式，适合打印和分享';
      case 'image':
        return '正在将每张幻灯片导出为高清图片';
      case 'json':
        return '正在保存项目数据，可用于后续导入编辑';
      default:
        return '请稍候，正在处理您的文件...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {showSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : exportProgress.isExporting ? (
              <div className="relative">
                {getExportIcon()}
                <Loader2 className="w-4 h-4 absolute -top-1 -right-1 animate-spin text-purple-600" />
              </div>
            ) : (
              getExportIcon()
            )}
            <span className="text-lg">{getExportTitle()}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 描述文本 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {getExportDescription()}
          </p>
          
          {/* 进度条 */}
          {!showSuccess && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">导出进度</span>
                <span className="text-purple-600 font-medium">{exportProgress.progress}%</span>
              </div>
              <Progress 
                value={exportProgress.progress} 
                className="h-3"
              />
            </div>
          )}
          
          {/* 成功状态 */}
          {showSuccess && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-green-700 dark:text-green-400">导出成功！</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  文件已保存到您的下载文件夹
                </p>
              </div>
            </div>
          )}
          
          {/* 提示信息 */}
          {exportProgress.isExporting && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    导出提示
                  </h4>
                  <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• 请勿关闭浏览器窗口</li>
                    <li>• 大型文件可能需要更长时间</li>
                    <li>• 导出完成后会自动下载</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}