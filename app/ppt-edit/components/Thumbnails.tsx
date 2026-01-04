'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Copy, 
  Trash2, 
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  MoreHorizontal,
  Palette,
  Image,
  BarChart3,
  Table,
  Layers
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { TemplateSelector } from './TemplateSelector';
import { SlideSorter } from './SlideSorter';
import { cn } from '@/lib/utils';

// 通用元素渲染函数，与EditableElement中的renderUniversalElementContent保持一致
function renderThumbnailElementContent(element: any, thumbnailScale: number = 0.1): React.ReactNode {
  switch (element.type) {
    case 'text':
      return (
        <div
          className="w-full h-full flex items-center justify-center text-xs overflow-hidden"
          style={{
            color: element.text?.color || '#374151',
            fontSize: `${Math.max((element.text?.fontSize || 16) * thumbnailScale, 6)}px`,
            fontWeight: element.text?.bold ? 'bold' : 'normal',
            fontStyle: element.text?.italic ? 'italic' : 'normal',
            textAlign: element.text?.align || 'left',
            lineHeight: element.text?.lineHeight || 1.5,
            letterSpacing: `${(element.text?.letterSpacing || 0) * thumbnailScale}px`,
            whiteSpace: (element.content || element.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
          }}
          dangerouslySetInnerHTML={{
            __html: element.content || element.text?.content || '文本'
          }}
        />
      );

    case 'shape':
      // 首先检查是否是路径形状（包含path属性）或特殊形状类型
      if ((element.shape?.path && element.shape?.isPathShape) || element.path) {
        const pathData = element.shape?.path || element.path;
        return (
          <div 
            className="w-full h-full relative"
            style={{
              backgroundImage: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                ? `url(${element.shape.fill})` 
                : undefined,
              backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
              backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
              backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
              borderRadius: element.shapType === 'circle' || element.shape?.type === 'circle' ? '50%' : `${Math.max((element.shape?.borderRadius || 2) * thumbnailScale, 1)}px`,
              overflow: 'hidden',
            }}
          >
            <svg className="w-full h-full" viewBox={`0 0 ${element.width} ${element.height}`}>
              <path
                d={pathData}
                fill={(() => {
                  if (element.shape?.fill === 'transparent') return 'none';
                  if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) return 'none';
                  if (element.shape?.fill !== undefined) return element.shape.fill;
                  if (element.fill?.type === 'color') return element.fill.value !== 'transparent' ? element.fill.value : 'none';
                  return element.fill && element.fill !== 'transparent' ? element.fill : 'none';
                })()}
                stroke={element.shape?.stroke || element.borderColor || 'transparent'}
                strokeWidth={Math.max((element.shape?.strokeWidth || element.borderWidth || 0) * thumbnailScale, 0.5)}
                strokeDasharray={element.borderStrokeDasharray !== "0" && element.borderStrokeDasharray ? element.borderStrokeDasharray : undefined}
              />
              
              {/* 如果是箭头，添加箭头标记 */}
              {(element.name?.includes('箭头') || element.name?.includes('Arrow') || element.shapType?.includes('Arrow')) && (
                <defs>
                  <marker
                    id={`arrow-${element.id}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon 
                      points="0,0 0,6 9,3" 
                      fill={element.shape?.stroke || element.borderColor || '#374151'} 
                    />
                  </marker>
                </defs>
              )}
            </svg>
            
            {/* 如果形状包含文本内容，叠加在SVG之上 */}
            {element.content && (
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none text-xs"
                style={{
                  textAlign: element.vAlign === 'mid' ? 'center' : 'left',
                  alignItems: element.vAlign === 'mid' ? 'center' : 'flex-start',
                }}
                dangerouslySetInnerHTML={{
                  __html: element.content
                }}
              />
            )}
            
            {/* 如果形状有shape.text属性 */}
            {element.shape?.text && (
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none text-xs"
                style={{
                  color: element.shape.text.color,
                  fontSize: `${Math.max((element.shape.text.fontSize || 16) * thumbnailScale, 6)}px`,
                  fontFamily: element.shape.text.fontFamily,
                  fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                  fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                  textAlign: element.shape.text.align,
                  lineHeight: element.shape.text.lineHeight,
                  whiteSpace: (element.shape.text.content || '').includes('\n') ? 'pre-line' : 'normal',
                }}
              >
                {element.shape.text.content}
              </div>
            )}
          </div>
        );
      }
      
      // 检查是否是线条类型的形状
      if (element.shapType === 'line' || element.name?.includes('直线') || element.name?.includes('line')) {
        return (
          <svg className="w-full h-full">
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={element.shape?.stroke || element.borderColor || '#374151'}
              strokeWidth={Math.max((element.shape?.strokeWidth || element.borderWidth || 2) * thumbnailScale, 0.5)}
              strokeDasharray={element.borderStrokeDasharray !== "0" && element.borderStrokeDasharray ? element.borderStrokeDasharray : undefined}
            />
          </svg>
        );
      }
      
      // 普通形状的渲染逻辑
      return (
        <div
          className="w-full h-full border"
          style={{
            backgroundColor: (() => {
              if (element.fill?.type === 'color') return element.fill.value;
              if (element.shape?.fill === 'transparent') return 'transparent';
              if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) return 'transparent';
              return element.shape?.fill || '#6366F1';
            })(),
            backgroundImage: (() => {
              if (element.shape?.gradient) {
                return `${element.shape.gradient.type}-gradient(${element.shape.gradient.angle}deg, ${element.shape.gradient.colors.join(', ')})`;
              }
              if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) {
                return `url(${element.shape.fill})`;
              }
              return undefined;
            })(),
            backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
            backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
            backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
            borderColor: element.shape?.stroke === 'transparent' ? 'transparent' : (element.shape?.stroke || element.borderColor || '#E5E7EB'),
            borderWidth: `${Math.max((element.shape?.strokeWidth || element.borderWidth || 0) * thumbnailScale, 0.5)}px`,
            borderRadius: element.shapType === 'circle' || element.shape?.type === 'circle' ? '50%' : `${Math.max((element.shape?.borderRadius || 2) * thumbnailScale, 1)}px`,
          }}
        >
          {/* 如果形状包含文本内容 */}
          {element.content && (
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden text-xs"
              style={{
                textAlign: element.vAlign === 'mid' ? 'center' : 'left',
                alignItems: element.vAlign === 'mid' ? 'center' : 'flex-start',
              }}
              dangerouslySetInnerHTML={{
                __html: element.content
              }}
            />
          )}
          
          {/* 如果形状有shape.text属性 */}
          {element.shape?.text && (
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden text-xs"
              style={{
                color: element.shape.text.color || '#000',
                fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                textAlign: element.shape.text.align || 'center',
                lineHeight: element.shape.text.lineHeight || 1.2,
                fontSize: `${Math.max((element.shape.text.fontSize || 16) * thumbnailScale, 6)}px`,
                whiteSpace: (element.shape.text.content || '').includes('\n') ? 'pre-line' : 'normal',
              }}
            >
              {element.shape.text.content}
            </div>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
          {element.image?.src ? (
            <img 
              src={element.image.src} 
              alt={element.image.alt || '图片'} 
              className="w-full h-full object-cover"
              style={{
                borderRadius: `${Math.max(1, (element.image.borderRadius || 0) * thumbnailScale)}px`,
                filter: element.image.filters ? `
                  blur(${(element.image.filters.blur || 0) * thumbnailScale}px)
                  brightness(${element.image.filters.brightness || 100}%)
                  contrast(${element.image.filters.contrast || 100}%)
                  grayscale(${element.image.filters.grayscale || 0}%)
                  saturate(${element.image.filters.saturate || 100}%)
                  hue-rotate(${element.image.filters.hue || 0}deg)
                `.trim() : 'none',
              }}
            />
          ) : (
            <Image className="w-3 h-3 text-gray-400" />
          )}
        </div>
      );

    case 'line':
      return (
        <svg className="w-full h-full">
          {element.line?.points ? (
            <polyline
              points={element.line.points.map((p: any) => `${p.x},${p.y}`).join(' ')}
              stroke={element.line.stroke || '#374151'}
              strokeWidth={Math.max((element.line.strokeWidth || 2) * thumbnailScale, 0.5)}
              strokeDasharray={element.line.strokeDasharray}
              fill="none"
            />
          ) : (
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={element.line?.stroke || '#374151'}
              strokeWidth={Math.max((element.line?.strokeWidth || 2) * thumbnailScale, 0.5)}
              strokeDasharray={element.line?.strokeDasharray}
            />
          )}
        </svg>
      );

    case 'chart':
      return (
        <div className="w-full h-full bg-purple-100 dark:bg-purple-800/20 rounded flex items-center justify-center">
          <BarChart3 className="w-3 h-3 text-purple-500" />
        </div>
      );

    case 'table':
      // 如果有表格数据，渲染简化的表格预览
      if (element.table && element.table.data && Array.isArray(element.table.data)) {
        const { rows, cols, data, cellStyle, borderStyle } = element.table;
        const maxPreviewRows = Math.min(rows || data.length, 3);
        const maxPreviewCols = Math.min(cols || (data[0]?.length || 3), 3);
        
        return (
          <div className="w-full h-full p-0.5">
            <div 
              className="w-full h-full border rounded overflow-hidden"
              style={{
                borderWidth: Math.max((borderStyle?.width || 1) * thumbnailScale, 0.5),
                borderColor: borderStyle?.color || '#E5E7EB',
                borderStyle: borderStyle?.style || 'solid',
              }}
            >
              <table className="w-full h-full border-collapse table-fixed">
                <tbody>
                  {data.slice(0, maxPreviewRows).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {(Array.isArray(row) ? row : []).slice(0, maxPreviewCols).map((cell: any, colIndex: number) => {
                        // 简化的单元格内容提取
                        let cellContent = '';
                        if (typeof cell === 'string') {
                          cellContent = cell;
                        } else if (cell && typeof cell === 'object') {
                          if (cell.content !== undefined) {
                            cellContent = String(cell.content);
                          } else if (cell.text) {
                            // 简单HTML标签移除
                            cellContent = String(cell.text).replace(/<[^>]*>/g, '').trim();
                          } else {
                            cellContent = String(cell);
                          }
                        }
                        
                        return (
                          <td
                            key={colIndex}
                            className="border"
                            style={{
                              fontSize: `${Math.max((cellStyle?.fontSize || 14) * thumbnailScale, 4)}px`,
                              color: cellStyle?.color || '#374151',
                              backgroundColor: cellStyle?.backgroundColor || 'transparent',
                              fontWeight: cellStyle?.bold ? 'bold' : 'normal',
                              textAlign: cellStyle?.align || 'left',
                              padding: '1px 2px',
                              borderWidth: '0.5px',
                              borderColor: borderStyle?.color || '#E5E7EB',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      
      // 如果没有数据，显示图标
      return (
        <div className="w-full h-full bg-blue-100 dark:bg-blue-800/20 rounded flex items-center justify-center">
          <Table className="w-3 h-3 text-blue-500" />
        </div>
      );

    case 'latex':
      return (
        <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
          <div className="text-xs text-green-600 dark:text-green-400">∑</div>
        </div>
      );

    case 'video':
      return (
        <div className="w-full h-full bg-black rounded flex items-center justify-center">
          {element.media?.src ? (
            <div className="text-white text-xs">🎥</div>
          ) : (
            <div className="w-3 h-3 text-red-400">🎥</div>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
          <div className="w-3 h-3 text-green-600 dark:text-green-400">🎵</div>
        </div>
      );

    case 'group':
      // 递归渲染group中的所有元素
      const groupElements = element.elements || element.groupedElements || [];
      return (
        <div className="w-full h-full relative overflow-hidden">
          {groupElements.map((childElement: any, index: number) => {
            // 计算子元素在组合中的相对位置和大小（百分比）
            const childLeft = childElement.left || childElement.x || 0;
            const childTop = childElement.top || childElement.y || 0;
            const childWidth = childElement.width || 100;
            const childHeight = childElement.height || 100;
            
            const relativeX = (childLeft / element.width) * 100;
            const relativeY = (childTop / element.height) * 100;
            const relativeWidth = (childWidth / element.width) * 100;
            const relativeHeight = (childHeight / element.height) * 100;
            
            return (
              <div
                key={`thumbnail-group-child-${element.id || 'unknown'}-${index}`}
                className="absolute"
                style={{
                  left: `${relativeX}%`,
                  top: `${relativeY}%`,
                  width: `${relativeWidth}%`,
                  height: `${relativeHeight}%`,
                  transform: `rotate(${childElement.rotate || childElement.rotation || 0}deg)`,
                  opacity: childElement.opacity || 1,
                  zIndex: childElement.order || childElement.zIndex || index,
                }}
              >
                {/* 递归渲染子元素 */}
                {renderThumbnailElementContent(childElement, thumbnailScale)}
              </div>
            );
          })}
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
          <span className="text-xs text-gray-500">未知元素</span>
        </div>
      );
  }
}

interface ThumbnailSlideProps {
  slide: any;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ThumbnailSlide({ slide, index, isActive, onSelect, onDuplicate, onDelete }: ThumbnailSlideProps) {
  return (
    <div 
      className={cn(
        "relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200",
        isActive 
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
      )}
      onClick={onSelect}
    >
      {/* 幻灯片预览 */}
      <div className="aspect-[16/9] bg-white dark:bg-gray-800 p-2">
        <div 
          className="w-full h-full rounded border border-gray-200 dark:border-gray-600 relative overflow-hidden"
          style={{ 
            // 更完善的背景处理逻辑
            backgroundColor: (() => {
              // 如果有明确的背景色配置
              if (slide.background?.type === 'color' && slide.background.value) {
                return slide.background.value;
              }
              // 如果background是字符串（可能是颜色值）
              if (typeof slide.background === 'string' && slide.background !== 'transparent') {
                return slide.background;
              }
              // 如果background.value是颜色
              if (slide.background?.value && slide.background.type !== 'image' && slide.background.type !== 'gradient') {
                return slide.background.value;
              }
              // 默认白色背景
              return '#FFFFFF';
            })(),
            background: (() => {
              // 处理渐变背景
              if (slide.background?.type === 'gradient' && slide.background.value) {
                return slide.background.value;
              }
              // 处理图片背景
              if (slide.background?.type === 'image' && slide.background.value) {
                return `url(${slide.background.value})`;
              }
              return undefined;
            })(),
            backgroundSize: slide.background?.type === 'image' ? (slide.background.imageSize || 'cover') : undefined,
            backgroundPosition: slide.background?.type === 'image' ? 'center' : undefined,
            backgroundRepeat: slide.background?.type === 'image' && slide.background.imageSize === 'repeat' ? 'repeat' : 'no-repeat',
            opacity: slide.background?.type === 'image' && slide.background.opacity !== undefined ? 
                    slide.background.opacity : 1,
          }}
        >
          {/* 渲染元素预览 - 按zIndex排序 */}
          {slide.elements
            ?.slice() // 创建副本避免修改原数组
            .sort((a, b) => a.zIndex - b.zIndex) // 按zIndex从小到大排序
            .map((element: any) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: `${(element.x / 960) * 100}%`,
                top: `${(element.y / 540) * 100}%`,
                width: `${(element.width / 960) * 100}%`,
                height: `${(element.height / 540) * 100}%`,
                transform: `rotate(${element.rotation}deg)`,
                opacity: element.opacity,
                zIndex: element.zIndex,
              }}
            >
              {/* 使用通用渲染函数，与编辑器保持一致 */}
              {renderThumbnailElementContent(element, 0.15)}
            </div>
          ))}
        </div>
      </div>

      {/* 幻灯片信息 */}
      <div className="p-2 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {index + 1}
          </span>
          
          {/* 操作按钮 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-3 h-3 mr-2" />
                  复制幻灯片
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                  <Trash2 className="w-3 h-3 mr-2" />
                  删除幻灯片
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 幻灯片标题 */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          {slide.title}
        </p>
      </div>
    </div>
  );
}

export function Thumbnails() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'slides' | 'outline'>('slides');
  const {
    slides,
    activeSlideIndex,
    thumbnailsWidth,
    showThumbnails,
    setActiveSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
  } = usePPTStore();

  if (!showThumbnails) {
    return null;
  }

  // 生成大纲数据
  const generateOutline = () => {
    return slides.map((slide, index) => {
      // 获取标题文本（通常是最大字号的文本元素）
      const titleElement = slide.elements
        .filter(el => el.type === 'text')
        .sort((a, b) => (b.text?.fontSize || 16) - (a.text?.fontSize || 16))[0];
      
      const title = titleElement?.text?.content || `幻灯片 ${index + 1}`;
      
      // 获取其他文本内容作为子项
      const contentElements = slide.elements
        .filter(el => el.type === 'text' && el.id !== titleElement?.id)
        .map(el => el.text?.content || '')
        .filter(content => content.trim() !== '');
      
      return {
        slideIndex: index,
        title,
        content: contentElements,
      };
    });
  };

  return (
    <div 
      className="border-r flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800"
      style={{ 
        width: thumbnailsWidth,
        borderRightColor: '#C7D2FE'
      }}
    >
      {/* TAB 切换 */}
      <div className="border-b bg-white dark:bg-gray-800">
        <div className="flex h-12">
          <button
            className={cn(
              "flex-1 text-sm font-medium transition-colors relative",
              activeTab === 'slides'
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
            onClick={() => setActiveTab('slides')}
          >
            幻灯片
            {activeTab === 'slides' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
          <button
            className={cn(
              "flex-1 text-sm font-medium transition-colors relative",
              activeTab === 'outline'
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
            onClick={() => setActiveTab('outline')}
          >
            大纲
            {activeTab === 'outline' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
        </div>
      </div>

      {/* 幻灯片列表内容 */}
      {activeTab === 'slides' && (
        <>
          {/* 头部 */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-purple-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">幻灯片</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{slides.length} 张</p>
              </div>
            </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-purple-200 dark:border-gray-600">
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">新建幻灯片</div>
              <DropdownMenuItem 
                onClick={() => addSlide()} 
                className="rounded-lg h-10 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Plus className="w-4 h-4 mr-3 text-green-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">空白幻灯片</span>
                  <span className="text-xs text-gray-500">快速开始</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TemplateSelector 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                      <Palette className="w-4 h-4 mr-3 text-purple-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">从模板新建</span>
                        <span className="text-xs text-gray-500">选择设计模板</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 幻灯片列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <SlideSorter />
        </div>
      </ScrollArea>

          {/* 底部统计信息 */}
          <div className="h-12 flex items-center justify-between px-4 border-t border-purple-100 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                共 {slides.length} 张幻灯片
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {slides.reduce((total, slide) => total + (slide.elements?.length || 0), 0)} 个元素
            </div>
          </div>
        </>
      )}

      {/* 大纲视图 */}
      {activeTab === 'outline' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {generateOutline().map((item, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                  activeSlideIndex === item.slideIndex
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700"
                )}
                onClick={() => setActiveSlide(item.slideIndex)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {item.slideIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {item.title}
                    </h4>
                    {item.content.length > 0 && (
                      <ul className="space-y-1">
                        {item.content.slice(0, 3).map((content, contentIndex) => (
                          <li key={contentIndex} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="mr-2">•</span>
                            <span className="line-clamp-1">{content}</span>
                          </li>
                        ))}
                        {item.content.length > 3 && (
                          <li className="text-xs text-gray-400 dark:text-gray-500">
                            还有 {item.content.length - 3} 项内容...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {slides.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  暂无幻灯片内容
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}