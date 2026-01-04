'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Edit3, Check, X, AlertCircle, Plus, Trash2, ChevronDown, ChevronRight, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditableMarkdownProps {
  content: string;
  onChange: (newContent: string) => void;
  readOnly?: boolean;
  className?: string;
}

interface EditableLine {
  id: string;
  content: string;
  isEditing: boolean;
  originalContent: string;
  lineNumber: number;
  level?: number; // 标题级别 (1-6)
  isCollapsed?: boolean; // 是否折叠
  isVisible?: boolean; // 是否可见（用于折叠逻辑）
  parentHeaderIndex?: number; // 父级标题索引
}

export default function EditableMarkdown({ 
  content, 
  onChange, 
  readOnly = false,
  className = ""
}: EditableMarkdownProps) {
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [sectionNumbers, setSectionNumbers] = useState<{[key: number]: number}>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 定义所有支持的行类型
  const lineTypes = [
    { value: 'separator', label: '新增章节', prefix: '---', description: 'PPT章节分隔' },
    { value: 'h1', label: '大标题', prefix: '# ', description: '文档主标题' },
    { value: 'h2', label: '二级标题', prefix: '## ', description: 'PPT章节标题' },
    { value: 'h3', label: '三级要点', prefix: '### ', description: '要点分组标题' },
    { value: 'h4', label: '四级标题', prefix: '#### ', description: '详细分类标题' },
    { value: 'h5', label: '五级标题', prefix: '##### ', description: '子分类标题' },
    { value: 'h6', label: '六级标题', prefix: '###### ', description: '最小标题' },
    { value: 'ul', label: '无序列表', prefix: '- ', description: '项目符号列表' },
    { value: 'ol', label: '有序列表', prefix: '1. ', description: '编号列表' },
    // { value: 'bold', label: '粗体文本', prefix: '**', suffix: '**', description: '强调文本' },
    { value: 'details', label: '详情', prefix: '<details>', suffix: '</details>', description: '可折叠内容' },
    { value: 'details-open', label: '详情展开', prefix: '<details open>', suffix: '</details>', description: '默认展开内容' },
    { value: 'paragraph', label: '普通段落', prefix: '', description: '正文内容' }
  ];

  // 检测当前行的类型
  const detectLineType = (content: string): string => {
    const trimmed = content.trim();
    const original = content;
    
    // 优先检查标题（需要精确匹配）
    if (trimmed.startsWith('#') && !trimmed.startsWith('## ')) return 'h1';
    if (trimmed.startsWith('##') && !trimmed.startsWith('### ')) return 'h2';
    if (trimmed.startsWith('###') && !trimmed.startsWith('#### ')) return 'h3';
    if (trimmed.startsWith('####') && !trimmed.startsWith('##### ')) return 'h4';
    if (trimmed.startsWith('#####') && !trimmed.startsWith('###### ')) return 'h5';
    if (trimmed.startsWith('######')) return 'h6';
    
    // 检查章节分隔符（必须完全匹配）
    if (trimmed === '---') return 'separator';
    
    // 检查details标签（支持open属性）
    if (trimmed.match(/^<details(\s+open)?>.*<\/details>$/)) {
      return trimmed.includes('open') ? 'details-open' : 'details';
    }
    
    // 检查粗体文本（完整的**包围）
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      return 'bold';
    }
    
    // 匹配无序列表项（- 或 *，后面可以有0个或1个空格）
    if (original.match(/^(\s*)[-*]\s?/)) return 'ul';
    // 匹配有序列表项（数字+.，后面可以有0个或1个空格）
    if (original.match(/^(\s*)\d+\.\s?/)) return 'ol';
    
    return 'paragraph';
  };

  // 提取纯文本内容（去除格式符号）
  const extractPureText = (content: string): string => {
    const trimmed = content.trim();
    const currentType = detectLineType(content);
    
    // 如果是空内容，直接返回空字符串
    if (!trimmed) return '';
    
    switch (currentType) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        const headerText = trimmed.replace(/^#+\s*/, ''); // 移除#和空格
        return headerText;
      case 'ul':
        const ulText = content.replace(/^(\s*)[-*]\s*/, ''); // 移除-/*和空格
        return ulText;
      case 'ol':
        const olText = content.replace(/^(\s*)\d+\.\s*/, ''); // 移除数字.和空格
        return olText;
      case 'bold':
        // 精确处理粗体：移除前后的**
        if (trimmed.length <= 4) return ''; // **或****的情况
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return trimmed.slice(2, -2); // 移除前后各两个*
        }
        return trimmed;
      case 'details':
        // 处理details标签（不带open）
        const detailsRegex = /^<details>(.+?)<\/details>$/;
        const detailsMatch = trimmed.match(detailsRegex);
        if (detailsMatch) {
          return detailsMatch[1];
        }
        return '';
      case 'details-open':
        // 处理details标签（带open）
        const detailsOpenRegex = /^<details\s+open>(.+?)<\/details>$/;
        const detailsOpenMatch = trimmed.match(detailsOpenRegex);
        if (detailsOpenMatch) {
          return detailsOpenMatch[1];
        }
        return '';
      case 'separator':
        return '';
      default:
        return trimmed;
    }
  };

  // 根据类型和纯文本生成完整内容
  const generateContentFromTypeAndText = (type: string, pureText: string, originalContent: string): string => {
    const typeConfig = lineTypes.find(t => t.value === type);
    if (!typeConfig) return pureText;
    
    // 对于章节分隔符，直接返回格式符号
    if (type === 'separator') {
      return typeConfig.prefix;
    }
    
    // 确保纯文本不为undefined
    const textContent = pureText || '';
    
    switch (type) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        // 标题：如果有内容就加上，没有内容就只返回前缀（用于新建）
        return textContent ? typeConfig.prefix + textContent : typeConfig.prefix.trim();
      case 'ul':
        // 无序列表：保持原有缩进
        const ulIndent = originalContent.match(/^(\s*)/)?.[1] || '';
        return textContent ? ulIndent + typeConfig.prefix + textContent : ulIndent + typeConfig.prefix.trim();
      case 'ol':
        // 有序列表：保持原有缩进
        const olIndent = originalContent.match(/^(\s*)/)?.[1] || '';
        return textContent ? olIndent + typeConfig.prefix + textContent : olIndent + typeConfig.prefix.trim();
      case 'bold':
        // 粗体：必须有内容才生成完整格式
        if (!textContent) return '**';
        return typeConfig.prefix + textContent + typeConfig.suffix;
      case 'details':
        // details标签：总是生成完整标签
        if (!textContent) return '<details></details>';
        return typeConfig.prefix + textContent + typeConfig.suffix;
      case 'details-open':
        // details open标签：总是生成完整标签
        if (!textContent) return '<details open></details>';
        return typeConfig.prefix + textContent + typeConfig.suffix;
      default:
        return textContent;
    }
  };

  // 获取标题级别
  const getHeaderLevel = (content: string): number | null => {
    const trimmed = content.trim();
    if (trimmed.startsWith('# ')) return 1;
    if (trimmed.startsWith('## ')) return 2;
    if (trimmed.startsWith('### ')) return 3;
    if (trimmed.startsWith('#### ')) return 4;
    if (trimmed.startsWith('##### ')) return 5;
    if (trimmed.startsWith('###### ')) return 6;
    return null;
  };

  // 分析文档结构，构建层级关系和章节号
  const analyzeDocumentStructure = (contentLines: string[]) => {
    const lines: EditableLine[] = [];
    let headerStack: number[] = []; // 存储各级标题的索引
    let sectionCount = 0; // PPT章节计数
    const newSectionNumbers: {[key: number]: number} = {};

    // 第一遍：构建基本结构
    contentLines.forEach((line, index) => {
      const level = getHeaderLevel(line);
      const isSectionDivider = line.trim() === '---'; // 检查是否为章节分隔符
      let parentHeaderIndex: number | undefined;

      // 如果是章节分隔符，增加章节计数
      if (isSectionDivider) {
        sectionCount++;
        newSectionNumbers[index] = sectionCount;
      }

      if (level !== null) {
        // 是标题行
        // 清理比当前级别更深的标题
        headerStack = headerStack.filter((_, i) => i < level - 1);
        headerStack[level - 1] = index;
        
        // 找到父级标题
        if (level > 1) {
          for (let i = level - 2; i >= 0; i--) {
            if (headerStack[i] !== undefined) {
              parentHeaderIndex = headerStack[i];
              break;
            }
          }
        }
      } else {
        // 非标题行，找到最近的标题作为父级
        for (let i = headerStack.length - 1; i >= 0; i--) {
          if (headerStack[i] !== undefined) {
            parentHeaderIndex = headerStack[i];
            break;
          }
        }
      }

      lines.push({
        id: `line-${index}`,
        content: line,
        isEditing: false,
        originalContent: line,
        lineNumber: index,
        level: level || undefined,
        isCollapsed: false,
        isVisible: true, // 先设为true，后续计算
        parentHeaderIndex
      });
    });

    // 第二遍：计算可见性（考虑层级折叠）
    lines.forEach((line, index) => {
      let isVisible = true;
      
      // 向上查找所有祖先标题，如果任何一个被折叠，则该行不可见
      let currentIndex = index;
      while (currentIndex >= 0) {
        const currentLine = lines[currentIndex];
        const currentLevel = getHeaderLevel(currentLine.content);
        
        // 向前查找更高级的标题
        for (let i = currentIndex - 1; i >= 0; i--) {
          const ancestorLine = lines[i];
          const ancestorLevel = getHeaderLevel(ancestorLine.content);
          
          if (ancestorLevel !== null) {
            // 如果找到更高级的标题
            if (currentLevel === null || ancestorLevel < currentLevel) {
              // 检查这个祖先标题是否被折叠
              if (collapsedSections.has(i)) {
                isVisible = false;
                break;
              }
              // 继续向上查找
              currentIndex = i;
              break;
            }
          }
        }
        
        if (!isVisible || currentIndex === 0) break;
        
        // 如果没找到更高级标题，跳出循环
        let foundHigher = false;
        for (let i = currentIndex - 1; i >= 0; i--) {
          const ancestorLevel = getHeaderLevel(lines[i].content);
          const currentLevelValue = getHeaderLevel(lines[currentIndex].content);
          if (ancestorLevel !== null && (currentLevelValue === null || ancestorLevel < currentLevelValue)) {
            foundHigher = true;
            break;
          }
        }
        if (!foundHigher) break;
      }
      
      line.isVisible = isVisible;
    });

    // 更新章节号状态
    setSectionNumbers(newSectionNumbers);
    return lines;
  };

  // 将内容分解为可编辑的行
  useEffect(() => {
    const contentLines = content.split('\n');
    const structuredLines = analyzeDocumentStructure(contentLines);
    setLines(structuredLines);
  }, [content, collapsedSections]);

  // 处理行点击编辑
  const handleLineClick = (lineId: string) => {
    if (readOnly) return;
    
    // 如果当前有正在编辑的行，先自动保存
    if (editingId && editingId !== lineId) {
      handleSaveEdit(editingId);
    }
    
    setLines(prev => prev.map(line => 
      line.id === lineId 
        ? { ...line, isEditing: true }
        : { ...line, isEditing: false }
    ));
    setEditingId(lineId);
  };

  // 删除行
  const handleDeleteLine = (lineId: string) => {
    if (readOnly || editingId) return;
    
    const newLines = lines.filter(line => line.id !== lineId);
    // 重新分配行号
    const updatedLines = newLines.map((line, index) => ({
      ...line,
      lineNumber: index,
      id: `line-${index}`
    }));
    setLines(updatedLines);
    
    // 更新整体内容
    const newContent = updatedLines.map(line => line.content).join('\n');
    onChange(newContent);
  };

  // 转换行类型
  const changeLineType = (lineId: string, newType: string) => {
    const lineIndex = lines.findIndex(line => line.id === lineId);
    if (lineIndex === -1) return;
    
    const currentLine = lines[lineIndex];
    const currentContent = currentLine.content;
    const currentType = detectLineType(currentContent);
    
    if (currentType === newType) return; // 类型相同，无需更改
    
    let newContent = '';
    const typeConfig = lineTypes.find(t => t.value === newType);
    if (!typeConfig) return;
    
    // 提取原始文本内容（去除格式化）
    let rawText = '';
    const trimmed = currentContent.trim();
    
    switch (currentType) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        rawText = trimmed.replace(/^#+\s+/, '');
        break;
      case 'ul':
        rawText = currentContent.replace(/^(\s*)[-*]\s+/, '');
        break;
      case 'ol':
        rawText = currentContent.replace(/^(\s*)\d+\.\s+/, '');
        break;
      case 'bold':
        rawText = trimmed.replace(/^\*\*(.*)\*\*$/, '$1');
        break;
      case 'details':
      case 'details-open':
        const detailsMatch = trimmed.match(/^<details(\s+open)?>(.+?)<\/details>$/);
        rawText = detailsMatch ? detailsMatch[2] : trimmed;
        break;
      case 'separator':
        rawText = '章节分隔';
        break;
      default:
        rawText = trimmed;
    }
    
    // 应用新格式
    switch (newType) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        newContent = typeConfig.prefix + rawText;
        break;
      case 'ul':
        // 保持原有缩进
        const ulIndent = currentContent.match(/^(\s*)/)?.[1] || '';
        newContent = ulIndent + typeConfig.prefix + rawText;
        break;
      case 'ol':
        // 保持原有缩进
        const olIndent = currentContent.match(/^(\s*)/)?.[1] || '';
        newContent = olIndent + typeConfig.prefix + rawText;
        break;
      case 'bold':
        newContent = typeConfig.prefix + rawText + (typeConfig.suffix || '');
        break;
      case 'details':
      case 'details-open':
        newContent = typeConfig.prefix + rawText + (typeConfig.suffix || '');
        break;
      case 'separator':
        newContent = typeConfig.prefix;
        break;
      default:
        newContent = rawText;
    }
    
    // 更新行内容
    const newLines = [...lines];
    newLines[lineIndex] = { ...currentLine, content: newContent, originalContent: newContent };
    setLines(newLines);
    
    // 更新整体内容
    const updatedContent = newLines.map(line => line.content).join('\n');
    onChange(updatedContent);
  };

  // 切换折叠状态
  const toggleCollapse = (lineIndex: number) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineIndex)) {
        newSet.delete(lineIndex);
      } else {
        newSet.add(lineIndex);
      }
      return newSet;
    });
  };


  // 检查标题是否有子内容可以折叠
  const hasCollapsibleContent = (lineIndex: number, currentLevel: number) => {
    for (let i = lineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const lineLevel = getHeaderLevel(line.content);
      
      // 如果遇到同级或更高级标题，停止检查
      if (lineLevel !== null && lineLevel <= currentLevel) {
        break;
      }
      
      // 如果有内容（不管是标题还是普通文本），就可以折叠
      if (line.content.trim()) {
        return true;
      }
    }
    return false;
  };

  // 在指定行后插入新行
  const handleInsertLine = (afterLineId: string) => {
    if (readOnly || editingId) return;
    
    const lineIndex = lines.findIndex(line => line.id === afterLineId);
    const newLines = [...lines];
    const newLineNumber = lineIndex + 1;
    
    // 插入新行
    newLines.splice(newLineNumber, 0, {
      id: `line-${newLineNumber}`,
      content: '',
      isEditing: true,
      originalContent: '',
      lineNumber: newLineNumber,
      isVisible: true
    });
    
    // 重新分配后续行的行号和ID
    const updatedLines = newLines.map((line, index) => ({
      ...line,
      lineNumber: index,
      id: `line-${index}`
    }));
    
    setLines(updatedLines);
    setEditingId(`line-${newLineNumber}`);
  };

  // 处理行内容变化
  const handleLineChange = (lineId: string, newContent: string) => {
    setLines(prev => prev.map(line => 
      line.id === lineId 
        ? { ...line, content: newContent }
        : line
    ));
  };

  // 保存编辑
  const handleSaveEdit = (lineId: string) => {
    const newLines = lines.map(line => 
      line.id === lineId 
        ? { ...line, isEditing: false, originalContent: line.content }
        : line
    );
    setLines(newLines);
    setEditingId(null);
    
    // 更新整体内容
    const newContent = newLines.map(line => line.content).join('\n');
    onChange(newContent);
  };

  // 取消编辑
  const handleCancelEdit = (lineId: string) => {
    setLines(prev => prev.map(line => 
      line.id === lineId 
        ? { ...line, isEditing: false, content: line.originalContent }
        : line
    ));
    setEditingId(null);
  };

  // 自动调整文本框高度
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, lineId: string) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Enter直接保存
      e.preventDefault();
      handleSaveEdit(lineId);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter也保存（保持兼容）
      e.preventDefault();
      handleSaveEdit(lineId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit(lineId);
    }
  };

  // 获取行样式类
  const getLineStyle = (line: EditableLine) => {
    const trimmed = line.content.trim();
    if (trimmed.startsWith('# ')) return 'text-3xl font-bold text-purple-700 mb-6 pb-2 border-b border-purple-200';
    if (trimmed.startsWith('## ')) return 'text-2xl font-semibold text-blue-700 mt-8 mb-4';
    if (trimmed.startsWith('### ')) return 'text-xl font-medium text-gray-700 mt-6 mb-3';
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\s*\d+\.\s+/)) return 'text-gray-700';
    if (trimmed === '---') return 'border-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent';
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) return 'text-purple-700 font-semibold';
    return 'text-gray-600 leading-relaxed my-3';
  };

  // 获取悬停样式
  const getHoverStyle = (line: EditableLine) => {
    const trimmed = line.content.trim();
    if (trimmed.startsWith('# ')) return 'hover:bg-purple-50/50 hover:border hover:border-purple-200 hover:shadow-sm';
    if (trimmed.startsWith('## ')) return 'hover:bg-blue-50/50 hover:border hover:border-blue-200 hover:shadow-sm';
    if (trimmed.startsWith('### ')) return 'hover:bg-gray-50/50 hover:border hover:border-gray-200 hover:shadow-sm';
    return 'hover:bg-gray-50/30 hover:border hover:border-gray-200 hover:shadow-sm';
  };

  // 渲染行操作按钮
  const renderLineActions = (line: EditableLine) => {
    if (readOnly) return null;
    
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
        {/* 插入行按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 bg-green-100 hover:bg-green-200 hover:text-green-600"
          onClick={(e) => {
            e.stopPropagation();
            handleInsertLine(line.id);
          }}
          title="在此行后插入新行"
        >
          <Plus className="w-3 h-3" />
        </Button>
        
        {/* 编辑按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 bg-purple-100 hover:bg-purple-200 hover:text-purple-600"
          onClick={(e) => {
            e.stopPropagation();
            handleLineClick(line.id);
          }}
          title="编辑此行"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        
        {/* 删除按钮 */}
        {lines.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-red-100 hover:bg-red-200 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteLine(line.id);
            }}
            title="删除此行"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  // 渲染编辑控制按钮
  const renderEditControls = (lineId: string, isNewSection = false) => (
    <div className="flex items-center space-x-2 mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-purple-200/50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSaveEdit(lineId)}
        className="h-9 px-4 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 font-medium"
      >
        <Check className="w-3 h-3 mr-1" />
        {isNewSection ? '确认' : '保存'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCancelEdit(lineId)}
        className="h-9 px-4 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
      >
        <X className="w-3 h-3 mr-1" />
        取消
      </Button>
      <div className="text-xs text-gray-500 bg-white/80 px-3 py-2 rounded-md border border-gray-200/50 backdrop-blur-sm">
        <span className="font-mono">Enter</span> {isNewSection ? '确认' : '保存'} • <span className="font-mono">Esc</span> 取消
      </div>
    </div>
  );

  // 渲染单行内容
  const renderLine = (line: EditableLine) => {
    const trimmed = line.content.trim();
    
    // 如果正在编辑这一行
    if (line.isEditing) {
      const currentType = detectLineType(line.content);
      const pureText = extractPureText(line.content);
      const isNewSection = currentType === 'separator';
      
      return (
        <div key={line.id} className="group relative bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border border-purple-200 rounded-xl p-4 mb-3 shadow-sm">
          <div className="flex items-center mb-3">
            <Edit3 className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-700">编辑第 {line.lineNumber + 1} 行</span>
          </div>
          
          {/* 类型选择和文本输入的组合 */}
          <div className="flex items-center space-x-3">
            {/* 类型选择下拉框 */}
            <div className="flex-shrink-0">
              <Select
                value={currentType}
                onValueChange={(newType) => {
                  const newContent = generateContentFromTypeAndText(newType, pureText, line.content);
                  handleLineChange(line.id, newContent);
                }}
              >
                <SelectTrigger className="w-32 h-11 border-purple-300 focus:border-purple-500 bg-white/90 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lineTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 文本输入框或提示信息 */}
            {isNewSection ? (
              <div className="flex-1 h-11 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex items-center">
                <span className="text-amber-700 font-medium">📖 新增一个章节</span>
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                value={pureText}
                onChange={(e) => {
                  const newPureText = e.target.value;
                  const newContent = generateContentFromTypeAndText(currentType, newPureText, line.content);
                  handleLineChange(line.id, newContent);
                  setTimeout(() => {
                    if (textareaRef.current) {
                      adjustTextareaHeight(textareaRef.current);
                    }
                  }, 0);
                }}
                onKeyDown={(e) => handleKeyDown(e, line.id)}
                className="flex-1 h-11 border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 resize-none bg-white/90 backdrop-blur-sm rounded-lg"
                autoFocus
                onFocus={(e) => {
                  adjustTextareaHeight(e.target);
                  // 将光标移动到文字末尾
                  const textArea = e.target;
                  const length = textArea.value.length;
                  textArea.setSelectionRange(length, length);
                }}
                placeholder="输入内容..."
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  // 允许Shift+Enter换行
                  if (target.value.includes('\n')) {
                    adjustTextareaHeight(target);
                  }
                }}
              />
            )}
          </div>
          {renderEditControls(line.id, isNewSection)}
        </div>
      );
    }

    // 空行处理
    if (!trimmed) {
      return (
        <div key={line.id} className="h-4 group relative cursor-pointer" onClick={() => handleLineClick(line.id)}>
          {renderLineActions(line)}
        </div>
      );
    }

    // PPT章节分隔线（不可编辑）
    if (trimmed === '---') {
      const sectionNumber = sectionNumbers[line.lineNumber];
      
      return (
        <div key={line.id} className="group relative rounded-md p-4 -m-2">
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-purple-400"></div>
            {sectionNumber && (
              <div className="mx-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-full shadow-lg">
                第 {sectionNumber} 章
              </div>
            )}
            <div className="flex-1 h-px bg-gradient-to-r from-purple-400 via-purple-300 to-transparent"></div>
          </div>
          {/* 章节分隔符不显示编辑按钮 */}
        </div>
      );
    }

    // 标题处理
    if (trimmed.startsWith('# ')) {
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <h1 className="text-3xl font-bold text-purple-700 mb-6 pb-2 border-b border-purple-200">
            {trimmed.substring(2).trim()}
          </h1>
          {renderLineActions(line)}
        </div>
      );
    }

    if (trimmed.startsWith('## ')) {
      const canCollapse = hasCollapsibleContent(line.lineNumber, 2);
      const isCollapsed = collapsedSections.has(line.lineNumber);
      
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4 flex items-center">
            {canCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(line.lineNumber);
                }}
                className="mr-2 hover:bg-blue-100 rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                title={isCollapsed ? "展开" : "折叠"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                )}
              </button>
            )}
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
            {trimmed.substring(3).trim()}
          </h2>
          {renderLineActions(line)}
        </div>
      );
    }

    // 处理三级到六级标题的折叠
    if (trimmed.startsWith('### ') || trimmed.startsWith('#### ') || trimmed.startsWith('##### ') || trimmed.startsWith('###### ')) {
      let level = 3;
      let headerText = '';
      let headerClass = '';
      
      if (trimmed.startsWith('###### ')) {
        level = 6;
        headerText = trimmed.substring(7).trim();
        headerClass = "text-sm font-normal text-gray-600 mt-3 mb-2 flex items-center";
      } else if (trimmed.startsWith('##### ')) {
        level = 5;
        headerText = trimmed.substring(6).trim();
        headerClass = "text-base font-normal text-gray-600 mt-4 mb-2 flex items-center";
      } else if (trimmed.startsWith('#### ')) {
        level = 4;
        headerText = trimmed.substring(5).trim();
        headerClass = "text-lg font-medium text-gray-600 mt-5 mb-3 flex items-center";
      } else {
        level = 3;
        headerText = trimmed.substring(4).trim();
        headerClass = "text-xl font-medium text-gray-700 mt-6 mb-3 flex items-center";
      }
      
      const canCollapse = hasCollapsibleContent(line.lineNumber, level);
      const isCollapsed = collapsedSections.has(line.lineNumber);
      
      const renderHeader = () => {
        const collapseButton = canCollapse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(line.lineNumber);
            }}
            className="mr-2 hover:bg-gray-100 rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
            title={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        );

        if (level === 3) return <h3 className={headerClass}>{collapseButton}{headerText}</h3>;
        if (level === 4) return <h4 className={headerClass}>{collapseButton}{headerText}</h4>;
        if (level === 5) return <h5 className={headerClass}>{collapseButton}{headerText}</h5>;
        if (level === 6) return <h6 className={headerClass}>{collapseButton}{headerText}</h6>;
        return <h3 className={headerClass}>{collapseButton}{headerText}</h3>;
      };
      
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          {renderHeader()}
          {renderLineActions(line)}
        </div>
      );
    }

    // 有序列表项处理（数字列表）
    const numberedListMatch = line.content.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numberedListMatch) {
      const indentSpaces = numberedListMatch[1];
      const indentLevel = Math.floor(indentSpaces.length / 2); // 每2个空格为一个缩进级别
      const listNumber = numberedListMatch[2];
      const content = numberedListMatch[3];
      
      // 根据缩进级别调整颜色和样式
      const getListStyle = (level: number) => {
        const colors = ['purple', 'blue', 'green', 'orange'];
        const color = colors[level % colors.length];
        return {
          numberColor: `text-${color}-600`,
          textColor: level === 0 ? 'text-gray-700' : 'text-gray-600',
          fontSize: level === 0 ? 'text-base' : 'text-sm'
        };
      };
      
      const style = getListStyle(indentLevel);
      
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-1 -m-1 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <div className="flex items-start" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <span className={cn(style.numberColor, "font-medium mr-2 mt-0.5 flex-shrink-0")}>{listNumber}.</span>
            <span className={cn(style.textColor, style.fontSize)}>{content}</span>
          </div>
          {renderLineActions(line)}
        </div>
      );
    }

    // 无序列表项处理
    const unorderedListMatch = line.content.match(/^(\s*)[-*]\s+(.*)$/);
    if (unorderedListMatch) {
      const indentSpaces = unorderedListMatch[1];
      const indentLevel = Math.floor(indentSpaces.length / 2); // 每2个空格为一个缩进级别
      const content = unorderedListMatch[2];
      
      // 根据缩进级别使用不同的项目符号和颜色
      const getBulletStyle = (level: number) => {
        const styles = [
          { bullet: 'w-1.5 h-1.5 bg-purple-400 rounded-full', color: 'text-gray-700', size: 'text-base' },
          { bullet: 'w-1 h-1 bg-blue-400 rounded-full', color: 'text-gray-600', size: 'text-sm' },
          { bullet: 'w-0.5 h-0.5 bg-green-400 rounded-full', color: 'text-gray-500', size: 'text-sm' },
          { bullet: 'w-1 h-1 bg-orange-400 rounded-sm', color: 'text-gray-500', size: 'text-xs' }
        ];
        return styles[level % styles.length];
      };
      
      const bulletStyle = getBulletStyle(indentLevel);
      
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-1 -m-1 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <div className="flex items-start" style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <div className={cn(bulletStyle.bullet, "mt-2 mr-3 flex-shrink-0")}></div>
            <span className={cn(bulletStyle.color, bulletStyle.size)}>{content}</span>
          </div>
          {renderLineActions(line)}
        </div>
      );
    }

    // Details 标签处理（支持缩进）
    const detailsMatch = line.content.match(/^(\s*)<details(\s+open)?>(.+?)<\/details>$/);
    if (detailsMatch) {
      const indentSpaces = detailsMatch[1];
      const indentLevel = Math.floor(indentSpaces.length / 2); // 每2个空格为一个缩进级别
      const isOpen = !!detailsMatch[2]; // 检查是否有 open 属性
      const content = detailsMatch[3];
      
      // 更灵活的内容解析：支持不同的分隔方式
      let summaryText = content;
      let detailsText = '';
      
      // 方式1: 使用 "details" 作为分隔符
      if (content.includes(' details')) {
        const parts = content.split(' details');
        summaryText = parts[0].trim();
        detailsText = parts.slice(1).join(' details').trim();
      }
      // 方式2: 使用 ":" 作为分隔符
      else if (content.includes(':')) {
        const colonIndex = content.indexOf(':');
        summaryText = content.substring(0, colonIndex).trim();
        detailsText = content.substring(colonIndex + 1).trim();
      }
      
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <div style={{ marginLeft: `${indentLevel * 1.5}rem` }}>
            <details 
              open={isOpen}
              className="border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 hover:shadow-md"
            >
              <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-800 select-none flex items-center transition-colors">
                <span className="mr-2 text-blue-500 transition-transform duration-200 inline-block">
                  {isOpen ? '▼' : '▶'}
                </span>
                {summaryText}
              </summary>
              {detailsText && (
                <div className="mt-3 pl-6 text-gray-600 border-l-2 border-blue-200 bg-white/50 rounded-r-md p-2">
                  {detailsText}
                </div>
              )}
            </details>
          </div>
          {renderLineActions(line)}
        </div>
      );
    }

    // 粗体文本处理
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      return (
        <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
          <strong className="text-purple-700 font-semibold">
            {trimmed.substring(2, trimmed.length - 2)}
          </strong>
          {renderLineActions(line)}
        </div>
      );
    }

    // 普通段落
    return (
      <div key={line.id} className={cn("group relative cursor-pointer rounded-md p-2 -m-2 transition-colors duration-200", getHoverStyle(line))} onClick={() => handleLineClick(line.id)}>
        <p className="text-gray-600 leading-relaxed my-3">
          {trimmed}
        </p>
        {renderLineActions(line)}
      </div>
    );
  };

  // 获取折叠信息提示
  const getCollapsedInfo = (lineIndex: number) => {
    if (!collapsedSections.has(lineIndex)) return null;
    
    let hiddenCount = 0;
    const currentLevel = getHeaderLevel(lines[lineIndex].content);
    if (!currentLevel) return null;
    
    for (let i = lineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const lineLevel = getHeaderLevel(line.content);
      
      if (lineLevel !== null && lineLevel <= currentLevel) {
        break;
      }
      
      if (line.content.trim()) {
        hiddenCount++;
      }
    }
    
    return hiddenCount > 0 ? `${hiddenCount} 行已折叠` : null;
  };

  return (
    <div className={cn("prose prose-purple max-w-none", className)}>
      <div className="space-y-0">
        {lines.filter(line => line.isVisible !== false).map((line) => {
          const collapsedInfo = getCollapsedInfo(line.lineNumber);
          return (
            <div key={line.id} className="relative">
              {renderLine(line)}
              {collapsedInfo && (
                <div className="ml-8 mb-2">
                  <button
                    onClick={() => toggleCollapse(line.lineNumber)}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 text-xs rounded-md border border-gray-200 transition-colors cursor-pointer"
                    title="点击展开"
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {collapsedInfo}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}