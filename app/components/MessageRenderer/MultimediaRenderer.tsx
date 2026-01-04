'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  ExternalLink, 
  FileText,
  Image,
  Music,
  Video,
  File,
  Code,
  Database,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize, formatDuration } from '@/lib/message-utils';

interface AudioContent {
  url: string;
  duration?: number;
  format?: string;
}

interface VideoContent {
  url: string;
  duration?: number;
  format?: string;
  thumbnail?: string;
}

interface FileContent {
  url: string;
  filename: string;
  size?: number;
  mime_type?: string;
}

interface CodeContent {
  language: string;
  code: string;
  filename?: string;
}

interface DataContent {
  format: string;
  content: string;
  schema?: any;
}

interface MultimediaRendererProps {
  images: string[];
  audios: AudioContent[];
  videos: VideoContent[];
  files: FileContent[];
  codeBlocks: CodeContent[];
  data: DataContent[];
  className?: string;
}

export function MultimediaRenderer({
  images,
  audios,
  videos,
  files,
  codeBlocks,
  data,
  className,
}: MultimediaRendererProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<Record<string, number>>({});
  const [mutedAudio, setMutedAudio] = useState<Record<string, boolean>>({});

  const handleAudioPlay = (url: string) => {
    setPlayingAudio(url);
  };

  const handleAudioPause = () => {
    setPlayingAudio(null);
  };

  const handleVideoPlay = (url: string) => {
    setPlayingVideo(url);
  };

  const handleVideoPause = () => {
    setPlayingVideo(null);
  };

  const toggleAudioMute = (url: string) => {
    setMutedAudio(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="w-4 h-4" />;
    
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('text/')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('csv')) {
      return <Database className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getFileTypeColor = (mimeType?: string) => {
    if (!mimeType) return 'bg-tech-500';
    
    if (mimeType.startsWith('image/')) return 'bg-success-500';
    if (mimeType.startsWith('audio/')) return 'bg-info-500';
    if (mimeType.startsWith('video/')) return 'bg-purple-500';
    if (mimeType.startsWith('text/')) return 'bg-warning-500';
    if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('csv')) {
      return 'bg-orange-500';
    }
    return 'bg-tech-500';
  };

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* 图片内容 */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <Image className="w-4 h-4 mr-2 text-purple-500" />
              图片 ({images.length})
            </h4>
          </div>
          <div className="p-4">
            <div className={cn(
              'grid gap-4',
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'
            )}>
              {images.map((src, index) => (
                <div key={index} className="relative group">
                  <img
                    src={src}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-auto rounded-lgborder-purple-200 dark:border-purple-700 cursor-pointer hover:opacity-80 transition-all duration-300 shadow-purple-sm hover:shadow-purple-md"
                    onClick={() => openInNewTab(src)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInNewTab(src)}
                      className="bg-white/90 dark:bg-tech-800/90 text-purple-600 dark:text-purple-400 hover:bg-white dark:hover:bg-tech-800border-purple-200 dark:border-purple-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 音频内容 */}
      {audios.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <Music className="w-4 h-4 mr-2 text-info-500" />
              音频 ({audios.length})
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {audios.map((audio, index) => (
              <Card key={index} className="p-4  border-purple-200 dark:border-purple-700 shadow-purple-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (playingAudio === audio.url) {
                          handleAudioPause();
                        } else {
                          handleAudioPlay(audio.url);
                        }
                      }}
                      className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                    >
                      {playingAudio === audio.url ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-sm font-semibold text-tech-700 dark:text-tech-200">音频 {index + 1}</p>
                      {audio.duration && (
                        <p className="text-xs text-tech-500 dark:text-tech-400">
                          {formatDuration(audio.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAudioMute(audio.url)}
                      className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                    >
                      {mutedAudio[audio.url] ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(audio.url, `audio-${index + 1}.${audio.format || 'mp3'}`)}
                      className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <audio
                  src={audio.url}
                  controls
                  className="w-full mt-3"
                  onPlay={() => handleAudioPlay(audio.url)}
                  onPause={handleAudioPause}
                  muted={mutedAudio[audio.url]}
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 视频内容 */}
      {videos.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <Video className="w-4 h-4 mr-2 text-purple-500" />
              视频 ({videos.length})
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {videos.map((video, index) => (
              <Card key={index} className="p-4  border-purple-200 dark:border-purple-700 shadow-purple-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-tech-700 dark:text-tech-200">视频 {index + 1}</p>
                    {video.duration && (
                      <p className="text-xs text-tech-500 dark:text-tech-400">
                        {formatDuration(video.duration)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(video.url, `video-${index + 1}.${video.format || 'mp4'}`)}
                    className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <video
                  src={video.url}
                  controls
                  className="w-full rounded-lgborder-purple-200 dark:border-purple-700"
                  poster={video.thumbnail}
                  onPlay={() => handleVideoPlay(video.url)}
                  onPause={handleVideoPause}
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 文件内容 */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <File className="w-4 h-4 mr-2 text-tech-500" />
              文件 ({files.length})
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {files.map((file, index) => (
              <Card key={index} className="p-4  border-purple-200 dark:border-purple-700 shadow-purple-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                      getFileTypeColor(file.mime_type)
                    )}>
                      {getFileIcon(file.mime_type)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-tech-700 dark:text-tech-200">{file.filename}</p>
                      <div className="flex items-center space-x-2 text-xs text-tech-500 dark:text-tech-400">
                        {file.size && <span>{formatFileSize(file.size)}</span>}
                        {file.mime_type && <span>{file.mime_type}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInNewTab(file.url)}
                      className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file.url, file.filename)}
                      className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 代码块内容 */}
      {codeBlocks.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <Code className="w-4 h-4 mr-2 text-purple-500" />
              代码文件 ({codeBlocks.length})
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {codeBlocks.map((codeBlock, index) => (
              <Card key={index} className="p-4  border-purple-200 dark:border-purple-700 shadow-purple-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      {codeBlock.language}
                    </Badge>
                    {codeBlock.filename && (
                      <span className="text-sm text-tech-500 dark:text-tech-400">{codeBlock.filename}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([codeBlock.code], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      downloadFile(url, codeBlock.filename || `code-${index + 1}.${codeBlock.language}`);
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="p-3 bg-white dark:bg-tech-900 rounded-lg text-xs overflow-x-auto max-h-32border-purple-200 dark:border-purple-700 shadow-purple-sm">
                  <code className="text-tech-700 dark:text-tech-300">{codeBlock.code}</code>
                </pre>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 数据内容 */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-tech-800 rounded-lgborder-purple-200 dark:border-purple-700 shadow-purple-sm">
          <div className="p-4 border-b border-purple-200 dark:border-purple-700">
            <h4 className="text-sm font-semibold text-tech-700 dark:text-tech-200 flex items-center">
              <Database className="w-4 h-4 mr-2 text-orange-500" />
              数据 ({data.length})
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {data.map((dataItem, index) => (
              <Card key={index} className="p-4  border-purple-200 dark:border-purple-700 shadow-purple-sm">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                    {dataItem.format.toUpperCase()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([dataItem.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      downloadFile(url, `data-${index + 1}.${dataItem.format}`);
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-700/50border-purple-300 dark:border-purple-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="p-3 bg-white dark:bg-tech-900 rounded-lg text-xs overflow-x-auto max-h-32border-purple-200 dark:border-purple-700 shadow-purple-sm">
                  <code className="text-tech-700 dark:text-tech-300">{dataItem.content}</code>
                </pre>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
