/**
 * 打印工具 - 处理PPT打印功能
 */

import { PPTSlide } from '../store/ppt-store';

export class PrintService {
  private static instance: PrintService;

  private constructor() {}

  public static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  async printSlides(slides: PPTSlide[], title: string, options: {
    layout: 'slides' | 'handouts' | 'notes';
    slidesPerPage: number;
    includeNotes: boolean;
  }) {
    try {
      // 创建打印窗口
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('无法打开打印窗口，请检查浏览器设置');
      }

      // 生成打印HTML
      const printHTML = this.generatePrintHTML(slides, title, options);
      
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // 等待内容加载完成后打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

    } catch (error) {
      console.error('打印失败:', error);
      throw error;
    }
  }

  private generatePrintHTML(slides: PPTSlide[], title: string, options: {
    layout: 'slides' | 'handouts' | 'notes';
    slidesPerPage: number;
    includeNotes: boolean;
  }): string {
    const { layout, slidesPerPage, includeNotes } = options;

    let slidesHTML = '';

    if (layout === 'slides') {
      // 每页一张幻灯片
      slidesHTML = slides.map((slide, index) => `
        <div class="slide-page">
          <div class="slide-container">
            <div class="slide-content" style="background-color: ${slide.background.value}">
              ${this.renderSlideElements(slide.elements)}
            </div>
            <div class="slide-number">幻灯片 ${index + 1}</div>
          </div>
          ${includeNotes && slide.notes ? `
            <div class="slide-notes">
              <h4>演讲者备注:</h4>
              <p>${slide.notes}</p>
            </div>
          ` : ''}
        </div>
      `).join('');
    } else if (layout === 'handouts') {
      // 多张幻灯片一页
      const slideGroups = [];
      for (let i = 0; i < slides.length; i += slidesPerPage) {
        slideGroups.push(slides.slice(i, i + slidesPerPage));
      }

      slidesHTML = slideGroups.map(group => `
        <div class="handout-page">
          <div class="handout-grid" style="grid-template-columns: repeat(${Math.min(slidesPerPage, 2)}, 1fr);">
            ${group.map((slide, index) => `
              <div class="handout-slide">
                <div class="handout-slide-content" style="background-color: ${slide.background.value}">
                  ${this.renderSlideElements(slide.elements, 0.5)}
                </div>
                <div class="handout-slide-number">幻灯片 ${slides.indexOf(slide) + 1}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    } else if (layout === 'notes') {
      // 备注页面
      slidesHTML = slides.map((slide, index) => `
        <div class="notes-page">
          <div class="notes-slide">
            <div class="notes-slide-content" style="background-color: ${slide.background.value}">
              ${this.renderSlideElements(slide.elements, 0.6)}
            </div>
            <div class="notes-slide-number">幻灯片 ${index + 1}</div>
          </div>
          <div class="notes-content">
            <h4>演讲者备注:</h4>
            <div class="notes-text">${slide.notes || '无备注'}</div>
          </div>
        </div>
      `).join('');
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印 - ${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; }
            
            /* 幻灯片布局 */
            .slide-page {
              page-break-after: always;
              padding: 20px;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            
            .slide-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            
            .slide-content {
              width: 800px;
              height: 450px;
              border: 1px solid #ccc;
              position: relative;
              background: white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .slide-number {
              margin-top: 10px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            
            .slide-notes {
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              background: #f9f9f9;
            }
            
            .slide-notes h4 {
              margin-bottom: 10px;
              font-size: 14px;
              color: #333;
            }
            
            .slide-notes p {
              font-size: 12px;
              line-height: 1.5;
              color: #666;
            }
            
            /* 讲义布局 */
            .handout-page {
              page-break-after: always;
              padding: 20px;
            }
            
            .handout-grid {
              display: grid;
              gap: 20px;
            }
            
            .handout-slide {
              text-align: center;
            }
            
            .handout-slide-content {
              width: 100%;
              aspect-ratio: 16/9;
              border: 1px solid #ccc;
              position: relative;
              background: white;
            }
            
            .handout-slide-number {
              margin-top: 5px;
              font-size: 12px;
              color: #666;
            }
            
            /* 备注布局 */
            .notes-page {
              page-break-after: always;
              padding: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              min-height: 100vh;
            }
            
            .notes-slide {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .notes-slide-content {
              width: 100%;
              aspect-ratio: 16/9;
              border: 1px solid #ccc;
              position: relative;
              background: white;
            }
            
            .notes-slide-number {
              margin-top: 10px;
              font-size: 12px;
              color: #666;
            }
            
            .notes-content {
              padding: 20px;
              border: 1px solid #ddd;
              background: #f9f9f9;
            }
            
            .notes-content h4 {
              margin-bottom: 15px;
              font-size: 16px;
              color: #333;
            }
            
            .notes-text {
              font-size: 14px;
              line-height: 1.6;
              color: #666;
              white-space: pre-wrap;
            }
            
            /* 元素样式 */
            .element {
              position: absolute;
            }
            
            .element-text {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 5px;
            }
            
            .element-shape {
              border-radius: 4px;
            }
            
            .element-image {
              object-fit: cover;
              border-radius: 4px;
            }
            
            /* 打印专用样式 */
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .slide-page, .handout-page, .notes-page { 
                page-break-after: always; 
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${slidesHTML}
        </body>
      </html>
    `;
  }

  private renderSlideElements(elements: any[], scale: number = 1): string {
    return elements.map(element => {
      const style = `
        left: ${element.x * scale}px;
        top: ${element.y * scale}px;
        width: ${element.width * scale}px;
        height: ${element.height * scale}px;
        transform: rotate(${element.rotation}deg);
        opacity: ${element.opacity};
        z-index: ${element.zIndex};
      `;

      switch (element.type) {
        case 'text':
          return `
            <div class="element element-text" style="${style}
              color: ${element.text?.color || '#000'};
              font-size: ${(element.text?.fontSize || 16) * scale}px;
              font-weight: ${element.text?.bold ? 'bold' : 'normal'};
              font-style: ${element.text?.italic ? 'italic' : 'normal'};
              text-decoration: ${element.text?.underline ? 'underline' : 'none'};
              text-align: ${element.text?.align || 'left'};
            ">
              ${element.text?.content || ''}
            </div>
          `;

        case 'shape':
          const shapeFill = element.shape?.fill;
          const isBase64Image = shapeFill && shapeFill.startsWith('data:image/');
          return `
            <div class="element element-shape" style="${style}
              background-color: ${isBase64Image ? 'transparent' : (shapeFill || '#6366F1')};
              ${isBase64Image ? `background-image: url(${shapeFill}); background-size: cover; background-position: center; background-repeat: no-repeat;` : ''}
              border: ${element.shape?.strokeWidth || 0}px solid ${element.shape?.stroke || 'transparent'};
              border-radius: ${element.shape?.type === 'circle' ? '50%' : '4px'};
            "></div>
          `;

        case 'image':
          return element.image?.src ? `
            <img class="element element-image" 
              src="${element.image.src}" 
              alt="${element.image.alt || ''}"
              style="${style}"
            />
          ` : '';

        case 'group':
          // 递归渲染组合元素中的子元素
          const groupElements = (element as any).elements || element.groupedElements || [];
          return `
            <div class="element element-group" style="${style}">
              ${groupElements.map((childElement: any) => {
                // 计算子元素在组合中的绝对位置
                const childLeft = (childElement.left || childElement.x || 0);
                const childTop = (childElement.top || childElement.y || 0);
                const childStyle = `
                  position: absolute;
                  left: ${childLeft * scale}px;
                  top: ${childTop * scale}px;
                  width: ${childElement.width * scale}px;
                  height: ${childElement.height * scale}px;
                  transform: rotate(${childElement.rotate || childElement.rotation || 0}deg);
                  opacity: ${childElement.opacity || 1};
                `;
                
                // 递归渲染子元素
                return this.renderChildElement(childElement, childStyle, scale);
              }).join('')}
            </div>
          `;

        default:
          return `
            <div class="element" style="${style}
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${12 * scale}px;
              color: #6b7280;
            ">
              ${element.type}
            </div>
          `;
      }
    }).join('');
  }

  // 渲染子元素的helper方法
  private renderChildElement(element: any, style: string, scale: number): string {
    switch (element.type) {
      case 'text':
        return `
          <div class="element element-text" style="${style}
            color: ${element.text?.color || '#000'};
            font-size: ${(element.text?.fontSize || 16) * scale}px;
            font-weight: ${element.text?.bold ? 'bold' : 'normal'};
            font-style: ${element.text?.italic ? 'italic' : 'normal'};
            text-decoration: ${element.text?.underline ? 'underline' : 'none'};
            text-align: ${element.text?.align || 'left'};
          ">
            ${element.content || element.text?.content || ''}
          </div>
        `;

      case 'shape':
        const fill = element.fill?.type === 'color' ? element.fill.value : 
                    element.shape?.fill || element.fill || '#6366F1';
        const isImageFill = fill && fill.startsWith('data:image/');
        return `
          <div class="element element-shape" style="${style}
            background-color: ${isImageFill ? 'transparent' : fill};
            ${isImageFill ? `background-image: url(${fill}); background-size: cover; background-position: center; background-repeat: no-repeat;` : ''}
            border: ${element.borderWidth || element.shape?.strokeWidth || 0}px solid ${element.borderColor || element.shape?.stroke || 'transparent'};
            border-radius: ${element.shapType === 'circle' || element.shape?.type === 'circle' ? '50%' : '4px'};
          ">
            ${element.content ? `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${element.content}</div>` : ''}
          </div>
        `;

      case 'image':
        return element.image?.src ? `
          <img class="element element-image" 
            src="${element.image.src}" 
            alt="${element.image.alt || ''}"
            style="${style}"
          />
        ` : '';

      case 'group':
        // 递归处理嵌套的group
        const groupElements = element.elements || element.groupedElements || [];
        return `
          <div class="element element-group" style="${style}">
            ${groupElements.map((childElement: any) => {
              const childLeft = (childElement.left || childElement.x || 0);
              const childTop = (childElement.top || childElement.y || 0);
              const childStyle = `
                position: absolute;
                left: ${childLeft * scale}px;
                top: ${childTop * scale}px;
                width: ${childElement.width * scale}px;
                height: ${childElement.height * scale}px;
                transform: rotate(${childElement.rotate || childElement.rotation || 0}deg);
                opacity: ${childElement.opacity || 1};
              `;
              return this.renderChildElement(childElement, childStyle, scale);
            }).join('')}
          </div>
        `;

      default:
        return `
          <div class="element" style="${style}
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${12 * scale}px;
            color: #6b7280;
          ">
            ${element.type}
          </div>
        `;
    }
  }
}

export const printService = PrintService.getInstance();