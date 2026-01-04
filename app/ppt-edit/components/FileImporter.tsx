'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StyledButton } from './StyledButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { FileImporter } from '../utils/import-utils';
import { cn } from '@/lib/utils';

interface FileImporterProps {
  trigger?: React.ReactNode;
  onImportSuccess?: () => void;
}

export function FileImporterComponent({ trigger, onImportSuccess }: FileImporterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [dragActive, setDragActive] = useState(false);

  const { importFromPPTX, importFromJSON, setTitle } = usePPTStore();

  const handleFileImport = useCallback(async (file: File) => {
    if (!FileImporter.isValidFileType(file)) {
      setImportStatus({
        type: 'error',
        message: '不支持的文件格式。请选择 .pptx、.ppt 或 .json 文件。',
      });
      return;
    }

    if (!FileImporter.isValidFileSize(file)) {
      const maxSize = FileImporter.getMaxFileSize() / (1024 * 1024);
      setImportStatus({
        type: 'error',
        message: `文件大小超过限制。最大支持 ${maxSize}MB 的文件。`,
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus({ type: 'idle', message: '' });

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      // 直接使用store的导入函数，避免重复解析
      if (file.name.endsWith('.json')) {
        // 对于JSON文件，先读取内容再导入
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            await importFromJSON(data);

            clearInterval(progressInterval);
            setImportProgress(100);
            setImportStatus({
              type: 'success',
              message: `成功导入 ${data.slides?.length || 0} 张幻灯片`,
            });

            // 延迟关闭对话框和重置状态
            setTimeout(() => {
              setIsOpen(false);
              setIsImporting(false);
              setImportProgress(0);
              setImportStatus({ type: 'idle', message: '' });
              onImportSuccess?.();
            }, 1500);
          } catch (error) {
            setImportStatus({
              type: 'error',
              message: 'JSON文件格式无效',
            });
          } finally {
            setIsImporting(false);
            setImportProgress(0);
          }
        };
        reader.readAsText(file);
      } else {
        // 对于PPTX文件，直接使用store的导入函数
        await importFromPPTX(file);

        clearInterval(progressInterval);
        setImportProgress(100);
        setImportStatus({
          type: 'success',
          message: 'PPTX文件导入成功',
        });

        // 延迟关闭对话框和重置状态
        setTimeout(() => {
          setIsOpen(false);
          setIsImporting(false);
          setImportProgress(0);
          setImportStatus({ type: 'idle', message: '' });
          onImportSuccess?.();
        }, 1500);
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '导入失败，请重试',
      });
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importFromPPTX, importFromJSON, onImportSuccess]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  }, [handleFileImport]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  }, [handleFileImport]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const resetStatus = () => {
    setImportStatus({ type: 'idle', message: '' });
    setImportProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <StyledButton
            variant="secondary"
            className="gap-2"
            onClick={resetStatus}
          >
            <Upload className="w-4 h-4" />
            导入PPTX 
          </StyledButton>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            导入演示文稿
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 拖拽上传区域 */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-gray-300 dark:border-gray-600",
              !isImporting && "hover:border-purple-400 hover:bg-purple-25"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className={cn(
              "w-12 h-12 mx-auto mb-4",
              dragActive ? "text-purple-600" : "text-gray-400"
            )} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              拖拽文件到这里
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              支持 .pptx、.ppt、.json 格式，最大 10MB
            </p>

            {/* 文件选择按钮 */}
            {!isImporting && <div className="relative">
              <Input
                type="file"
                accept=".pptx,.ppt,.json"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                disabled={isImporting}
                className="relative z-10 pointer-events-none"
              >
                选择文件
              </Button>
            </div>}
          </div>

          {/* 导入进度 */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">导入进度</span>
                <span className="text-purple-600 font-medium">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          {/* 状态提示 */}
          {importStatus.type !== 'idle' && (
            <Alert className={cn(
              importStatus.type === 'success' && "border-green-200 bg-green-50 dark:bg-green-900/20",
              importStatus.type === 'error' && "border-red-200 bg-red-50 dark:bg-red-900/20"
            )}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={cn(
                importStatus.type === 'success' && "text-green-700 dark:text-green-400",
                importStatus.type === 'error' && "text-red-700 dark:text-red-400"
              )}>
                {importStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 支持格式说明 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium">支持的文件格式：</p>
            <ul className="space-y-1 ml-4">
              <li>• .pptx - PowerPoint 演示文稿 (推荐)</li>
              <li>• .ppt - PowerPoint 97-2003 演示文稿</li>
              <li>• .json - PPT KING 导出的JSON文件</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}