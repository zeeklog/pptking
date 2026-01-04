'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  File,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaUploaderProps {
  type: 'image' | 'video' | 'audio';
  accept?: string;
  src?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  onChange: (updates: {
    src?: string;
    autoplay?: boolean;
    loop?: boolean;
    controls?: boolean;
    poster?: string;
  }) => void;
  onUpload?: (url: any) => void;
}

export function MediaUploader({ 
  type, 
  src, 
  autoplay = false, 
  loop = false, 
  controls = true, 
  poster,
  onChange 
}: MediaUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(src);

  // 文件类型配置
  const fileConfig = {
    image: {
      accept: 'image/*',
      icon: ImageIcon,
      title: '图片',
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    video: {
      accept: 'video/*',
      icon: Video,
      title: '视频',
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    audio: {
      accept: 'audio/*',
      icon: Music,
      title: '音频',
      maxSize: 50 * 1024 * 1024, // 50MB
    },
  };

  const config = fileConfig[type];
  const Icon = config.icon;

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件大小
    if (file.size > config.maxSize) {
      alert(`文件大小不能超过 ${config.maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // 创建本地URL预览
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // 实际的文件处理逻辑
      // 对于本地文件，直接使用FileReader转换为base64
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        throw new Error('文件大小不能超过10MB');
      }
      
      const reader = new FileReader();
      const base64Result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 更新组件状态，使用base64数据
      onChange({ src: base64Result });
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('File upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('文件上传失败，请重试');
    }
  };

  // 删除文件
  const handleFileRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    onChange({ src: '' });
  };

  // 渲染预览
  const renderPreview = () => {
    if (!previewUrl) {
      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center">
          <Icon className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">点击上传{config.title}</p>
          <p className="text-xs text-gray-400 mt-1">支持 {config.accept}，最大 {config.maxSize / (1024 * 1024)}MB</p>
        </div>
      );
    }

    switch (type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={previewUrl}
              alt="预览图片"
              className="w-full aspect-video object-cover rounded border"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleFileRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
        
      case 'video':
        return (
          <div className="relative">
            <video
              src={previewUrl}
              poster={poster}
              controls={controls}
              autoPlay={autoplay}
              loop={loop}
              className="w-full aspect-video rounded border"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleFileRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
        
      case 'audio':
        return (
          <div className="relative">
            <div className="bg-gray-100 dark:bg-gray-700 rounded border p-4">
              <div className="flex items-center gap-3 mb-3">
                <Music className="w-8 h-8 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">音频文件</p>
                  <p className="text-xs text-gray-500">点击播放控件试听</p>
                </div>
              </div>
              <audio
                src={previewUrl}
                controls={controls}
                autoPlay={autoplay}
                loop={loop}
                className="w-full"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleFileRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 文件上传 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {config.title}文件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {renderPreview()}
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">上传中...</span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {!previewUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              选择{config.title}文件
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 媒体设置 */}
      {(type === 'video' || type === 'audio') && previewUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">播放设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">自动播放</Label>
              <Switch
                checked={autoplay}
                onCheckedChange={(checked) => onChange({ autoplay: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">循环播放</Label>
              <Switch
                checked={loop}
                onCheckedChange={(checked) => onChange({ loop: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">显示控件</Label>
              <Switch
                checked={controls}
                onCheckedChange={(checked) => onChange({ controls: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 视频封面设置 */}
      {type === 'video' && previewUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">视频封面</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">封面图片URL</Label>
              <Input
                value={poster || ''}
                onChange={(e) => onChange({ poster: e.target.value })}
                className="h-8"
                placeholder="输入封面图片URL"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={() => {
                // TODO: 上传封面图片
                console.log('Upload video poster');
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              上传封面图片
            </Button>
          </CardContent>
        </Card>
      )}

      {/* URL 输入 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">或输入URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={src || ''}
              onChange={(e) => onChange({ src: e.target.value })}
              className="flex-1 h-8"
              placeholder={`输入${config.title}文件URL`}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={() => setPreviewUrl(src)}
            >
              预览
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}