'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StyledButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  styleType?: 'gradient' | 'solid';
}

export function StyledButton({ 
  children, 
  className, 
  variant = 'primary', 
  styleType = 'solid',
  ...props 
}: StyledButtonProps) {
  const getButtonStyles = () => {
    const baseStyles = "transition-all duration-200 font-medium";
    
    switch (variant) {
      case 'primary':
        if (styleType === 'gradient') {
          return cn(
            baseStyles,
            "text-white border-0",
            "bg-gradient-to-r from-purple-500 to-purple-600",
            "hover:from-purple-600 hover:to-purple-700",
            "active:from-purple-700 active:to-purple-800",
            "shadow-md hover:shadow-lg",
            "disabled:from-gray-300 disabled:to-gray-400"
          );
        }
        return cn(
          baseStyles,
          "text-white border-0",
          "hover:shadow-md",
          "disabled:bg-gray-300"
        );
        
      case 'secondary':
        return cn(
          baseStyles,
          "border",
          "hover:shadow-sm",
          "disabled:opacity-50"
        );
        
      case 'danger':
        return cn(
          baseStyles,
          "text-white border-0",
          "bg-red-500 hover:bg-red-600",
          "hover:shadow-md",
          "disabled:bg-gray-300"
        );
        
      case 'outline':
        return cn(
          baseStyles,
          "border",
          "hover:shadow-sm",
          "disabled:opacity-50"
        );
        
      default:
        return baseStyles;
    }
  };

  const getInlineStyles = () => {
    switch (variant) {
      case 'primary':
        if (styleType === 'solid') {
          return {
            backgroundColor: '#6366F1',
            borderColor: '#4F46E5',
            boxShadow: '0 4px 6px rgba(99, 102, 241, 0.1)',
          };
        }
        return {};
        
      case 'secondary':
        return {
          backgroundColor: '#FFFFFF',
          color: '#6366F1',
          borderColor: '#C7D2FE',
          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.05)',
        };
        
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#6366F1',
          borderColor: '#C7D2FE',
        };
        
      default:
        return {};
    }
  };

  return (
    <Button
      className={cn(getButtonStyles(), className)}
      style={getInlineStyles()}
      {...props}
    >
      {children}
    </Button>
  );
}