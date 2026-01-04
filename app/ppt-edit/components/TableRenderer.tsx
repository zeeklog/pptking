'use client';

import { useState } from 'react';
import { PPTElement } from '../store/ppt-store';
import { cn } from '@/lib/utils';

interface TableRendererProps {
  element: PPTElement;
  canvasScale: number;
  isEditing?: boolean;
  onCellEdit?: (row: number, col: number, value: string) => void;
}

interface CellData {
  content: string;
  styles?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    align?: string;
  };
  merged?: {
    colSpan?: number;
    rowSpan?: number;
    hMerge?: number;
    vMerge?: number;
    borders?: any;
  };
  _original?: any;
}

export function TableRenderer({ element, canvasScale, isEditing, onCellEdit }: TableRendererProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  if (!element.table) {
    return (
      <div className="w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
        <div className="text-center text-blue-600 dark:text-blue-400">
          <div className="text-lg">📋</div>
          <div className="text-xs">双击编辑表格</div>
        </div>
      </div>
    );
  }

  const { rows, cols, data, cellStyle, borderStyle, rowHeights = [], colWidths = [] } = element.table;

  // 处理复杂表格数据
  const processTableData = (): CellData[][] => {
    if (!data || !Array.isArray(data)) {
      // 如果没有数据或数据格式不正确，创建默认数据
      return Array(rows).fill(null).map(() =>
        Array(cols).fill(null).map(() => ({
          content: '',
          styles: cellStyle,
        }))
      );
    }

    return data.map((row: any, rowIndex: number) => {
      if (!Array.isArray(row)) return [];
      
      return row.map((cell: any, colIndex: number) => {
        // 如果已经是处理过的格式
        if (cell && typeof cell === 'object' && cell.content !== undefined) {
          return cell as CellData;
        }
        
        // 如果是简单字符串
        if (typeof cell === 'string') {
          return {
            content: cell,
            styles: cellStyle,
          };
        }
        
        // 如果是复杂对象，需要解析
        if (typeof cell === 'object' && cell !== null) {
          // 如果已经是解析过的格式（有content属性），直接使用
          if (cell.content !== undefined) {
            return {
              content: cell.content,
              styles: {
                ...cellStyle,
                ...cell.styles,
              },
              merged: cell.merged,
              _original: cell._original || cell,
            };
          }
          
          // 解析HTML内容和样式
          let content = '';
          let extractedStyles: any = {};
          
          if (cell.text && typeof cell.text === 'string') {
            // 解析HTML内容并提取样式
            const htmlText = cell.text;
            
            // 提取纯文本内容
            if (typeof window !== 'undefined') {
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                content = doc.body.textContent || doc.body.innerText || '';
                
                // 尝试提取样式信息
                const spanElements = doc.querySelectorAll('span');
                if (spanElements.length > 0) {
                  const firstSpan = spanElements[0];
                  const style = firstSpan.getAttribute('style') || '';
                  
                  // 解析style属性
                  const styleMatch = {
                    fontSize: style.match(/font-size:\s*(\d+)pt/),
                    fontFamily: style.match(/font-family:\s*([^;]+)/),
                    color: style.match(/color:\s*([^;]+)/),
                    fontWeight: style.match(/font-weight:\s*([^;]+)/)
                  };
                  
                  extractedStyles = {
                    fontSize: styleMatch.fontSize ? parseFloat(styleMatch.fontSize[1]) : undefined,
                    fontFamily: styleMatch.fontFamily ? styleMatch.fontFamily[1].trim() : undefined,
                    color: styleMatch.color ? styleMatch.color[1].trim() : undefined,
                    bold: styleMatch.fontWeight ? styleMatch.fontWeight[1].includes('bold') : false
                  };
                }
                
                // 检查段落对齐方式
                const pElements = doc.querySelectorAll('p');
                if (pElements.length > 0) {
                  const firstP = pElements[0];
                  const pStyle = firstP.getAttribute('style') || '';
                  const alignMatch = pStyle.match(/text-align:\s*([^;]+)/);
                  if (alignMatch) {
                    extractedStyles.align = alignMatch[1].trim();
                  }
                }
              } catch (error) {
                content = htmlText.replace(/<[^>]*>/g, '').trim();
              }
            } else {
              content = htmlText.replace(/<[^>]*>/g, '').trim();
            }
          } else {
            content = String(cell.text || cell.content || '');
          }
          
          return {
            content,
            styles: {
              ...cellStyle,
              backgroundColor: cell.fillColor || cellStyle?.backgroundColor,
              color: extractedStyles.color || cell.fontColor || cellStyle?.color || '#000000',
              bold: extractedStyles.bold || cell.fontBold || cellStyle?.bold || false,
              fontSize: extractedStyles.fontSize || cellStyle?.fontSize || 12,
              fontFamily: extractedStyles.fontFamily || 'Arial',
              align: extractedStyles.align || cellStyle?.align || 'left',
            },
            merged: {
              colSpan: cell.colSpan || cell.rowSpan, // 处理单元格合并
              hMerge: cell.hMerge,
              vMerge: cell.vMerge, // 添加垂直合并支持
              borders: cell.borders
            },
            _original: cell,
          };
        }
        
        return {
          content: String(cell || ''),
          styles: cellStyle,
        };
      });
    });
  };

  const tableData = processTableData();

  const handleCellClick = (row: number, col: number) => {
    if (isEditing) {
      setSelectedCell({ row, col });
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    onCellEdit?.(row, col, value);
    setSelectedCell(null);
  };

  // 计算单元格的边框样式
  const getCellBorderStyle = (cellData: CellData, rowIndex: number, colIndex: number) => {
    const borders = cellData.merged?.borders || {};
    
    return {
      borderTopWidth: borders.top?.borderWidth || 1,
      borderTopColor: borders.top?.borderColor || borderStyle?.color || '#E5E7EB',
      borderTopStyle: borders.top?.borderType || borderStyle?.style || 'solid',
      
      borderRightWidth: borders.right?.borderWidth || 1,
      borderRightColor: borders.right?.borderColor || borderStyle?.color || '#E5E7EB',
      borderRightStyle: borders.right?.borderType || borderStyle?.style || 'solid',
      
      borderBottomWidth: borders.bottom?.borderWidth || 1,
      borderBottomColor: borders.bottom?.borderColor || borderStyle?.color || '#E5E7EB',
      borderBottomStyle: borders.bottom?.borderType || borderStyle?.style || 'solid',
      
      borderLeftWidth: borders.left?.borderWidth || 1,
      borderLeftColor: borders.left?.borderColor || borderStyle?.color || '#E5E7EB',
      borderLeftStyle: borders.left?.borderType || borderStyle?.style || 'solid',
    };
  };

  // 检查单元格是否被合并（应该隐藏）
  const isCellMerged = (rowIndex: number, colIndex: number): boolean => {
    // 检查是否有其他单元格合并到这个位置
    for (let r = 0; r < tableData.length; r++) {
      for (let c = 0; c < tableData[r].length; c++) {
        if (r === rowIndex && c === colIndex) continue;
        
        const cell = tableData[r][c];
        const colSpan = cell.merged?.colSpan || 1;
        const rowSpan = cell.merged?.rowSpan || 1;
        
        // 检查列合并
        if (colSpan > 1 && rowIndex === r && colIndex > c && colIndex < c + colSpan) {
          return true;
        }
        
        // 检查行合并
        if (rowSpan > 1 && colIndex === c && rowIndex > r && rowIndex < r + rowSpan) {
          return true;
        }
        
        // 检查vMerge字段（专门处理PPT导入的合并单元格）
        if (cell.merged?.vMerge && cell.merged.vMerge > 0 && colIndex === c && rowIndex === r + 1) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="w-full h-full p-1">
      <div 
        className="w-full h-full border rounded overflow-hidden"
        style={{
          borderWidth: borderStyle?.width || 1,
          borderColor: borderStyle?.color || '#E5E7EB',
          borderStyle: borderStyle?.style || 'solid',
        }}
      >
        <table className="w-full h-full border-collapse table-fixed">
          {colWidths.length > 0 && (
            <colgroup>
              {colWidths.map((width, index) => (
                <col key={index} style={{ width: `${width}px` }} />
              ))}
            </colgroup>
          )}
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                style={{
                  height: rowHeights[rowIndex] ? `${rowHeights[rowIndex]}px` : 'auto'
                }}
              >
                {row.map((cellData, colIndex) => {
                  // 跳过被合并的单元格
                  if (isCellMerged(rowIndex, colIndex)) {
                    return null;
                  }

                  const cellStyles = cellData.styles || {};
                  const colSpan = cellData.merged?.colSpan || 1;
                  const rowSpan = cellData.merged?.rowSpan || (cellData.merged?.vMerge ? 1 : 1);
                  const borderStyle = getCellBorderStyle(cellData, rowIndex, colIndex);

                  return (
                    <td
                      key={colIndex}
                      colSpan={colSpan}
                      rowSpan={rowSpan}
                      className={cn(
                        "relative cursor-pointer transition-colors",
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                      style={{
                        ...borderStyle,
                        fontSize: `${(cellStyles.fontSize || 14) * canvasScale}px`,
                        fontFamily: cellStyles.fontFamily || 'Arial',
                        color: cellStyles.color || '#374151',
                        backgroundColor: cellStyles.backgroundColor || 'transparent',
                        fontWeight: cellStyles.bold ? 'bold' : 'normal',
                        fontStyle: cellStyles.italic ? 'italic' : 'normal',
                        textAlign: cellStyles.align as any || 'left',
                        padding: `${4 * canvasScale}px`,
                        verticalAlign: 'middle',
                      }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {selectedCell?.row === rowIndex && selectedCell?.col === colIndex && isEditing ? (
                        <input
                          type="text"
                          value={cellData.content}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onBlur={() => setSelectedCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellChange(rowIndex, colIndex, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setSelectedCell(null);
                            }
                          }}
                          className="w-full h-full bg-transparent border-none outline-none"
                          autoFocus
                          style={{
                            fontSize: `${(cellStyles.fontSize || 14) * canvasScale}px`,
                            color: cellStyles.color || '#374151',
                            textAlign: cellStyles.align as any || 'left',
                            fontFamily: cellStyles.fontFamily || 'Arial',
                            fontWeight: cellStyles.bold ? 'bold' : 'normal',
                            fontStyle: cellStyles.italic ? 'italic' : 'normal',
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center"
                          style={{
                            justifyContent: cellStyles.align === 'center' ? 'center' : 
                                           cellStyles.align === 'right' ? 'flex-end' : 'flex-start'
                          }}
                        >
                          {cellData.content || (isEditing ? '点击编辑' : '')}
                        </div>
                      )}
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