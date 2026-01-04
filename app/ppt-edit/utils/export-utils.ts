import { PPTSlide, PPTElement } from '../store/ppt-store';
// 注意：这些库需要在package.json中安装
// import PptxGenJS from 'pptxgenjs';
// import { toPng, toJpeg } from 'html-to-image';
// import { jsPDF } from 'jspdf';
// import { saveAs } from 'file-saver';

// PPTX 导出工具
export class PPTXExporter {
  private pptx: any;
  
  async initialize() {
    if (this.pptx) return;
    
    try {
      // 检查是否在浏览器环境
      if (typeof window === 'undefined') {
        throw new Error('PPTX导出仅在浏览器环境中可用');
      }
      
      // 由于pptxgenjs库可能未安装，抛出错误
      throw new Error('pptxgenjs库未安装，请使用JSON导出');
    } catch (error) {
      console.error('Failed to load pptxgenjs:', error);
      throw new Error('PPTX导出功能不可用');
    }
  }

  async exportSlides(slides: PPTSlide[], title: string) {
    try {
      await this.initialize();

      // 设置演示文稿属性
      this.pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
      this.pptx.layout = 'LAYOUT_16x9';
      this.pptx.title = title;
      this.pptx.subject = 'PPT KING Generated Presentation';
      this.pptx.author = 'PPT KING';

      // 转换每张幻灯片
      for (const slide of slides) {
        const pptSlide = this.pptx.addSlide();
        
        // 设置背景
        if (slide.background.type === 'color') {
          pptSlide.background = { color: slide.background.value };
        } else if (slide.background.type === 'image') {
          // 处理base64图片或URL
          if (slide.background.value.startsWith('data:image/')) {
            // base64图片，需要转换为blob URL或直接使用
            pptSlide.background = { data: slide.background.value };
          } else {
            // 普通URL
            pptSlide.background = { path: slide.background.value };
          }
        } else if (slide.background.type === 'gradient') {
          // 渐变背景处理（如果支持的话）
          pptSlide.background = { fill: slide.background.value };
        }

        // 添加元素
        for (const element of slide.elements) {
          await this.addElementToSlide(pptSlide, element);
        }

        // 添加备注
        if (slide.notes) {
          pptSlide.addNotes(slide.notes);
        }
      }

      // 生成并下载文件
      const fileName = `${title || '未命名演示文稿'}.pptx`;
      await this.pptx.writeFile({ fileName });
    } catch (error) {
      console.error('PPTX export error:', error);
      // 降级方案：提示用户使用JSON导出
      throw new Error('PPTX导出暂时不可用，请使用JSON格式导出');
    }
  }

  private async addElementToSlide(slide: any, element: PPTElement) {
    const options = {
      x: element.x / 96, // 转换为英寸
      y: element.y / 96,
      w: element.width / 96,
      h: element.height / 96,
      rotate: element.rotation,
    };

    switch (element.type) {
      case 'text':
        slide.addText(element.text?.content || '', {
          ...options,
          fontSize: element.text?.fontSize,
          fontFace: element.text?.fontFamily,
          color: element.text?.color,
          bold: element.text?.bold,
          italic: element.text?.italic,
          underline: element.text?.underline,
          align: element.text?.align,
        });
        break;

      case 'image':
        if (element.image?.src) {
          slide.addImage({
            ...options,
            path: element.image.src,
          });
        }
        break;

      case 'shape':
        // 检查是否是base64图片填充
        if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) {
          // PowerPoint导出中，base64图片需要特殊处理，这里暂时用默认颜色
          slide.addShape(this.pptx.shapes.RECTANGLE, {
            ...options,
            fill: { color: '#6366F1' }, // 默认颜色，实际应该处理base64图片
            line: { color: element.shape?.stroke, width: element.shape?.strokeWidth },
          });
        } else {
          slide.addShape(this.pptx.shapes.RECTANGLE, {
            ...options,
            fill: { color: element.shape?.fill },
            line: { color: element.shape?.stroke, width: element.shape?.strokeWidth },
          });
        }
        break;

      case 'chart':
        if (element.chart?.data) {
          slide.addChart(this.pptx.charts[element.chart.type.toUpperCase()], element.chart.data, {
            ...options,
          });
        }
        break;

      case 'table':
        if (element.table?.data) {
          slide.addTable(element.table.data, {
            ...options,
            fontSize: element.table.cellStyle.fontSize,
            color: element.table.cellStyle.color,
            fill: { color: element.table.cellStyle.backgroundColor },
          });
        }
        break;

      case 'group':
        // 递归处理组合元素中的子元素
        const groupElements = (element as any).elements || element.groupedElements || [];
        groupElements.forEach((childElement: any) => {
          // 调整子元素的坐标，相对于父group的位置
          const adjustedChild = {
            ...childElement,
            x: (childElement.left || childElement.x || 0) + element.x,
            y: (childElement.top || childElement.y || 0) + element.y,
          };
          this.addElementToSlide(slide, adjustedChild);
        });
        break;

      default:
        // 其他类型暂时跳过
        break;
    }
  }
}

