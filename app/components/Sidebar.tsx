'use client';import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  FileText, 
  Trash2, 
  Download,
  ChevronRight,
  Home,
  Crown,
  Zap
} from "lucide-react";

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

export function Sidebar({ activeItem = "ppt-generation", onItemClick }: SidebarProps) {
  const menuItems = [
    {
      id: "ppt-generation",
      label: "PPT生成",
      icon: Sparkles,
      gradient: true,
      description: "AI智能生成PPT"
    },
    {
      id: "templates",
      label: "模板库", 
      icon: FileText,
      description: "海量精美模板"
    },
    {
      id: "trash",
      label: "回收站",
      icon: Trash2,
      description: "已删除文件"
    }
  ];

  return (
    <aside className="w-72 bg-white/95 backdrop-blur-sm border-r border-purple-200/50 h-full flex flex-col shadow-purple-sm">
      {/* Header */}
      <div className="p-6 border-b border-purple-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-purple">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gradient-primary">PPTKING</h2>
            <p className="text-xs text-tech-500">AI智能PPT生成</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-14 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                isActive 
                  ? item.gradient 
                    ? "bg-gradient-primary text-white shadow-purple-md hover:shadow-purple-lg" 
                    : "bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-purple-sm"
                  : "hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent"
              )}
              onClick={() => onItemClick?.(item.id)}
            >
              {/* Background gradient for active state */}
              {isActive && item.gradient && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              <div className="relative flex items-center w-full">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all duration-300",
                  isActive 
                    ? item.gradient 
                      ? "bg-white/20 backdrop-blur-sm" 
                      : "bg-purple-200"
                    : "bg-purple-100 group-hover:bg-purple-200"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive 
                      ? item.gradient 
                        ? "text-white" 
                        : "text-purple-700"
                      : "text-tech-600 group-hover:text-purple-600"
                  )} />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={cn(
                    "text-xs transition-all duration-300",
                    isActive 
                      ? item.gradient 
                        ? "text-white/80" 
                        : "text-purple-600"
                      : "text-tech-500 group-hover:text-purple-500"
                  )}>
                    {item.description}
                  </div>
                </div>
                
                {isActive && (
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-300",
                    item.gradient ? "text-white" : "text-purple-700"
                  )} />
                )}
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-purple-200/50">
        <Button 
          variant="outline" 
          className="w-full justify-start h-14 bg-purple-50 hover:bg-purple-100 border-purple-200/50 rounded-xl group transition-all duration-300 hover:shadow-purple-sm"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
            <Download className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-tech-700">下载客户端</div>
            <div className="text-xs text-tech-500">获得更好体验</div>
          </div>
        </Button>
      </div>
    </aside>
  );
}