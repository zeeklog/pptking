'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  LineChart, 
  PieChart,
  TrendingUp,
  Zap,
  Radar,
  Plus,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter as RechartsScatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
} from 'recharts';

interface ChartEditorProps {
  data: any[];
  chartType: string;
  theme: string;
  options: any;
  onChange: (updates: { data?: any[]; chartType?: string; theme?: string; options?: any }) => void;
}

// 图表类型配置
const CHART_TYPES = [
  { value: 'bar', label: '柱状图', icon: BarChart3 },
  { value: 'line', label: '折线图', icon: LineChart },
  { value: 'pie', label: '饼图', icon: PieChart },
  { value: 'area', label: '面积图', icon: TrendingUp },
  { value: 'scatter', label: '散点图', icon: Scatter },
  { value: 'radar', label: '雷达图', icon: Radar },
];

// 默认数据
const DEFAULT_DATA = {
  bar: [
    { name: '一月', value: 400, value2: 240 },
    { name: '二月', value: 300, value2: 139 },
    { name: '三月', value: 200, value2: 980 },
    { name: '四月', value: 278, value2: 390 },
    { name: '五月', value: 189, value2: 480 },
  ],
  line: [
    { name: '一月', value: 400 },
    { name: '二月', value: 300 },
    { name: '三月', value: 200 },
    { name: '四月', value: 278 },
    { name: '五月', value: 189 },
  ],
  pie: [
    { name: '分类A', value: 400 },
    { name: '分类B', value: 300 },
    { name: '分类C', value: 300 },
    { name: '分类D', value: 200 },
  ],
  area: [
    { name: '一月', value: 400, value2: 240 },
    { name: '二月', value: 300, value2: 139 },
    { name: '三月', value: 200, value2: 980 },
    { name: '四月', value: 278, value2: 390 },
    { name: '五月', value: 189, value2: 480 },
  ],
  scatter: [
    { x: 100, y: 200 },
    { x: 120, y: 100 },
    { x: 170, y: 300 },
    { x: 140, y: 250 },
    { x: 150, y: 400 },
  ],
  radar: [
    { subject: '数学', A: 120, B: 110, fullMark: 150 },
    { subject: '语文', A: 98, B: 130, fullMark: 150 },
    { subject: '英语', A: 86, B: 130, fullMark: 150 },
    { subject: '地理', A: 99, B: 100, fullMark: 150 },
    { subject: '物理', A: 85, B: 90, fullMark: 150 },
    { subject: '历史', A: 65, B: 85, fullMark: 150 },
  ],
};

// 主题颜色
const CHART_THEMES = [
  { 
    name: '紫色科技', 
    colors: ['#6366F1', '#4F46E5', '#8B5CF6', '#7C3AED', '#A855F7'] 
  },
  { 
    name: '蓝色商务', 
    colors: ['#3B82F6', '#1D4ED8', '#2563EB', '#1E40AF', '#60A5FA'] 
  },
  { 
    name: '绿色清新', 
    colors: ['#10B981', '#059669', '#34D399', '#047857', '#6EE7B7'] 
  },
  { 
    name: '橙色活力', 
    colors: ['#F59E0B', '#D97706', '#FBBF24', '#B45309', '#FCD34D'] 
  },
];

export function ChartEditor({ data, chartType, theme, options, onChange }: ChartEditorProps) {
  const { t } = useTranslation();
  const [dataText, setDataText] = useState(JSON.stringify(data, null, 2));

  // 渲染图表预览
  const renderChart = () => {
    const currentTheme = CHART_THEMES.find(t => t.name === theme) || CHART_THEMES[0];
    const colors = currentTheme.colors;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} />
              {data[0]?.value2 !== undefined && <Bar dataKey="value2" fill={colors[1]} />}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} />
              {data[0]?.value2 !== undefined && <Line type="monotone" dataKey="value2" stroke={colors[1]} strokeWidth={2} />}
            </RechartsLineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stackId="1" stroke={colors[0]} fill={colors[0]} />
              {data[0]?.value2 !== undefined && <Area type="monotone" dataKey="value2" stackId="1" stroke={colors[1]} fill={colors[1]} />}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="A" dataKey="A" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
              {data[0]?.B !== undefined && <Radar name="B" dataKey="B" stroke={colors[1]} fill={colors[1]} fillOpacity={0.6} />}
            </RadarChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <div className="h-48 flex items-center justify-center text-gray-500">
            选择图表类型
          </div>
        );
    }
  };

  // 更新数据
  const updateData = () => {
    try {
      const newData = JSON.parse(dataText);
      onChange({ data: newData });
    } catch (error) {
      console.error('Invalid JSON data:', error);
    }
  };

  // 使用默认数据
  const useDefaultData = (type: string) => {
    const defaultData = DEFAULT_DATA[type as keyof typeof DEFAULT_DATA];
    if (defaultData) {
      setDataText(JSON.stringify(defaultData, null, 2));
      onChange({ data: defaultData, chartType: type });
    }
  };

  return (
    <div className="space-y-4">
      {/* 图表类型选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">图表类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {CHART_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "outline"}
                  size="sm"
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => useDefaultData(type.value)}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{type.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 图表预览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">预览</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* 主题选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">主题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {CHART_THEMES.map((themeOption) => (
              <Button
                key={themeOption.name}
                variant={theme === themeOption.name ? "default" : "outline"}
                size="sm"
                className="h-12 p-2"
                onClick={() => onChange({ theme: themeOption.name })}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {themeOption.colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs">{themeOption.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据编辑 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">数据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">JSON数据</Label>
            <Textarea
              value={dataText}
              onChange={(e) => setDataText(e.target.value)}
              className="h-32 font-mono text-xs"
              placeholder="输入图表数据..."
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={updateData}
            >
              应用数据
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                // 导入数据文件
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json,.csv,.txt';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const content = e.target?.result as string;
                        let importedData;
                        
                        if (file.name.endsWith('.json')) {
                          importedData = JSON.parse(content);
                        } else if (file.name.endsWith('.csv')) {
                          // 简单的CSV解析
                          const lines = content.split('\n');
                          const headers = lines[0].split(',');
                          importedData = lines.slice(1).map(line => {
                            const values = line.split(',');
                            const obj: any = {};
                            headers.forEach((header, index) => {
                              obj[header.trim()] = values[index]?.trim() || '';
                            });
                            return obj;
                          });
                        }
                        
                        if (importedData) {
                          setDataText(JSON.stringify(importedData, null, 2));
                          onChange({ data: importedData });
                        }
                      } catch (error) {
                        console.error('数据导入失败:', error);
                        alert('数据格式不正确，请检查文件格式');
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                fileInput.click();
              }}
              title="导入数据"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                // 导出数据文件
                try {
                  const blob = new Blob([dataText], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chart-data-${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('数据导出失败:', error);
                  alert('数据导出失败，请检查数据格式');
                }
              }}
              title="导出数据"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}