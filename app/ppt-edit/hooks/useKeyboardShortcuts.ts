import { useEffect } from 'react';
import { usePPTStore } from '../store/ppt-store';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    addSlide,
    deleteSlide,
    activeSlideIndex,
    slides,
    activeElementIds,
    duplicateElement,
    deleteElement,
    clearSelection,
    setSelectedTool,
    setCanvasScale,
    canvasScale,
    exportToJSON,
    exportToPPTX,
    updateElement,
    setActiveSlide,
    selectElements,
    copyElements,
    cutElements,
    pasteElements,
    groupElements,
    ungroupElements,
  } = usePPTStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // 基础操作 - 只在有操作可以执行时才阻止默认行为
      if (isCtrl && !isShift && e.key === 'z') {
        if (canUndo()) {
          e.preventDefault();
          undo();
          return;
        }
        // 如果没有可以撤销的操作，不阻止默认行为，让浏览器处理
        return;
      }

      if ((isCtrl && e.key === 'y') || (isCtrl && isShift && e.key === 'z')) {
        if (canRedo()) {
          e.preventDefault();
          redo();
          return;
        }
        // 如果没有可以重做的操作，不阻止默认行为
        return;
      }

      // 幻灯片操作
      if (isCtrl && e.key === 'n') {
        e.preventDefault();
        addSlide();
        return;
      }

      if (e.key === 'Delete' && !isCtrl && !isShift) {
        if (activeElementIds.length > 0) {
          // 删除选中元素
          activeElementIds.forEach(id => deleteElement(id));
        } else {
          // 删除当前幻灯片
          if (slides.length > 1) {
            deleteSlide(activeSlideIndex);
          }
        }
        return;
      }

      // 元素操作
      if (isCtrl && e.key === 'd') {
        if (activeElementIds.length > 0) {
          e.preventDefault();
          activeElementIds.forEach(id => duplicateElement(id));
          return;
        }
        // 如果没有选中元素，不阻止默认行为
        return;
      }

      if (isCtrl && e.key === 'a') {
        e.preventDefault();
        const currentSlide = slides[activeSlideIndex];
        if (currentSlide) {
          const allElementIds = currentSlide.elements.map(el => el.id);
          selectElements(allElementIds);
        }
        return;
      }

      // 复制粘贴操作
      if (isCtrl && e.key === 'c') {
        if (activeElementIds.length > 0) {
          e.preventDefault();
          copyElements(activeElementIds);
          return;
        }
        // 如果没有选中元素，不阻止默认行为
        return;
      }

      if (isCtrl && e.key === 'x') {
        if (activeElementIds.length > 0) {
          e.preventDefault();
          cutElements(activeElementIds);
          return;
        }
        // 如果没有选中元素，不阻止默认行为
        return;
      }

      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        pasteElements();
        return;
      }

      // 组合操作
      if (isCtrl && e.key === 'g') {
        if (activeElementIds.length > 1) {
          e.preventDefault();
          groupElements(activeElementIds);
          return;
        }
        // 如果选中的元素少于2个，不阻止默认行为
        return;
      }

      if (isCtrl && isShift && e.key === 'g') {
        if (activeElementIds.length === 1) {
          const element = slides[activeSlideIndex]?.elements.find(el => el.id === activeElementIds[0]);
          if (element?.isGroup) {
            e.preventDefault();
            ungroupElements(activeElementIds[0]);
            return;
          }
        }
        // 如果不符合取消组合条件，不阻止默认行为
        return;
      }

      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // 工具切换
      if (!isCtrl && !isShift && !isAlt) {
        switch (e.key) {
          case 'v':
          case 'V':
            setSelectedTool('select');
            break;
          case 't':
          case 'T':
            setSelectedTool('text');
            break;
          case 'i':
          case 'I':
            setSelectedTool('image');
            break;
          case 's':
          case 'S':
            setSelectedTool('shape');
            break;
          case 'l':
          case 'L':
            setSelectedTool('line');
            break;
          case 'c':
          case 'C':
            setSelectedTool('chart');
            break;
          case 'm':
          case 'M':
            setSelectedTool('media');
            break;
        }
      }

      // 画布操作
      if (isCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setCanvasScale(Math.min(4, canvasScale + 0.1));
        return;
      }

      if (isCtrl && e.key === '-') {
        e.preventDefault();
        setCanvasScale(Math.max(0.25, canvasScale - 0.1));
        return;
      }

      if (isCtrl && e.key === '0') {
        e.preventDefault();
        setCanvasScale(1);
        return;
      }

      // 导出操作
      if (isCtrl && e.key === 's') {
        e.preventDefault();
        // 默认保存为JSON
        exportToJSON();
        return;
      }

      if (isCtrl && isShift && e.key === 'E') {
        e.preventDefault();
        exportToPPTX();
        return;
      }

      // 演示模式
      if (e.key === 'F5') {
        e.preventDefault();
        // 触发演示模式
        window.dispatchEvent(new CustomEvent('startPresentation'));
        return;
      }

      // 查找替换
      if (isCtrl && e.key === 'h') {
        e.preventDefault();
        // 触发查找替换对话框
        window.dispatchEvent(new CustomEvent('openSearchReplace'));
        return;
      }

      if (isCtrl && e.key === 'f') {
        e.preventDefault();
        // 触发查找对话框（简化版）
        window.dispatchEvent(new CustomEvent('openSearchReplace'));
        return;
      }

      if (isCtrl && e.key === 'p') {
        e.preventDefault();
        // 触发打印对话框
        window.dispatchEvent(new CustomEvent('openPrint'));
        return;
      }

      // 页面切换
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (!isCtrl && activeElementIds.length === 0) {
          e.preventDefault();
          const newIndex = Math.max(0, activeSlideIndex - 1);
          setActiveSlide(newIndex);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (!isCtrl && activeElementIds.length === 0) {
          e.preventDefault();
          const newIndex = Math.min(slides.length - 1, activeSlideIndex + 1);
          setActiveSlide(newIndex);
        }
        return;
      }

      // 元素微调
      if (activeElementIds.length > 0 && !isCtrl) {
        const moveDistance = isShift ? 10 : 1;
        const currentSlide = slides[activeSlideIndex];
        
        if (currentSlide) {
          activeElementIds.forEach(elementId => {
            const element = currentSlide.elements.find(el => el.id === elementId);
            if (!element || element.locked) return;

            let newX = element.x;
            let newY = element.y;

            switch (e.key) {
              case 'ArrowLeft':
                newX = Math.max(0, element.x - moveDistance);
                break;
              case 'ArrowRight':
                newX = Math.min(960 - element.width, element.x + moveDistance);
                break;
              case 'ArrowUp':
                newY = Math.max(0, element.y - moveDistance);
                break;
              case 'ArrowDown':
                newY = Math.min(540 - element.height, element.y + moveDistance);
                break;
            }

            if (newX !== element.x || newY !== element.y) {
              updateElement(elementId, { x: newX, y: newY });
            }
          });
        }
      }
    };

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo, redo, canUndo, canRedo,
    addSlide, deleteSlide, activeSlideIndex, slides,
    activeElementIds, duplicateElement, deleteElement, clearSelection,
    setSelectedTool, setCanvasScale, canvasScale,
    exportToJSON, exportToPPTX, updateElement, setActiveSlide, selectElements,
    copyElements, cutElements, pasteElements, groupElements, ungroupElements
  ]);
}

