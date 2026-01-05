'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { Settings, CreditCard, LogOut, User, Zap, Crown, Sparkles, Menu, X, Heart, ChevronDown, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Navigation } from "./Navigation";
import { LanguageToggle } from "./LanguageToggle";
import { useDeviceType, useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { showLoginModal } = useLoginModal();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const deviceType = useDeviceType();
  const isMobile = useIsMobile();

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 监听窗口大小变化，自动关闭移动端菜单
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('header.logoutSuccess'),
        description: t('header.logoutSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('header.logoutError'),
        description: t('header.logoutErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const navigationItems = [
    { title: t('navigation.home'), href: "/" },
    { title: t('navigation.generate'), href: "/generate" },
    { title: t('navigation.pptEdit'), href: "/ppt-edit" },
    { title: t('navigation.copywriting'), href: "/copywriting" },
    { title: t('navigation.chat'), href: "/chat" }
  ];

  // 检查是否在聊天页面
  const isChatPage = pathname?.startsWith('/chat');

  return (
    <header className={cn(
      "z-50 w-full transition-all duration-300 h-14 sm:h-16 fixed top-0",
      isChatPage
        ? 'bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700'
        : cn(
            isScrolled
              ? 'bg-white/95 backdrop-blur-md border-b border-purple-200/50 shadow-lg dark:bg-gray-900/95 dark:border-purple-700/50'
              : 'bg-white/80 backdrop-blur-sm border-b border-purple-100/50 shadow-sm dark:bg-gray-900/80 dark:border-purple-800/50'
          )
    )}>
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between min-w-0">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0">
            <div
              className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer"
              onClick={() => handleNavigation('/')}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform truncate">
                  PPTKING
                </span>
                <span className="text-xs text-tech-500 -mt-1 hidden sm:block">{t('header.aiSmartPPT')}</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-shrink-0">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-all duration-300 group",
                  isActive(item.href)
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-tech-600 hover:text-purple-600 dark:text-tech-300 dark:hover:text-purple-400'
                )}
              >
                {item.title}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                )}
                <div className="absolute inset-0 bg-purple-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            {/* Theme Toggle - 隐藏在小屏幕上 */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Language Toggle - 隐藏在小屏幕上 */}
            <div className="hidden md:block">
              <LanguageToggle />
            </div>

            {/* 升级VIP按钮 - 响应式显示 */}
            <Button
              className={cn(
                "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden",
                isMobile ? "rounded-full px-2 py-2" : "rounded-full px-4 lg:px-6 py-2"
              )}
              onClick={() => handleNavigation('/pricing')}
            >
              <span className="relative z-10 flex items-center">
                <Crown className="w-4 h-4 mr-1 lg:mr-2 group-hover:rotate-12 transition-transform" />
                <span className={cn(isMobile ? "hidden" : "hidden lg:block")}>{t('pricing.upgrade')}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-purple-50 transition-all duration-300 group">
                    <Avatar className="h-10 w-10 ring-2 ring-purple-200 group-hover:ring-purple-300 transition-all duration-300">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || user.email} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                        {user.user_metadata?.username?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || user.email} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {user.user_metadata?.username?.[0] || user.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold leading-none text-tech-800 dark:text-tech-200">
                            {user.user_metadata?.username || t('common.user')}
                          </p>
                          <p className="text-xs leading-none text-tech-500 dark:text-tech-400 mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit bg-purple-50 text-purple-700 border-purple-200">
                        <Crown className="w-3 h-3 mr-1" />
                        {t('pricing.free')} {t('common.user')}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-tech-700 cursor-pointer dark:text-tech-300 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => handleNavigation('/profile')}
                  >
                    <User className="mr-3 h-4 w-4 text-purple-500" />
                    <span>{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-tech-700 cursor-pointer dark:text-tech-300 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => handleNavigation('/settings')}
                  >
                    <Settings className="mr-3 h-4 w-4 text-purple-500" />
                    <span>{t('common.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-tech-700 cursor-pointer dark:text-tech-300 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => handleNavigation('/membership')}
                  >
                    <Crown className="mr-3 h-4 w-4 text-purple-500" />
                    <span>{t('navigation.membership')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-tech-700 cursor-pointer dark:text-tech-300 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => handleNavigation('/myCollection')}
                  >
                    <Heart className="mr-3 h-4 w-4 text-purple-500" />
                    <span>{t('membership.myCollection')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-error-600 focus:text-error-600 cursor-pointer p-3 rounded-lg hover:bg-error-50 transition-colors"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className={cn(
                  "border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group rounded-full",
                  isMobile ? "px-2 py-2" : "px-4 lg:px-6 py-2"
                )}
                onClick={() => showLoginModal()}
              >
                <span className="flex items-center">
                  <User className={cn("group-hover:rotate-12 transition-transform", isMobile ? "w-4 h-4" : "w-4 h-4 mr-1 lg:mr-2")} />
                  <span className={cn(isMobile ? "hidden" : "hidden lg:block")}>{t('common.login')}</span>
                </span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-purple-50 transition-colors rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-tech-600" />
              ) : (
                <Menu className="w-5 h-5 text-tech-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-100 dark:border-purple-800 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "block w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300",
                    isActive(item.href)
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'text-tech-600 hover:bg-purple-50 hover:text-purple-600 dark:text-tech-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400'
                  )}
                >
                  {item.title}
                </button>
              ))}

              {/* 移动端额外选项 */}
              <div className="border-t border-purple-100 dark:border-purple-800 pt-4 mt-4">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-tech-500">{t('common.theme')}</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-tech-500">{t('common.language')}</span>
                  <LanguageToggle />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}