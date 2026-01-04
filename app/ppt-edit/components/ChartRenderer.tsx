'use client';

import { useEffect, useRef } from 'react';
import { PPTElement } from '../store/ppt-store';
// 注意：需要安装echarts库
// import * as echarts from 'echarts';

interface ChartRendererProps {
  element: PPTElement;
  canvasScale: number;
}

export function ChartRenderer({ element, canvasScale }: ChartRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!element.chart || !chartRef.current) return;

    // 初始化图表
    const initChart = async () => {
      try {
        // 由于echarts库可能未安装，使用自定义图表渲染
        console.warn('ECharts库未安装，使用自定义图表渲染');
        
        if (chartRef.current && element.chart) {
          console.log('Chart element:', element.chart);
          const { xData, yData } = extractChartData(element.chart);
          console.log('Extracted chart data:', { xData, yData, type: element.chart.type });
          renderCustomChart(element.chart.type, xData, yData);
        }
        return;

        // 根据图表类型生成配置
        const option = generateChartOption(element.chart);
        
        // 设置图表配置
        chartInstanceRef.current.setOption(option);

        // 监听窗口大小变化
        const handleResize = () => {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.resize();
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartInstanceRef.current) {
            chartInstanceRef.current.dispose();
          }
        };
      } catch (error) {
        console.error('Failed to load ECharts:', error);
        // 显示错误信息
        if (chartRef.current) {
          chartRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444; font-size: 12px;">
              图表加载失败
            </div>
          `;
        }
      }
    };

    initChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }
    };
  }, [element.chart, canvasScale]);

  // 渲染自定义图表
  const renderCustomChart = (chartType: string, xData: string[], yData: number[]) => {
    if (!chartRef.current) return;

    const maxValue = Math.max(...yData);
    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

    switch (chartType) {
      case 'bar':
        chartRef.current.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 12px; text-align: center;">
              柱状图
            </div>
            <div style="flex: 1; display: flex; align-items: end; justify-content: space-around; gap: 8px;">
              ${yData.map((value, index) => `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                  <div style="
                    background: ${colors[index % colors.length]};
                    height: ${(value / maxValue) * 80}%;
                    min-height: 8px;
                    width: 100%;
                    max-width: 32px;
                    border-radius: 2px 2px 0 0;
                    margin-bottom: 4px;
                    position: relative;
                  ">
                    <div style="
                      position: absolute;
                      top: -18px;
                      left: 50%;
                      transform: translateX(-50%);
                      font-size: 10px;
                      color: #6B7280;
                      white-space: nowrap;
                    ">${value}</div>
                  </div>
                  <div style="font-size: 9px; color: #9CA3AF; text-align: center; word-break: break-all;">
                    ${xData[index] || `项目${index + 1}`}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        break;

      case 'line':
        const points = yData.map((value, index) => {
          const x = (index / (yData.length - 1)) * 80 + 10;
          const y = 80 - (value / maxValue) * 60;
          return `${x},${y}`;
        }).join(' ');

        chartRef.current.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 12px; text-align: center;">
              折线图
            </div>
            <div style="flex: 1; position: relative;">
              <svg width="100%" height="100%" viewBox="0 0 100 100" style="overflow: visible;">
                <polyline points="${points}" 
                  fill="none" 
                  stroke="#6366F1" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
                ${yData.map((value, index) => {
                  const x = (index / (yData.length - 1)) * 80 + 10;
                  const y = 80 - (value / maxValue) * 60;
                  return `
                    <circle cx="${x}" cy="${y}" r="3" fill="#6366F1" />
                    <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="8" fill="#6B7280">${value}</text>
                  `;
                }).join('')}
              </svg>
            </div>
          </div>
        `;
        break;

      case 'pie':
        const total = yData.reduce((sum, val) => sum + val, 0);
        let currentAngle = 0;
        const radius = 35;
        const centerX = 50;
        const centerY = 50;

        const slices = yData.map((value, index) => {
          const sliceAngle = (value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          currentAngle += sliceAngle;

          return `<path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="1" />`;
        }).join('');

        chartRef.current.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 12px; text-align: center;">
              饼图
            </div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                ${slices}
              </svg>
            </div>
          </div>
        `;
        break;

      default:
        chartRef.current.innerHTML = `
          <div style="
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 14px;
            border-radius: 8px;
            padding: 16px;
          ">
            <div style="font-size: 16px; margin-bottom: 8px;">📊</div>
            <div>${chartType || '图表'} 预览</div>
            <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">
              数据点: ${yData.length}
            </div>
          </div>
        `;
    }
  };

  // 提取图表数据 - 处理不同的数据格式
  const extractChartData = (chartConfig: any) => {
    if (!chartConfig.data || !Array.isArray(chartConfig.data)) {
      return { xData: ['分类1', '分类2', '分类3'], yData: [120, 200, 150] };
    }

    // 处理PPTX导入的数据格式: data[0].values[{x, y}]
    if (chartConfig.data[0] && chartConfig.data[0].values && Array.isArray(chartConfig.data[0].values)) {
      const values = chartConfig.data[0].values;
      const xData = values.map((item: any) => item.x || item.name || `分类${values.indexOf(item) + 1}`);
      const yData = values.map((item: any) => Number(item.y || item.value || 0));
      return { xData, yData };
    }

    // 处理标准格式: [{name, value}]
    if (chartConfig.data[0] && (chartConfig.data[0].name !== undefined || chartConfig.data[0].value !== undefined)) {
      const xData = chartConfig.data.map((item: any) => item.name || `分类${chartConfig.data.indexOf(item) + 1}`);
      const yData = chartConfig.data.map((item: any) => Number(item.value || 0));
      return { xData, yData };
    }

    // 处理简单数组格式: [value1, value2, ...]
    if (typeof chartConfig.data[0] === 'number') {
      const xData = chartConfig.data.map((_: any, index: number) => `分类${index + 1}`);
      const yData = chartConfig.data.map((item: any) => Number(item || 0));
      return { xData, yData };
    }

    // 默认数据
    return { xData: ['分类1', '分类2', '分类3'], yData: [120, 200, 150] };
  };

  // 生成图表配置
  const generateChartOption = (chartConfig: any) => {
    const baseOption = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'Inter, sans-serif',
      },
      animation: false, // 禁用动画以提高性能
    };

    const { xData, yData } = extractChartData(chartConfig);

    switch (chartConfig.type) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: xData,
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            data: yData,
            type: 'bar',
            itemStyle: {
              color: '#6366F1',
            },
          }],
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: xData,
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            data: yData,
            type: 'line',
            smooth: true,
            lineStyle: {
              color: '#6366F1',
            },
            itemStyle: {
              color: '#6366F1',
            },
          }],
        };

      case 'pie':
        // 饼图需要特殊处理，使用name和value格式
        const pieData = xData.map((name: string, index: number) => ({
          name,
          value: yData[index] || 0
        }));
        
        return {
          ...baseOption,
          series: [{
            name: '数据',
            type: 'pie',
            radius: '60%',
            data: pieData.length > 0 ? pieData : [
              { value: 1048, name: '搜索引擎' },
              { value: 735, name: '直接访问' },
              { value: 580, name: '邮件营销' },
              { value: 484, name: '联盟广告' },
              { value: 300, name: '视频广告' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }],
        };

      case 'area':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: xData,
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            data: yData,
            type: 'line',
            areaStyle: {
              color: 'rgba(99, 102, 241, 0.3)',
            },
            lineStyle: {
              color: '#6366F1',
            },
            itemStyle: {
              color: '#6366F1',
            },
          }],
        };

      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'value',
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            data: chartConfig.data || [[10, 20], [15, 25], [20, 30], [25, 35]],
            type: 'scatter',
            itemStyle: {
              color: '#6366F1',
            },
          }],
        };

      case 'radar':
        return {
          ...baseOption,
          radar: {
            indicator: chartConfig.indicators || [
              { name: '销售', max: 100 },
              { name: '管理', max: 100 },
              { name: '信息技术', max: 100 },
              { name: '客服', max: 100 },
              { name: '研发', max: 100 },
              { name: '市场', max: 100 }
            ]
          },
          series: [{
            name: '预算 vs 开销',
            type: 'radar',
            data: chartConfig.data || [
              {
                value: [43, 76, 65, 54, 70, 42],
                name: '预算分配'
              },
              {
                value: [64, 88, 51, 77, 83, 67],
                name: '实际开销'
              }
            ]
          }],
        };

      default:
        return {
          ...baseOption,
          title: {
            text: '不支持的图表类型',
            left: 'center',
            top: 'middle',
            textStyle: {
              color: '#ef4444',
              fontSize: 14,
            },
          },
        };
    }
  };

  return (
    <div 
      ref={chartRef} 
      className="w-full h-full"
      style={{ 
        minHeight: '100px',
        backgroundColor: 'transparent',
      }}
    />
  );
}