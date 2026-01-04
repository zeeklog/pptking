/**
 * 导出服务 - 处理所有导出功能
 */

import { PPTSlide } from '../store/ppt-store';

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // 导出为JSON
  async exportToJSON(slides: PPTSlide[], title: string): Promise<void> {
    const data = {
      title,
      slides,
      exportTime: new Date().toISOString(),
      version: '1.0',
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || '未命名演示文稿'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 导出为PPTX - 使用简单的XML结构生成
  async exportToPPTX(slides: PPTSlide[], title: string): Promise<void> {
    try {
      // 创建一个简化的PPTX结构
      const pptxContent = this.generateSimplePPTX(slides, title);
      
      // 由于真正的PPTX需要复杂的ZIP结构，我们创建一个包含所有内容的XML文件
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 简化的PowerPoint结构，可导入到其他软件 -->
<presentation title="${this.escapeXml(title)}">
  <metadata>
    <title>${this.escapeXml(title)}</title>
    <author>PPT KING</author>
    <created>${new Date().toISOString()}</created>
    <slideCount>${slides.length}</slideCount>
  </metadata>
  <slides>
    ${slides.map((slide, index) => this.generateSlideXML(slide, index)).join('\n')}
  </slides>
</presentation>`;

      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || '未命名演示文稿'}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('已导出为XML格式，您可以导入到PowerPoint或其他支持的软件中');
    } catch (error) {
      console.error('PPTX export failed:', error);
      throw error;
    }
  }

  // 导出为PDF - 使用Canvas API生成
  async exportToPDF(slides: PPTSlide[], title: string): Promise<void> {
    try {
      // 使用浏览器打印功能生成PDF
      const printWindow = window.open('', '_blank', 'width=1920,height=1080');
      if (!printWindow) {
        throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
      }

      const pdfHTML = this.generatePDFHTML(slides, title);
      printWindow.document.write(pdfHTML);
      printWindow.document.close();

      // 等待内容加载完成
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // 给用户足够时间保存PDF
          setTimeout(() => {
            printWindow.close();
          }, 3000);
        }, 1000);
      };
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }

  // 导出为图片 - 使用Canvas生成
  async exportToImages(slides: PPTSlide[], title: string): Promise<void> {
    try {
      // 为每张幻灯片生成图片
      const imageBlobs: { blob: Blob; name: string }[] = [];
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = await this.slideToCanvas(slide, i + 1);
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
        });
        
        imageBlobs.push({
          blob,
          name: `${title || '未命名演示文稿'}_幻灯片${i + 1}.png`
        });
      }
      
      // 如果只有一张幻灯片，直接下载
      if (imageBlobs.length === 1) {
        const url = URL.createObjectURL(imageBlobs[0].blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = imageBlobs[0].name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // 多张幻灯片，生成ZIP包（简化版本）
        alert(`已准备${imageBlobs.length}张图片，将依次下载`);
        
        for (const { blob, name } of imageBlobs) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // 避免浏览器阻止多次下载
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
    } catch (error) {
      console.error('Image export failed:', error);
      throw error;
    }
  }

  // 打印幻灯片 (降级方案)
  async printSlides(slides: PPTSlide[], title: string, options: {
    layout: 'slides' | 'handouts' | 'notes';
    slidesPerPage: number;
    includeNotes: boolean;
  }): Promise<void> {
    try {
      // 使用浏览器原生打印
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('无法打开打印窗口');
      }

      const printHTML = this.generateSimplePrintHTML(slides, title, options);
      printWindow.document.write(printHTML);
      printWindow.document.close();

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

  // 辅助方法
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private generateSlideXML(slide: PPTSlide, index: number): string {
    return `    <slide id="${index + 1}" title="${this.escapeXml(slide.title)}">
      <background type="${slide.background.type}" value="${this.escapeXml(slide.background.value)}" />
      <elements>
        ${slide.elements.map(element => this.generateElementXML(element)).join('\n        ')}
      </elements>
      <notes>${this.escapeXml(slide.notes || '')}</notes>
      <transition type="${slide.transition.type}" duration="${slide.transition.duration}" />
    </slide>`;
  }

  private generateElementXML(element: any): string {
    const base = `<element id="${element.id}" type="${element.type}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rotation="${element.rotation}" opacity="${element.opacity}">`;
    
    let content = '';
    if (element.text) {
      content = `<text fontSize="${element.text.fontSize}" fontFamily="${this.escapeXml(element.text.fontFamily)}" color="${element.text.color}" bold="${element.text.bold}" italic="${element.text.italic}" align="${element.text.align}">${this.escapeXml(element.text.content)}</text>`;
    } else if (element.shape) {
      content = `<shape type="${element.shape.type}" fill="${element.shape.fill}" stroke="${element.shape.stroke}" strokeWidth="${element.shape.strokeWidth}" />`;
    } else if (element.image) {
      content = `<image src="${this.escapeXml(element.image.src)}" alt="${this.escapeXml(element.image.alt || '')}" />`;
    }
    
    return base + content + '</element>';
  }

  private generateSimplePPTX(slides: PPTSlide[], title: string): string {
    // 生成简化的PPTX内容结构
    return slides.map(slide => `Slide: ${slide.title}\nElements: ${slide.elements.length}`).join('\n\n');
  }

  private generatePDFHTML(slides: PPTSlide[], title: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.escapeXml(title)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
            }
            .page { 
              page-break-after: always; 
              width: 297mm; 
              height: 210mm;
              padding: 20mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .slide { 
              width: 257mm;
              height: 144.5mm;
              background: white;
              border: 1px solid #ccc;
              position: relative;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .slide-title {
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              font-size: 28px;
              font-weight: bold;
              color: #333;
              text-align: center;
            }
            .slide-elements {
              position: absolute;
              top: 80px;
              left: 20px;
              right: 20px;
              bottom: 20px;
            }
            .element {
              position: absolute;
              box-sizing: border-box;
            }
            .text-element {
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              word-wrap: break-word;
              overflow: hidden;
            }
            .shape-element {
              border-radius: 4px;
            }
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page { page-break-after: always; margin: 0; width: 100vw; height: 100vh; }
            }
          </style>
        </head>
        <body>
          ${slides.map((slide, index) => `
            <div class="page">
              <div class="slide" style="background-color: ${slide.background.type === 'color' ? slide.background.value : '#FFFFFF'}">
                <div class="slide-title">${this.escapeXml(slide.title)}</div>
                <div class="slide-elements">
                  ${slide.elements.map(element => this.generateElementHTML(element)).join('')}
                </div>
              </div>
              <div style="margin-top: 10mm; text-align: center; font-size: 12px; color: #666;">
                第 ${index + 1} 页，共 ${slides.length} 页
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  private generateElementHTML(element: any): string {
    const style = `left: ${(element.x / 960 * 100)}%; top: ${(element.y / 540 * 100)}%; width: ${(element.width / 960 * 100)}%; height: ${(element.height / 540 * 100)}%; transform: rotate(${element.rotation}deg); opacity: ${element.opacity};`;
    
    if (element.type === 'text' && element.text) {
      return `<div class="element text-element" style="${style} font-size: ${element.text.fontSize * 0.75}px; color: ${element.text.color}; font-weight: ${element.text.bold ? 'bold' : 'normal'}; font-style: ${element.text.italic ? 'italic' : 'normal'}; text-align: ${element.text.align};">${this.escapeXml(element.text.content)}</div>`;
    } else if (element.type === 'shape' && element.shape) {
      return `<div class="element shape-element" style="${style} background-color: ${element.shape.fill}; border: ${element.shape.strokeWidth}px solid ${element.shape.stroke};"></div>`;
    } else if (element.type === 'image' && element.image) {
      return `<div class="element" style="${style}"><img src="${element.image.src}" alt="${this.escapeXml(element.image.alt || '')}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
    }
    
    return '';
  }

  private async slideToCanvas(slide: PPTSlide, slideNumber: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    // 设置画布尺寸 (1920x1080, 16:9)
    canvas.width = 1920;
    canvas.height = 1080;
    
    // 设置背景
    ctx.fillStyle = slide.background.type === 'color' ? slide.background.value : '#FFFFFF';
    ctx.fillRect(0, 0, 1920, 1080);
    
    // 绘制幻灯片标题
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title, 960, 100);
    
    // 绘制元素（简化版本）
    for (const element of slide.elements) {
      const x = (element.x / 960) * 1920;
      const y = (element.y / 540) * 1080;
      const width = (element.width / 960) * 1920;
      const height = (element.height / 540) * 1080;
      
      ctx.save();
      ctx.translate(x + width/2, y + height/2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.globalAlpha = element.opacity;
      
      if (element.type === 'text' && element.text) {
        ctx.fillStyle = element.text.color;
        ctx.font = `${element.text.italic ? 'italic' : 'normal'} ${element.text.bold ? 'bold' : 'normal'} ${element.text.fontSize}px ${element.text.fontFamily}`;
        ctx.textAlign = element.text.align as CanvasTextAlign;
        ctx.fillText(element.text.content, 0, 0);
      } else if (element.type === 'shape' && element.shape) {
        // 检查是否是base64图片填充
        if (element.shape.fill && element.shape.fill.startsWith('data:image/')) {
          // Canvas中处理图片填充需要创建pattern，这里暂时用颜色替代
          // 在实际实现中，应该创建Image对象并使用createPattern
          ctx.fillStyle = '#6366F1'; // 默认颜色
        } else {
          ctx.fillStyle = element.shape.fill || '#6366F1';
        }
        ctx.fillRect(-width/2, -height/2, width, height);
        
        if (element.shape.strokeWidth > 0) {
          ctx.strokeStyle = element.shape.stroke;
          ctx.lineWidth = element.shape.strokeWidth;
          ctx.strokeRect(-width/2, -height/2, width, height);
        }
      }
      
      ctx.restore();
    }
    
    // 添加页码
    ctx.fillStyle = '#666666';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${slideNumber}`, 1880, 1050);
    
    return canvas;
  }

  private generateSimplePrintHTML(slides: PPTSlide[], title: string, options: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印 - ${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .page { page-break-after: always; padding: 20px; }
            .slide { 
              width: 100%; 
              max-width: 800px; 
              aspect-ratio: 16/9; 
              border: 1px solid #ccc; 
              margin: 20px auto;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              color: #333;
            }
            @media print { 
              body { -webkit-print-color-adjust: exact; }
              .page { page-break-after: always; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${slides.map((slide, index) => `
            <div class="page">
              <div class="slide" style="background-color: ${slide.background.value}">
                <div>幻灯片 ${index + 1}: ${slide.title}</div>
              </div>
              ${options.includeNotes && slide.notes ? `
                <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd;">
                  <strong>备注:</strong> ${slide.notes}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }
}

export const exportService = ExportService.getInstance();