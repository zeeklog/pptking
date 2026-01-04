import { PPTTheme } from '../store/ppt-store';

// 内置主题
export const BUILT_IN_THEMES: PPTTheme[] = [
  {
    id: 'purple-tech',
    name: '紫色科技',
    colors: {
      primary: '#6366F1',
      secondary: '#4F46E5',
      accent: '#818CF8',
      background: '#EEF2FF',
      text: '#374151',
      border: '#C7D2FE',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(99, 102, 241, 0.05)',
      medium: '0 4px 6px rgba(99, 102, 241, 0.1)',
      large: '0 8px 16px rgba(99, 102, 241, 0.15)',
    },
  },
  {
    id: 'blue-business',
    name: '蓝色商务',
    colors: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#60A5FA',
      background: '#EFF6FF',
      text: '#1F2937',
      border: '#BFDBFE',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(59, 130, 246, 0.05)',
      medium: '0 4px 6px rgba(59, 130, 246, 0.1)',
      large: '0 8px 16px rgba(59, 130, 246, 0.15)',
    },
  },
  {
    id: 'green-fresh',
    name: '绿色清新',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      background: '#ECFDF5',
      text: '#065F46',
      border: '#A7F3D0',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(16, 185, 129, 0.05)',
      medium: '0 4px 6px rgba(16, 185, 129, 0.1)',
      large: '0 8px 16px rgba(16, 185, 129, 0.15)',
    },
  },
  {
    id: 'orange-energy',
    name: '橙色活力',
    colors: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FBBF24',
      background: '#FFFBEB',
      text: '#92400E',
      border: '#FDE68A',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(245, 158, 11, 0.05)',
      medium: '0 4px 6px rgba(245, 158, 11, 0.1)',
      large: '0 8px 16px rgba(245, 158, 11, 0.15)',
    },
  },
  {
    id: 'red-passion',
    name: '红色激情',
    colors: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#F87171',
      background: '#FEF2F2',
      text: '#991B1B',
      border: '#FECACA',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(239, 68, 68, 0.05)',
      medium: '0 4px 6px rgba(239, 68, 68, 0.1)',
      large: '0 8px 16px rgba(239, 68, 68, 0.15)',
    },
  },
  {
    id: 'gray-minimal',
    name: '灰色简约',
    colors: {
      primary: '#6B7280',
      secondary: '#374151',
      accent: '#9CA3AF',
      background: '#F9FAFB',
      text: '#1F2937',
      border: '#E5E7EB',
    },
    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    shadows: {
      small: '0 2px 4px rgba(107, 114, 128, 0.05)',
      medium: '0 4px 6px rgba(107, 114, 128, 0.1)',
      large: '0 8px 16px rgba(107, 114, 128, 0.15)',
    },
  },
];

// 主题应用工具
export class ThemeApplier {
  static applyThemeToElement(element: any, theme: PPTTheme) {
    const updates: any = {};
    
    switch (element.type) {
      case 'text':
        if (element.text) {
          updates.text = {
            ...element.text,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          };
        }
        break;
        
      case 'shape':
        if (element.shape) {
          updates.shape = {
            ...element.shape,
            fill: theme.colors.primary,
            stroke: theme.colors.secondary,
          };
        }
        break;
        
      case 'chart':
        if (element.chart) {
          updates.chart = {
            ...element.chart,
            theme: theme.name,
          };
        }
        break;
    }
    
    return updates;
  }
  
  static applyThemeToSlide(slide: any, theme: PPTTheme) {
    return {
      ...slide,
      background: {
        type: 'color',
        value: theme.colors.background,
      },
      elements: slide.elements.map((element: any) => ({
        ...element,
        ...this.applyThemeToElement(element, theme),
      })),
    };
  }
}