// 图片导出工具
export class ImageExporter {
  async exportSlideAsImage(
    slideElement: HTMLElement, 
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1
  ): Promise<Blob> {
    try {
      // 由于html-to-image库可能未安装，抛出错误
      throw new Error('html-to-image库未安装');
      const exportFunction = format === 'png' ? toPng : toJpeg;
      
      const dataUrl = await exportFunction(slideElement, {
        quality,
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
      });
      
      const response = await fetch(dataUrl);
      return response.blob();
    } catch (error) {
      console.error('Failed to export image:', error);
      throw new Error('图片导出功能不可用');
    }
  }

    async exportAllSlidesAsImages(
    slides: PPTSlide[], 
    format: 'png' | 'jpeg' = 'png',
    onProgress?: (progress: number) => void
  ): Promise<Blob[]> {
    const images: Blob[] = [];
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // 查找对应的幻灯片DOM元素
      const slideElement = document.getElementById(`slide-${i}`) || 
                         document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
      
      if (slideElement) {
        try {
          const blob = await this.exportSlideAsImage(slideElement, format);
          images.push(blob);
        } catch (error) {
          console.warn(`Failed to export slide ${i + 1} as image:`, error);
          // 创建一个空白图片作为占位符
          const canvas = document.createElement('canvas');
          canvas.width = 1920;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 1920, 1080);
            ctx.fillStyle = '#374151';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`幻灯片 ${i + 1} 导出失败`, 960, 540);
          }
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), `image/${format}`);
          });
          images.push(blob);
        }
      }
      
      onProgress?.(((i + 1) / slides.length) * 100);
    }
    
    return images;
  }
}

// PDF 导出工具
export class PDFExporter {
  async exportSlidesToPDF(slides: PPTSlide[], title: string, onProgress?: (progress: number) => void) {
    try {
      // 动态导入 jsPDF
      // 由于库可能未安装，抛出错误
      throw new Error('PDF导出库未安装');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080], // 16:9 比例
      });

      onProgress?.(0);

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // 查找对应的幻灯片DOM元素
        const slideElement = document.getElementById(`slide-${i}`) || 
                           document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
        
        if (slideElement) {
          try {
            // 将幻灯片转换为图片
            const dataUrl = await toPng(slideElement, {
              width: 1920,
              height: 1080,
              backgroundColor: slide.background.type === 'color' ? slide.background.value : 
                              slide.background.type === 'image' ? '#FFFFFF' : '#FFFFFF',
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
              },
            });

            // 添加到PDF
            if (i > 0) {
              pdf.addPage();
            }
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
          } catch (error) {
            console.warn(`Failed to export slide ${i + 1}:`, error);
            
            // 添加错误页面
            if (i > 0) {
              pdf.addPage();
            }
            pdf.setFontSize(20);
            pdf.text(`幻灯片 ${i + 1} 导出失败`, 100, 100);
          }
        } else {
          // 如果找不到DOM元素，创建一个简单的文本页面
          if (i > 0) {
            pdf.addPage();
          }
          pdf.setFontSize(24);
          pdf.text(slide.title, 100, 100);
          
          // 添加文本元素
          slide.elements.forEach((element, elementIndex) => {
            if (element.type === 'text' && element.text) {
              pdf.setFontSize(element.text.fontSize || 16);
              pdf.text(
                element.text.content, 
                element.x, 
                element.y + 150 + (elementIndex * 30)
              );
            }
          });
        }
        
        onProgress?.(((i + 1) / slides.length) * 100);
      }

      // 保存PDF文件
      pdf.save(`${title || '未命名演示文稿'}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF导出功能不可用');
    }
  }
}

// JSON 导出工具
export class JSONExporter {
  async exportToJSON(data: any, fileName: string) {
    try {
      // 使用原生下载，不依赖file-saver库
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON导出失败:', error);
      throw error;
    }
  }

  async importFromJSON(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

// 导入工具
export class ImportUtils {
  async importPPTX(file: File): Promise<PPTSlide[]> {
    // PPTX导入功能 - 需要pptx2json-ts库
    // 使用 pptx2json-ts 库解析PPTX文件
    console.log('Import PPTX:', file.name);
    return [];
  }

  async importImages(files: FileList): Promise<string[]> {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        urls.push(url);
      }
    }
    
    return urls;
  }
}

// 导出管理器
export class ExportManager {
  private pptxExporter = new PPTXExporter();
  private imageExporter = new ImageExporter();
  private pdfExporter = new PDFExporter();
  private jsonExporter = new JSONExporter();

  async exportToPPTX(slides: PPTSlide[], title: string, onProgress?: (progress: number) => void) {
    onProgress?.(0);
    await this.pptxExporter.exportSlides(slides, title);
    onProgress?.(100);
  }

  async exportToImages(
    slides: PPTSlide[], 
    format: 'png' | 'jpeg' = 'png',
    onProgress?: (progress: number) => void
  ) {
    return this.imageExporter.exportAllSlidesAsImages(slides, format, onProgress);
  }

  async exportToPDF(slides: PPTSlide[], title: string, onProgress?: (progress: number) => void) {
    await this.pdfExporter.exportSlidesToPDF(slides, title, onProgress);
  }

  exportToJSON(data: any, fileName: string) {
    this.jsonExporter.exportToJSON(data, fileName);
  }
}

// 单例导出管理器
export const exportManager = new ExportManager();