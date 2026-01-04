"use client";

import { useEffect, useState } from "react";
import { Chat } from "./chat";
import { SideBar } from "./sidebar";
import { Loading } from "./loading";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { useAccessStore } from "../store";
import { useTheme } from "@/contexts/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Home() {
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const config = useAppConfig();
  const accessStore = useAccessStore();
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initialize the app
    const init = async () => {
      try {
        // Load client config
        const clientConfig = getClientConfig();
        console.log("[Client Config] ", clientConfig);

        // 使用ThemeProvider的resolvedTheme，不再手动设置
        console.log("[Home] Current theme:", resolvedTheme);

        setLoading(false);
      } catch (error) {
        console.error("[Init Error]", error);
        setLoading(false);
      }
    };

    init();
  }, [resolvedTheme]);

  // 监听窗口大小变化，自动关闭移动端菜单
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  if (loading) {
    return <Loading />;
  }

  // Check if user needs authentication
  if (!accessStore.token && !accessStore.accessCode) {
    return <AuthPage />;
  }

  return (
    <div className="flex bg-gradient-to-br from-[#EEF2FF] to-[#F9FAFB] dark:from-[#1A1B26] dark:to-[#1F2937]">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 bg-white/80 backdrop-blur-sm border border-[#C7D2FE] dark:bg-[#1F2937]/80 dark:border-[#374151] shadow-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-[#6366F1]" />
          ) : (
            <Menu className="h-5 w-5 text-[#6366F1]" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        top-0 left-0
        h-screen
        z-50
        transition-transform duration-300 ease-in-out pt-16
      `}>
        <SideBar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col w-full lg:w-auto h-screen pt-16">
        <Chat />
      </div>
    </div>
  );
}
