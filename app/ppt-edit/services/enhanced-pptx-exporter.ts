/**
 * 增强版PPTX导出器
 * 基于PptxGenJS，完全支持项目数据结构的所有元素类型
 */

import PptxGenJS from 'pptxgenjs';
import { PPTSlide, PPTElement } from '../store/ppt-store';
import { getShapePath } from '../../../lib/pptxtojson/src/shapePath.js';

export interface ExportOptions {
  theme?: any;
  includeAnimations?: boolean;
  includeNotes?: boolean;
  quality?: 'low' | 'medium' | 'high';
  format?: '16:9' | '4:3' | 'custom';
}

export interface ExportProgress {
  total: number;
  completed: number;
  currentStep: string;
  percentage: number;
}

export class EnhancedPptxExporter {
  private pptx: PptxGenJS;
  private resourceManager: any;
  private progressCallback?: (progress: ExportProgress) => void;
  private totalSteps = 0;
  private completedSteps = 0;

  constructor() {
    this.pptx = new PptxGenJS();
    this.setupPresentationDefaults();
  }

  setProgressCallback(callback: (progress: ExportProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(step: string) {
    this.completedSteps++;
    if (this.progressCallback) {
      this.progressCallback({
        total: this.totalSteps,
        completed: this.completedSteps,
        currentStep: step,
        percentage: Math.round((this.completedSteps / this.totalSteps) * 100)
      });
    }
  }

  private setupPresentationDefaults() {
    this.pptx.layout = 'LAYOUT_16x9';
    this.pptx.rtlMode = false;
    this.pptx.subject = 'PPT Visionary AI Generated Presentation';
    this.pptx.company = 'PPT Visionary AI';
    this.pptx.author = 'PPT Visionary AI';
    this.pptx.revision = '1';
  }

  async exportToPPTX(slides: PPTSlide[], title: string, options: ExportOptions = {}): Promise<void> {
    try {
      // 计算总步骤数
      this.totalSteps = slides.length * 2 + slides.reduce((acc, slide) => acc + slide.elements.length, 0) + 3;
      this.completedSteps = 0;

      this.updateProgress('初始化导出器');
      
      this.pptx.title = title;
      this.resourceManager = await this.getResourceManager();
      
      this.updateProgress('设置演示文稿主题');
      
      // 添加主题和样式
      if (options.theme) {
        await this.setupTheme(options.theme);
      }
      
      this.updateProgress('开始转换幻灯片');
      
      // 转换所有幻灯片
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const pptxSlide = this.pptx.addSlide();
        await this.convertSlide(slide, pptxSlide, i, options);
        this.updateProgress(`完成幻灯片 ${i + 1}/${slides.length}`);
      }
      
      this.updateProgress('生成PPTX文件');
      
      // 导出文件
      await this.pptx.writeFile({ 
        fileName: `${title}.pptx`,
        compression: options.quality === 'high' ? 'SLOW' : 'FAST'
      });
      
      this.updateProgress('导出完成');
      
    } catch (error) {
      console.error('PPTX导出失败:', error);
      throw new Error(`PPTX导出失败: ${error.message}`);
    }
  }

  private async getResourceManager() {
    try {
      if (typeof window !== 'undefined') {
        const { resourceManager } = await import('../store/resource-manager');
        return resourceManager;
      }
    } catch (error) {
      console.warn('资源管理器加载失败:', error);
    }
    return null;
  }

  private async convertSlide(slide: PPTSlide, pptxSlide: any, slideIndex: number, options: ExportOptions) {
    // 1. 设置幻灯片背景
    await this.setSlideBackground(slide.background, pptxSlide);
    
    // 2. 设置幻灯片切换动画
    if (options.includeAnimations !== false) {
      this.setSlideTransition(slide.transition, pptxSlide);
    }
    
    // 3. 添加演讲者备注
    if (options.includeNotes !== false && slide.notes) {
      pptxSlide.addNotes(slide.notes);
    }
    
    // 4. 按zIndex排序并转换元素
    const sortedElements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const element of sortedElements) {
      try {
        await this.convertElement(element, pptxSlide, slideIndex, options);
      } catch (error) {
        console.warn(`元素转换失败 ${element.id}:`, error);
        // 继续处理其他元素，不中断整个导出过程
      }
    }
  }

