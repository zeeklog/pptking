'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator,
  Eye,
  Copy,
  BookOpen
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
// 注意：需要安装katex库
// import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXEditorProps {
  formula: string;
  color: string;
  size: number;
  onChange: (updates: { formula?: string; color?: string; size?: number }) => void;
}

// LaTeX 模板
const LATEX_TEMPLATES = [
  {
    name: '分数',
    formula: '\\frac{a}{b}',
    category: 'basic'
  },
  {
    name: '根号',
    formula: '\\sqrt{x}',
    category: 'basic'
  },
  {
    name: '上标',
    formula: 'x^{2}',
    category: 'basic'
  },
  {
    name: '下标',
    formula: 'x_{1}',
    category: 'basic'
  },
  {
    name: '求和',
    formula: '\\sum_{i=1}^{n} x_i',
    category: 'symbols'
  },
  {
    name: '积分',
    formula: '\\int_{a}^{b} f(x) dx',
    category: 'symbols'
  },
  {
    name: '极限',
    formula: '\\lim_{x \\to \\infty} f(x)',
    category: 'symbols'
  },
  {
    name: '矩阵',
    formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    category: 'matrix'
  },
  {
    name: '二次公式',
    formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    category: 'equations'
  },
  {
    name: '欧拉公式',
    formula: 'e^{i\\pi} + 1 = 0',
    category: 'equations'
  },
];

export function LaTeXEditor({ formula, color, size, onChange }: LaTeXEditorProps) {
  const { t } = useTranslation();
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [renderedFormula, setRenderedFormula] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  // 渲染LaTeX公式预览
  useEffect(() => {
    const renderFormula = async () => {
      try {
        // 动态导入KaTeX
        // 由于katex库可能未安装，使用降级方案
        console.warn('KaTeX库未安装，显示原始公式');
        
        if (previewRef.current) {
          previewRef.current.innerHTML = `
            <div style="
              padding: 10px;
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-family: monospace;
              font-size: 14px;
              color: #374151;
            ">
              ${formula || '请输入LaTeX公式'}
            </div>
          `;
        }
        return;
        
        if (formula.trim()) {
          const html = katex.default.renderToString(formula, {
            throwOnError: false,
            displayMode: true,
            output: 'html',
          });
          setRenderedFormula(html);
          setPreviewError(null);
        } else {
          setRenderedFormula('');
          setPreviewError(null);
        }
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : '渲染错误');
        setRenderedFormula('');
      }
    };

    renderFormula();
  }, [formula]);

  const insertTemplate = (template: string) => {
    const newFormula = formula + template;
    onChange({ formula: newFormula });
  };

  const templatesByCategory = LATEX_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof LATEX_TEMPLATES>);

  return (
    <div className="space-y-4">
      {/* 公式预览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="min-h-16 p-4 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 flex items-center justify-center"
            style={{ color, fontSize: `${size}px` }}
          >
            {previewError ? (
              <div className="text-red-500 text-sm">
                渲染错误: {previewError}
              </div>
            ) : renderedFormula ? (
              <div 
                dangerouslySetInnerHTML={{ __html: renderedFormula }}
                style={{ color, fontSize: `${size}px` }}
              />
            ) : (
              <div className="text-gray-400 text-sm">公式预览将在此显示</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 公式编辑 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Function className="w-4 h-4" />
            LaTeX 公式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">公式代码</Label>
            <Textarea
              value={formula}
              onChange={(e) => onChange({ formula: e.target.value })}
              className="h-24 font-mono text-sm"
              placeholder="输入LaTeX公式，例如: \\frac{a}{b}"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">颜色:</Label>
              <ColorPicker
                value={color}
                onChange={(newColor) => onChange({ color: newColor })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">大小:</Label>
              <Input
                type="number"
                value={size}
                onChange={(e) => onChange({ size: parseInt(e.target.value) || 16 })}
                className="w-16 h-8"
                min="8"
                max="48"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模板库 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            模板库
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="basic" className="text-xs">基础</TabsTrigger>
              <TabsTrigger value="symbols" className="text-xs">符号</TabsTrigger>
              <TabsTrigger value="matrix" className="text-xs">矩阵</TabsTrigger>
              <TabsTrigger value="equations" className="text-xs">方程</TabsTrigger>
            </TabsList>

            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <TabsContent key={category} value={category} className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      className="h-12 p-2 flex flex-col items-center justify-center"
                      onClick={() => insertTemplate(template.formula)}
                    >
                      <div className="text-xs font-mono mb-1">{template.formula.slice(0, 10)}...</div>
                      <div className="text-xs">{template.name}</div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 常用操作 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8"
          onClick={() => {
            navigator.clipboard.writeText(formula);
          }}
        >
          <Copy className="w-3 h-3 mr-1" />
          <span className="text-xs">复制公式</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8"
          onClick={() => onChange({ formula: '' })}
        >
          <span className="text-xs">清空</span>
        </Button>
      </div>
    </div>
  );
}