// 快捷键帮助信息
export const KEYBOARD_SHORTCUTS = [
  {
    category: '基础操作',
    shortcuts: [
      { keys: 'Ctrl+Z', description: '撤销' },
      { keys: 'Ctrl+Y / Ctrl+Shift+Z', description: '重做' },
      { keys: 'Ctrl+S', description: '保存' },
      { keys: 'Ctrl+N', description: '新建幻灯片' },
      { keys: 'Delete', description: '删除选中内容' },
      { keys: 'Escape', description: '取消选择' },
      { keys: 'Ctrl+A', description: '全选' },
      { keys: 'Ctrl+C', description: '复制' },
      { keys: 'Ctrl+X', description: '剪切' },
      { keys: 'Ctrl+V', description: '粘贴' },
      { keys: 'Ctrl+D', description: '复制选中元素' },
      { keys: 'Ctrl+G', description: '组合元素' },
      { keys: 'Ctrl+Shift+G', description: '取消组合' },
      { keys: 'Ctrl+F', description: '查找' },
      { keys: 'Ctrl+H', description: '查找和替换' },
    ],
  },
  {
    category: '工具切换',
    shortcuts: [
      { keys: 'V', description: '选择工具' },
      { keys: 'T', description: '文本工具' },
      { keys: 'I', description: '图片工具' },
      { keys: 'S', description: '形状工具' },
      { keys: 'L', description: '线条工具' },
      { keys: 'C', description: '图表工具' },
      { keys: 'M', description: '媒体工具' },
    ],
  },
  {
    category: '画布操作',
    shortcuts: [
      { keys: 'Ctrl++', description: '放大画布' },
      { keys: 'Ctrl+-', description: '缩小画布' },
      { keys: 'Ctrl+0', description: '重置缩放' },
      { keys: '空格+拖拽', description: '移动画布' },
    ],
  },
  {
    category: '元素操作',
    shortcuts: [
      { keys: '方向键', description: '微调元素位置' },
      { keys: 'Shift+方向键', description: '快速移动元素' },
      { keys: '↑/↓ 或 ←/→', description: '切换幻灯片' },
    ],
  },
  {
    category: '导出操作',
    shortcuts: [
      { keys: 'Ctrl+Shift+E', description: '导出PPTX' },
      { keys: 'Ctrl+Shift+P', description: '导出PDF' },
      { keys: 'Ctrl+Shift+I', description: '导出图片' },
      { keys: 'F5', description: '开始演示' },
    ],
  },
];