  private async convertElement(element: PPTElement, pptxSlide: any, slideIndex: number, options: ExportOptions) {
    if (element.hidden) return; // 跳过隐藏元素

    const baseOptions = {
      x: this.convertCoordinate(element.x),
      y: this.convertCoordinate(element.y),
      w: this.convertCoordinate(element.width),
      h: this.convertCoordinate(element.height),
      rotate: element.rotation,
      transparency: Math.round((1 - element.opacity) * 100)
    };
    
    switch (element.type) {
      case 'text':
        await this.addTextElement(element, pptxSlide, baseOptions);
        break;
        
      case 'image':
        await this.addImageElement(element, pptxSlide, baseOptions);
        break;
        
      case 'shape':
        await this.addShapeElement(element, pptxSlide, baseOptions);
        break;
        
      case 'line':
        await this.addLineElement(element, pptxSlide, baseOptions);
        break;
        
      case 'chart':
        await this.addChartElement(element, pptxSlide, baseOptions);
        break;
        
      case 'table':
        await this.addTableElement(element, pptxSlide, baseOptions);
        break;
        
      case 'video':
        await this.addVideoElement(element, pptxSlide, baseOptions);
        break;
        
      case 'audio':
        await this.addAudioElement(element, pptxSlide, baseOptions);
        break;
        
      case 'latex':
        await this.addLatexElement(element, pptxSlide, baseOptions);
        break;
        
      case 'group':
        await this.addGroupElement(element, pptxSlide, baseOptions, slideIndex, options);
        break;
        
      default:
        console.warn(`不支持的元素类型: ${element.type}`);
    }
  }

