'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  name: string;
  startSlide: number;
  endSlide: number;
  color: string;
  collapsed: boolean;
}

interface SectionManagerProps {
  trigger?: React.ReactNode;
}

export function SectionManager({ trigger }: SectionManagerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'section-1',
      name: '开场',
      startSlide: 0,
      endSlide: 2,
      color: '#6366F1',
      collapsed: false,
    },
    {
      id: 'section-2', 
      name: '主要内容',
      startSlide: 3,
      endSlide: 8,
      color: '#10B981',
      collapsed: false,
    },
    {
      id: 'section-3',
      name: '总结',
      startSlide: 9,
      endSlide: 10,
      color: '#F59E0B',
      collapsed: false,
    },
  ]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  const {
    slides,
    activeSlideIndex,
    setActiveSlide,
  } = usePPTStore();

  // 创建新分区
  const createSection = () => {
    if (!newSectionName.trim()) return;

    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: newSectionName,
      startSlide: activeSlideIndex,
      endSlide: Math.min(activeSlideIndex + 2, slides.length - 1),
      color: '#8B5CF6',
      collapsed: false,
    };

    setSections([...sections, newSection]);
    setNewSectionName('');
  };

  // 删除分区
  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  // 重命名分区
  const renameSection = (sectionId: string, newName: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, name: newName } : s
    ));
    setEditingSection(null);
  };

  // 切换分区折叠状态
  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ));
  };

  // 跳转到分区
  const goToSection = (section: Section) => {
    setActiveSlide(section.startSlide);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <FolderOpen className="w-4 h-4 mr-2" />
      分区管理
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh]" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            分区管理
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 创建新分区 */}
          <div className="space-y-2">
            <Label htmlFor="section-name" className="text-sm">创建新分区</Label>
            <div className="flex gap-2">
              <Input
                id="section-name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="输入分区名称..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createSection();
                  }
                }}
              />
              <Button
                onClick={createSection}
                disabled={!newSectionName.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* 分区列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg">
                {/* 分区头部 */}
                <div 
                  className={cn(
                    "flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    activeSlideIndex >= section.startSlide && activeSlideIndex <= section.endSlide &&
                    "bg-purple-50 dark:bg-purple-900/20"
                  )}
                  onClick={() => goToSection(section)}
                >
                  {/* 折叠按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id);
                    }}
                  >
                    {section.collapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>

                  {/* 分区颜色 */}
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />

                  {/* 分区名称 */}
                  <div className="flex-1">
                    {editingSection === section.id ? (
                      <Input
                        value={section.name}
                        onChange={(e) => {}}
                        onBlur={(e) => renameSection(section.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameSection(section.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingSection(null);
                          }
                        }}
                        className="h-6 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium">{section.name}</div>
                    )}
                  </div>

                  {/* 幻灯片范围 */}
                  <div className="text-xs text-gray-500">
                    {section.startSlide + 1}-{section.endSlide + 1}
                  </div>

                  {/* 操作菜单 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => setEditingSection(section.id)}>
                        <Edit className="w-3 h-3 mr-2" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteSection(section.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* 分区内容（幻灯片列表） */}
                {!section.collapsed && (
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-4 gap-1">
                      {slides
                        .slice(section.startSlide, section.endSlide + 1)
                        .map((slide, index) => {
                          const slideIndex = section.startSlide + index;
                          return (
                            <div
                              key={slide.id}
                              className={cn(
                                "aspect-[16/9] border rounded cursor-pointer transition-all",
                                slideIndex === activeSlideIndex
                                  ? "border-purple-500 shadow-md"
                                  : "border-gray-200 hover:border-purple-300"
                              )}
                              onClick={() => setActiveSlide(slideIndex)}
                            >
                              <div 
                                className="w-full h-full rounded text-xs flex items-center justify-center"
                                style={{ 
                                  backgroundColor: slide.background?.value || '#FFFFFF',
                                  color: slide.background?.value === '#FFFFFF' ? '#374151' : '#FFFFFF'
                                }}
                              >
                                {slideIndex + 1}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sections.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                暂无分区，创建第一个分区开始组织您的演示文稿
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="text-xs text-gray-500 border-t pt-3">
            共 {sections.length} 个分区 • {slides.length} 张幻灯片
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}