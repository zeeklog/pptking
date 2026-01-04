'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Trash2,
  Copy,
  Palette
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { cn } from '@/lib/utils';

interface TableEditorProps {
  rows: number;
  cols: number;
  data: string[][];
  cellStyle: any;
  headerStyle?: any;
  borderStyle: any;
  onChange: (updates: {
    rows?: number;
    cols?: number;
    data?: string[][];
    cellStyle?: any;
    headerStyle?: any;
    borderStyle?: any;
  }) => void;
}

export function TableEditor({ 
  rows, 
  cols, 
  data, 
  cellStyle, 
  headerStyle, 
  borderStyle, 
  onChange 
}: TableEditorProps) {
  const { t } = useTranslation();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // 确保数据数组有正确的尺寸，并且所有单元格都是字符串
  const ensureDataSize = (newRows: number, newCols: number) => {
    const newData = Array(newRows).fill(null).map((_, rowIndex) =>
      Array(newCols).fill(null).map((_, colIndex) => {
        const cellData = data[rowIndex]?.[colIndex];
        // 确保单元格数据始终是字符串
        if (typeof cellData === 'object' && cellData !== null) {
          return JSON.stringify(cellData);
        }
        return String(cellData || '');
      })
    );
    return newData;
  };

  // 更新表格尺寸
  const updateTableSize = (newRows: number, newCols: number) => {
    const newData = ensureDataSize(newRows, newCols);
    onChange({
      rows: newRows,
      cols: newCols,
      data: newData,
    });
  };

  // 更新单元格内容
  const updateCellContent = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    newData[rowIndex][colIndex] = value;
    onChange({ data: newData });
  };

  // 插入行
  const insertRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 0, Array(cols).fill(''));
    onChange({
      rows: rows + 1,
      data: newData,
    });
  };

  // 删除行
  const deleteRow = (index: number) => {
    if (rows <= 1) return;
    const newData = data.filter((_, i) => i !== index);
    onChange({
      rows: rows - 1,
      data: newData,
    });
  };

  // 插入列
  const insertColumn = (index: number) => {
    const newData = data.map(row => {
      const newRow = [...row];
      newRow.splice(index, 0, '');
      return newRow;
    });
    onChange({
      cols: cols + 1,
      data: newData,
    });
  };

  // 删除列
  const deleteColumn = (index: number) => {
    if (cols <= 1) return;
    const newData = data.map(row => row.filter((_, i) => i !== index));
    onChange({
      cols: cols - 1,
      data: newData,
    });
  };

  return (
    <div className="space-y-4">
      {/* 表格尺寸控制 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">表格尺寸</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">行数</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateTableSize(Math.max(1, rows - 1), cols)}
                  disabled={rows <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={rows}
                  onChange={(e) => updateTableSize(parseInt(e.target.value) || 1, cols)}
                  className="h-8 text-center"
                  min="1"
                  max="20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateTableSize(rows + 1, cols)}
                  disabled={rows >= 20}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">列数</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateTableSize(rows, Math.max(1, cols - 1))}
                  disabled={cols <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={cols}
                  onChange={(e) => updateTableSize(rows, parseInt(e.target.value) || 1)}
                  className="h-8 text-center"
                  min="1"
                  max="20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateTableSize(rows, cols + 1)}
                  disabled={cols >= 20}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 表格预览和编辑 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">表格内容</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <table className="w-full">
              <tbody>
                {Array(rows).fill(null).map((_, rowIndex) => (
                  <tr key={rowIndex} className="group">
                    {Array(cols).fill(null).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "border border-gray-200 dark:border-gray-600 p-1 relative",
                          selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "bg-purple-50 dark:bg-purple-900/20"
                        )}
                        onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                      >
                        <Input
                          value={String(data[rowIndex]?.[colIndex] || '')}
                          onChange={(e) => updateCellContent(rowIndex, colIndex, e.target.value)}
                          className="border-none h-8 p-1 text-xs bg-transparent focus:ring-0"
                          style={{
                            color: cellStyle.color,
                            fontSize: `${cellStyle.fontSize}px`,
                            fontWeight: cellStyle.bold ? 'bold' : 'normal',
                            fontStyle: cellStyle.italic ? 'italic' : 'normal',
                            textAlign: cellStyle.align,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 样式设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">样式设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 字体设置 */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">字体</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={cellStyle.fontSize}
                onChange={(e) => onChange({
                  cellStyle: { ...cellStyle, fontSize: parseInt(e.target.value) || 12 }
                })}
                className="h-8"
                placeholder="字号"
                min="8"
                max="32"
              />
              
              <Select
                value={cellStyle.align}
                onValueChange={(value) => onChange({
                  cellStyle: { ...cellStyle, align: value }
                })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左对齐</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                  <SelectItem value="right">右对齐</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 颜色设置 */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">颜色</Label>
            <div className="flex items-center gap-2">
              <Label className="text-xs">文字:</Label>
              <ColorPicker
                value={cellStyle.color}
                onChange={(color) => onChange({
                  cellStyle: { ...cellStyle, color }
                })}
              />
              
              <Label className="text-xs ml-2">背景:</Label>
              <ColorPicker
                value={cellStyle.backgroundColor}
                onChange={(backgroundColor) => onChange({
                  cellStyle: { ...cellStyle, backgroundColor }
                })}
              />
            </div>
          </div>

          {/* 边框设置 */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">边框</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                value={borderStyle.width}
                onChange={(e) => onChange({
                  borderStyle: { ...borderStyle, width: parseInt(e.target.value) || 1 }
                })}
                className="h-8"
                placeholder="粗细"
                min="0"
                max="10"
              />
              
              <ColorPicker
                value={borderStyle.color}
                onChange={(color) => onChange({
                  borderStyle: { ...borderStyle, color }
                })}
              />
              
              <Select
                value={borderStyle.style}
                onValueChange={(value) => onChange({
                  borderStyle: { ...borderStyle, style: value }
                })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">实线</SelectItem>
                  <SelectItem value="dashed">虚线</SelectItem>
                  <SelectItem value="dotted">点线</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 表格操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedCell && (
            <>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                选中单元格: ({selectedCell.row + 1}, {selectedCell.col + 1})
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => insertRow(selectedCell.row + 1)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span className="text-xs">插入行</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => insertColumn(selectedCell.col + 1)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span className="text-xs">插入列</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:text-red-700"
                  onClick={() => deleteRow(selectedCell.row)}
                  disabled={rows <= 1}
                >
                  <Minus className="w-3 h-3 mr-1" />
                  <span className="text-xs">删除行</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:text-red-700"
                  onClick={() => deleteColumn(selectedCell.col)}
                  disabled={cols <= 1}
                >
                  <Minus className="w-3 h-3 mr-1" />
                  <span className="text-xs">删除列</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}