  // 文本元素转换
  private async addTextElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.text) return;
    
    const textOptions = {
      ...baseOptions,
      text: element.text.content,
      options: {
        fontSize: element.text.fontSize,
        fontFace: element.text.fontFamily,
        color: element.text.color.replace('#', ''),
        bold: element.text.bold,
        italic: element.text.italic,
        underline: element.text.underline ? { style: 'single' } : undefined,
        strike: element.text.strikethrough ? 'sngStrike' : undefined,
        align: this.convertTextAlign(element.text.align),
        valign: this.convertVerticalAlign(element.text.verticalAlign),
        lineSpacing: Math.round(element.text.lineHeight * 100),
        charSpacing: element.text.letterSpacing * 100,
        margin: [0.1, 0.1, 0.1, 0.1]
      }
    };
    
    pptxSlide.addText(textOptions.text, textOptions);
  }

  // 形状元素转换（支持202种形状类型）
  private async addShapeElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.shape) return;
    
    let shapeOptions: any = {
      ...baseOptions,
      fill: { color: element.shape.fill.replace('#', '') },
      line: {
        color: element.shape.stroke.replace('#', ''),
        width: element.shape.strokeWidth,
        dashType: 'solid'
      }
    };

    // 处理基础形状类型
    if (element.shape.type !== 'custom') {
      shapeOptions.shape = this.convertBasicShapeType(element.shape.type);
    } else {
      // 处理复杂形状类型
      const pptxShapeType = this.convertComplexShapeType(element.shape.shapType);
      if (pptxShapeType) {
        shapeOptions.shape = pptxShapeType;
      } else {
        // 使用自定义路径
        shapeOptions = await this.createCustomPathShape(element, baseOptions);
      }
    }
    
    // 处理渐变填充
    if (element.shape.gradient) {
      shapeOptions.fill = this.convertGradient(element.shape.gradient);
    }
    
    // 处理阴影效果
    if (element.shape.shadow) {
      shapeOptions.shadow = this.convertShadow(element.shape.shadow);
    }
    
    // 处理形状内文本
    if (element.shape.text) {
      shapeOptions.text = element.shape.text.content;
      shapeOptions.options = {
        fontSize: element.shape.text.fontSize,
        fontFace: element.shape.text.fontFamily,
        color: element.shape.text.color.replace('#', ''),
        bold: element.shape.text.bold,
        italic: element.shape.text.italic,
        align: this.convertTextAlign(element.shape.text.align),
        valign: this.convertVerticalAlign(element.shape.text.verticalAlign)
      };
    }
    
    pptxSlide.addShape(shapeOptions);
  }

  // 图片元素转换
  private async addImageElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.image) return;
    
    try {
      // 处理图片资源
      const imageData = await this.processImageResource(element.image.src);
      
      const imageOptions = {
        ...baseOptions,
        path: imageData.data,
        rounding: element.image.borderRadius || 0
      };
      
      // 处理图片滤镜效果
      if (element.image.filters) {
        imageOptions.transparency = Math.round((100 - element.image.filters.brightness) / 100 * 100);
      }
      
      pptxSlide.addImage(imageOptions);
      
    } catch (error) {
      console.warn('图片添加失败，跳过:', error);
    }
  }

  // 线条元素转换
  private async addLineElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.line) return;
    
    const lineOptions = {
      ...baseOptions,
      line: {
        color: element.line.stroke.replace('#', ''),
        width: element.line.strokeWidth,
        dashType: element.line.strokeDasharray ? 'dash' : 'solid',
        beginArrowType: this.convertMarkerType(element.line.startMarker),
        endArrowType: this.convertMarkerType(element.line.endMarker)
      }
    };
    
    if (element.line.type === 'curve' && element.line.points.length > 2) {
      // 创建曲线路径
      const pathData = this.createCurvePath(element.line.points);
      lineOptions.path = pathData;
    }
    
    pptxSlide.addShape({ 
      shape: 'line',
      ...lineOptions 
    });
  }

  // 图表元素转换
  private async addChartElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.chart) return;
    
    const chartData = this.convertChartData(element.chart.data, element.chart.type);
    const chartOptions = {
      ...baseOptions,
      type: this.convertChartType(element.chart.type),
      data: chartData,
      options: {
        title: element.chart.options?.title || '',
        titleColor: element.chart.options?.titleColor?.replace('#', '') || '000000',
        showLegend: element.chart.options?.showLegend !== false,
        showDataTable: false,
        showValue: element.chart.options?.showLabels !== false,
        border: { pt: 1, color: 'D1D5DB' },
        fill: { color: element.chart.options?.backgroundColor?.replace('#', '') || 'FFFFFF' }
      }
    };
    
    pptxSlide.addChart(chartOptions);
  }

  // 表格元素转换
  private async addTableElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.table) return;
    
    // 准备表格数据
    const tableRows = element.table.data.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        const isHeader = rowIndex === 0;
        const cellStyle = isHeader ? element.table.headerStyle : element.table.cellStyle;
        
        return {
          text: String(cell),
          options: {
            fontSize: cellStyle?.fontSize || element.table.cellStyle.fontSize,
            fontFace: 'Arial',
            color: cellStyle?.color?.replace('#', '') || element.table.cellStyle.color.replace('#', ''),
            align: cellStyle?.align || element.table.cellStyle.align,
            bold: cellStyle?.bold ?? element.table.cellStyle.bold,
            fill: { 
              color: cellStyle?.backgroundColor?.replace('#', '') || 
                     element.table.cellStyle.backgroundColor.replace('#', '') 
            },
            border: [
              { pt: element.table.borderStyle.width, color: element.table.borderStyle.color.replace('#', '') },
              { pt: element.table.borderStyle.width, color: element.table.borderStyle.color.replace('#', '') },
              { pt: element.table.borderStyle.width, color: element.table.borderStyle.color.replace('#', '') },
              { pt: element.table.borderStyle.width, color: element.table.borderStyle.color.replace('#', '') }
            ]
          }
        };
      });
    });
    
    const tableOptions = {
      ...baseOptions,
      rows: tableRows,
      options: {
        rowH: element.table.rowHeights?.map(h => this.convertCoordinate(h)),
        colW: element.table.colWidths?.map(w => this.convertCoordinate(w))
      }
    };
    
    pptxSlide.addTable(tableOptions);
  }

  // 视频元素转换
  private async addVideoElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.video) return;
    
    try {
      const videoSrc = await this.processVideoResource(element.video.src);
      
      const videoOptions = {
        ...baseOptions,
        path: videoSrc,
        type: 'video/mp4'
      };
      
      // 添加视频封面
      if (element.video.poster) {
        const posterSrc = await this.processImageResource(element.video.poster);
        videoOptions.cover = posterSrc;
      }
      
      pptxSlide.addMedia(videoOptions);
      
    } catch (error) {
      console.warn('视频添加失败，添加占位符:', error);
      // 添加视频占位符
      pptxSlide.addShape({
        ...baseOptions,
        shape: 'rect',
        fill: { color: 'F3F4F6' },
        line: { color: '9CA3AF', width: 1, dashType: 'dash' }
      });
      pptxSlide.addText('视频播放器', {
        ...baseOptions,
        options: { align: 'center', valign: 'middle', color: '6B7280' }
      });
    }
  }

  // 音频元素转换
  private async addAudioElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.audio) return;
    
    try {
      const audioSrc = await this.processAudioResource(element.audio.src);
      
      const audioOptions = {
        ...baseOptions,
        path: audioSrc,
        type: 'audio/mp3'
      };
      
      pptxSlide.addMedia(audioOptions);
      
    } catch (error) {
      console.warn('音频添加失败，添加占位符:', error);
      // 添加音频占位符
      pptxSlide.addShape({
        ...baseOptions,
        shape: 'rect',
        fill: { color: 'FEF3C7' },
        line: { color: 'F59E0B', width: 1 }
      });
      pptxSlide.addText('🔊 音频', {
        ...baseOptions,
        options: { align: 'center', valign: 'middle', color: 'D97706' }
      });
    }
  }

  // LaTeX元素转换
  private async addLatexElement(element: PPTElement, pptxSlide: any, baseOptions: any) {
    if (!element.latex) return;
    
    try {
      // 将LaTeX转换为图片（使用MathJax或KaTeX）
      const latexImage = await this.renderLatexToImage(element.latex.formula, {
        color: element.latex.color,
        size: element.latex.size
      });
      
      pptxSlide.addImage({
        ...baseOptions,
        data: latexImage
      });
      
    } catch (error) {
      console.warn('LaTeX渲染失败，使用文本替代:', error);
      // 降级为普通文本
      pptxSlide.addText(element.latex.formula, {
        ...baseOptions,
        options: {
          fontSize: element.latex.size,
          color: element.latex.color.replace('#', ''),
          fontFace: 'Courier New',
          align: 'center',
          valign: 'middle'
        }
      });
    }
  }

  // 组合元素转换
  private async addGroupElement(element: PPTElement, pptxSlide: any, baseOptions: any, slideIndex: number, options: ExportOptions) {
    if (!element.groupedElements) return;
    
    // PptxGenJS不直接支持组合，将组合元素逐个添加
    for (const groupedElement of element.groupedElements) {
      const adjustedElement = {
        ...groupedElement,
        x: element.x + groupedElement.x,
        y: element.y + groupedElement.y,
        rotation: element.rotation + groupedElement.rotation,
        opacity: element.opacity * groupedElement.opacity
      };
      await this.convertElement(adjustedElement, pptxSlide, slideIndex, options);
    }
  }

  // 背景设置
  private async setSlideBackground(background: any, pptxSlide: any) {
    switch (background.type) {
      case 'color':
        pptxSlide.background = { color: background.value.replace('#', '') };
        break;
        
      case 'image':
        try {
          const imageSrc = await this.processImageResource(background.image || background.value);
          pptxSlide.background = { 
            path: imageSrc,
            transparency: background.opacity ? Math.round((1 - background.opacity) * 100) : 0
          };
        } catch (error) {
          console.warn('背景图片处理失败，使用颜色背景:', error);
          pptxSlide.background = { color: 'FFFFFF' };
        }
        break;
        
      case 'gradient':
        if (background.gradient) {
          pptxSlide.background = this.convertGradient(background.gradient);
        } else {
          pptxSlide.background = { color: background.value.replace('#', '') };
        }
        break;
        
      default:
        pptxSlide.background = { color: 'FFFFFF' };
    }
  }

  // 切换动画设置
  private setSlideTransition(transition: any, pptxSlide: any) {
    const transitionMap = {
      'none': 'none',
      'fade': 'fade',
      'slide': 'push',
      'zoom': 'zoom',
      'rotate3d': 'flip',
      'cube': 'cube',
      'flip': 'flip',
      'push': 'push',
      'reveal': 'uncover',
      'wipe': 'wipe'
    };
    
    pptxSlide.transition = {
      type: transitionMap[transition.type] || 'fade',
      duration: Math.round(transition.duration / 100) // 转换为秒
    };
  }

  // 辅助转换方法
  private convertBasicShapeType(type: string): string {
    const mapping = {
      'rectangle': 'rect',
      'circle': 'ellipse',
      'triangle': 'triangle',
      'diamond': 'diamond',
      'star': 'star5'
    };
    return mapping[type] || 'rect';
  }

  private convertComplexShapeType(shapType: string): string | null {
    const complexMapping = {
      'parallelogram': 'parallelogram',
      'upArrow': 'upArrow',
      'downArrow': 'downArrow',
      'leftArrow': 'leftArrow',
      'rightArrow': 'rightArrow',
      'leftRightArrow': 'leftRightArrow',
      'upDownArrow': 'upDownArrow',
      'quadArrow': 'quadArrow',
      'pentagon': 'pentagon',
      'hexagon': 'hexagon',
      'octagon': 'octagon',
      'heart': 'heart',
      'lightningBolt': 'lightningBolt',
      'cloud': 'cloud',
      'sun': 'sun',
      'moon': 'moon',
      'star4': 'star4',
      'star6': 'star6',
      'star8': 'star8',
      'gear6': 'gear6',
      'flowChartProcess': 'flowChartProcess',
      'flowChartDecision': 'flowChartDecision',
      'flowChartTerminator': 'flowChartTerminator',
      'flowChartInputOutput': 'flowChartInputOutput'
    };
    return complexMapping[shapType] || null;
  }

  private async createCustomPathShape(element: PPTElement, baseOptions: any) {
    if (!element.shape) return baseOptions;
    
    try {
      // 使用shapePath.js生成路径
      let pathData = element.shape.path;
      if (!pathData && element.shape.shapType) {
        pathData = getShapePath(
          element.shape.shapType,
          element.width,
          element.height,
          {}
        );
      }
      
      if (pathData) {
        return {
          ...baseOptions,
          shape: 'custGeom',
          path: this.convertSVGPathToPptx(pathData),
          fill: { color: element.shape.fill.replace('#', '') },
          line: {
            color: element.shape.stroke.replace('#', ''),
            width: element.shape.strokeWidth
          }
        };
      }
    } catch (error) {
      console.warn('自定义路径创建失败:', error);
    }
    
    // 降级为矩形
    return {
      ...baseOptions,
      shape: 'rect',
      fill: { color: element.shape.fill.replace('#', '') },
      line: {
        color: element.shape.stroke.replace('#', ''),
        width: element.shape.strokeWidth
      }
    };
  }

  private convertGradient(gradient: any) {
    const colors = gradient.colors.map((c: any) => ({
      position: parseInt(c.pos.replace('%', '')),
      color: c.color.replace('#', '')
    }));
    
    return {
      type: gradient.type === 'radial' ? 'radial' : 'linear',
      colors: colors,
      angle: gradient.angle || 0
    };
  }

  private convertShadow(shadow: any) {
    return {
      type: 'outer',
      color: shadow.color.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).join(''),
      opacity: shadow.color.includes('rgba') ? 
        parseFloat(shadow.color.split(',')[3]?.replace(')', '') || '1') * 100 : 100,
      blur: shadow.blur,
      offset: Math.sqrt(shadow.h * shadow.h + shadow.v * shadow.v),
      angle: Math.atan2(shadow.v, shadow.h) * 180 / Math.PI
    };
  }

  private convertTextAlign(align: string): string {
    const mapping = {
      'left': 'left',
      'center': 'center',
      'right': 'right',
      'justify': 'justify'
    };
    return mapping[align] || 'left';
  }

  private convertVerticalAlign(valign: string): string {
    const mapping = {
      'top': 'top',
      'middle': 'middle',
      'bottom': 'bottom'
    };
    return mapping[valign] || 'middle';
  }

  private convertChartType(type: string): string {
    const mapping = {
      'bar': 'bar',
      'line': 'line',
      'pie': 'pie',
      'area': 'area',
      'scatter': 'scatter',
      'radar': 'radar'
    };
    return mapping[type] || 'bar';
  }

  private convertChartData(data: any[], chartType: string) {
    switch (chartType) {
      case 'pie':
        return data.map(item => ({
          name: item.label,
          value: item.value,
          color: item.color?.replace('#', '')
        }));
        
      case 'bar':
      case 'line':
      case 'area':
        return [
          {
            name: 'Series 1',
            labels: data.map(item => item.label),
            values: data.map(item => item.value),
            colors: data.map(item => item.color?.replace('#', ''))
          }
        ];
        
      default:
        return data;
    }
  }

  private convertMarkerType(marker: string): string {
    const mapping = {
      'none': 'none',
      'arrow': 'triangle',
      'circle': 'oval'
    };
    return mapping[marker] || 'none';
  }

  private createCurvePath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      if (i === 1) {
        path += ` Q ${points[i].x} ${points[i].y}`;
      } else {
        path += ` ${points[i].x} ${points[i].y}`;
      }
    }
    
    return path;
  }

  private convertSVGPathToPptx(svgPath: string): string {
    // 简化的SVG到PPTX路径转换
    // 在实际实现中需要更复杂的解析
    return svgPath
      .replace(/M\s*([^L]+)/g, '<a:moveTo><a:pt x="$1"/></a:moveTo>')
      .replace(/L\s*([^LMZ]+)/g, '<a:lnTo><a:pt x="$1"/></a:lnTo>')
      .replace(/Z/g, '<a:close/>');
  }

  private convertCoordinate(value: number): number {
    // 将像素转换为英寸 (96 DPI标准)
    return value / 96;
  }

  private async processImageResource(resourceId: string): Promise<string> {
    try {
      if (resourceId.startsWith('resource_') && this.resourceManager) {
        const resource = await this.resourceManager.getResource(resourceId);
        return resource?.data || resourceId;
      }
      return resourceId;
    } catch (error) {
      console.warn('图片资源处理失败:', error);
      return resourceId;
    }
  }

  private async processVideoResource(resourceId: string): Promise<string> {
    return this.processImageResource(resourceId); // 使用相同的资源处理逻辑
  }

  private async processAudioResource(resourceId: string): Promise<string> {
    return this.processImageResource(resourceId); // 使用相同的资源处理逻辑
  }

  private async renderLatexToImage(formula: string, options: { color: string; size: number }): Promise<string> {
    // 这里需要集成LaTeX渲染库（如KaTeX）
    // 返回渲染后的图片base64数据
    return new Promise((resolve, reject) => {
      try {
        // 创建临时canvas渲染LaTeX
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context creation failed');
        }
        
        canvas.width = 400;
        canvas.height = 100;
        
        // 简化实现：直接绘制文本（实际应使用KaTeX渲染）
        ctx.fillStyle = options.color;
        ctx.font = `${options.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formula, 200, 50);
        
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  }

  private async setupTheme(theme: any) {
    if (!theme) return;
    
    // 设置演示文稿主题
    this.pptx.theme = {
      headFontFace: theme.fonts?.heading || 'Arial',
      bodyFontFace: theme.fonts?.body || 'Arial'
    };
    
    // 设置默认颜色方案
    if (theme.colors) {
      this.pptx.colorScheme = [
        theme.colors.primary?.replace('#', '') || '4F46E5',
        theme.colors.secondary?.replace('#', '') || '7C3AED',
        theme.colors.accent?.replace('#', '') || 'EC4899',
        theme.colors.background?.replace('#', '') || 'FFFFFF',
        theme.colors.text?.replace('#', '') || '1F2937'
      ];
    }
  }
}

// 导出服务单例
export const enhancedPptxExporter = new EnhancedPptxExporter();
```






