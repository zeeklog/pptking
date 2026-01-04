'use client';import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '浅色模式';
      case 'dark':
        return '深色模式';
      case 'system':
        return '跟随系统';
      default:
        return '主题';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 border border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20 rounded-full"
          onClick={toggleTheme}
        >
          {getThemeIcon()}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : ''}
        >
          <Sun className="w-4 h-4 mr-2" />
          浅色模式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : ''}
        >
          <Moon className="w-4 h-4 mr-2" />
          深色模式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : ''}
        >
          <Monitor className="w-4 h-4 mr-2" />
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
