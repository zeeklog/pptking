'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Heart, 
  Download, 
  Eye, 
  Crown, 
  Filter, 
  Star, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  FileText, 
  Zap,
  Target,
  Palette,
  Award,
  Users,
  ArrowRight,
  Play,
  Grid3X3,
  List,
  Shuffle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";



function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="template-card overflow-hidden hover:scale-101 transition-all duration-300">
          <Skeleton className="w-full h-56" />
          <CardContent className="p-6">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Templates() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [selectedSort, setSelectedSort] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const { user } = useAuth();
  const { showLoginModal } = useLoginModal();
  const searchParams = useSearchParams();

  const categories = [
    { value: "all", label: t('templates.categories.all'), icon: "📄", color: "from-purple-500 to-pink-500" },
    { value: "business", label: t('templates.categories.business'), icon: "💼", color: "from-blue-500 to-cyan-500" },
    { value: "education", label: t('templates.categories.education'), icon: "📚", color: "from-green-500 to-emerald-500" },
    { value: "marketing", label: t('templates.categories.marketing'), icon: "📢", color: "from-orange-500 to-red-500" },
    { value: "tech", label: t('templates.categories.tech'), icon: "🚀", color: "from-purple-500 to-indigo-500" },
    { value: "medical", label: t('templates.categories.medical'), icon: "🏥", color: "from-emerald-500 to-teal-500" },
    { value: "finance", label: t('templates.categories.finance'), icon: "💰", color: "from-yellow-500 to-orange-500" },
    { value: "creative", label: t('templates.categories.creative'), icon: "🎨", color: "from-pink-500 to-purple-500" }
  ];

  const styles = [
    { value: "all", label: t('templates.styles.all'), icon: "🌈", color: "from-purple-500 to-pink-500" },
    { value: "minimal", label: t('templates.styles.minimal'), icon: "⚪", color: "from-gray-500 to-gray-600" },
    { value: "business", label: t('templates.styles.business'), icon: "💼", color: "from-blue-500 to-purple-500" },
    { value: "creative", label: t('templates.styles.creative'), icon: "🎨", color: "from-pink-500 to-orange-500" },
    { value: "modern", label: t('templates.styles.modern'), icon: "✨", color: "from-cyan-500 to-blue-500" },
    { value: "classic", label: t('templates.styles.classic'), icon: "📜", color: "from-amber-500 to-orange-500" }
  ];

  const sortOptions = [
    { value: "all", label: t('templates.sortOptions.all'), icon: "📄" },
    { value: "recent", label: t('templates.sortOptions.recent'), icon: "🕒" },
    { value: "popular", label: t('templates.sortOptions.popular'), icon: "🔥" }
  ];
  const { 
    templates, 
    favorites, 
    loading, 
    handleFavorite, 
    handleDownload, 
    handlePreview 
  } = useTemplates();

  // 从URL参数获取初始tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['recent', 'popular'].includes(tab)) {
      setSelectedSort(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDownloadWithAuth = (template: any) => {
    if (!user) {
      showLoginModal();
      return;
    }
    handleDownload(template);
  };

  const handleFavoriteWithAuth = (templateId: string) => {
    if (!user) {
      showLoginModal();
      return;
    }
    handleFavorite(templateId);
  };

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.designer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesStyle = selectedStyle === "all" || template.style === selectedStyle;
    
    return matchesSearch && matchesCategory && matchesStyle;
  });

  // Get recent templates (last 20)
  const recentTemplates = templates.slice(0, 20);

  // Get popular templates (sorted by downloads)
  const popularTemplates = [...templates].sort((a, b) => 
    (b.download_count || 0) - (a.download_count || 0)
  ).slice(0, 20);

  // Get templates based on selected sort
  const getTemplatesBySort = () => {
    switch (selectedSort) {
      case "recent":
        return recentTemplates;
      case "popular":
        return popularTemplates;
      default:
        return filteredTemplates;
    }
  };

  const currentTemplates = getTemplatesBySort();

  const getSortTitle = () => {
    switch (selectedSort) {
      case "recent":
        return t('templates.latestRelease');
      case "popular":
        return t('templates.hotRecommendations');
      default:
        return t('templates.featuredTemplates');
    }
  };

  const renderTemplates = (templateList: any[], title: string) => (
    <div className="space-y-8">
      {/* <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-tech-800 mb-2">{title}</h2>
          <p className="text-tech-600">共找到 {templateList.length} 个模板</p>
        </div> */}
        
        {/* View Mode Toggle */}
        {/* <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-lg transition-all duration-300",
              viewMode === "grid" 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
                : "hover:bg-purple-50"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-lg transition-all duration-300",
              viewMode === "list" 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
                : "hover:bg-purple-50"
            )}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div> */}

                      {/* 精美筛选栏 */}
        <div 
          className={`mb-12 transition-all duration-700 ${isVisible ? 'animate-fade-in opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
          style={{ animationDelay: '300ms' }}
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-purple-500/10 p-8 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-500">
            {/* 搜索栏 - 主要功能 */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-purple-400" />
              </div>
              <Input
                placeholder={t('templates.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-4 text-lg bg-white/80 border-2 border-purple-100 rounded-2xl 
                         focus:border-purple-400 focus:ring-4 focus:ring-purple-100 
                         placeholder:text-purple-300 text-gray-700
                         transition-all duration-300 hover:border-purple-200 hover:bg-white/90
                         shadow-sm hover:shadow-md focus:shadow-lg"
              />
            </div>

            {/* 筛选选项 - 次要功能 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 排序筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('templates.sort')}
                </label>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="h-12 bg-white/80 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-300">
                    <SelectValue placeholder={t('templates.selectSort')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-purple-100 shadow-xl">
                    {sortOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="hover:bg-purple-50 focus:bg-purple-50 rounded-lg"
                      >
                        <span className="flex items-center">
                          <span className="mr-3 text-lg">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 分类筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-600 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  {t('templates.category')}
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 bg-white/80 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-300">
                    <SelectValue placeholder={t('templates.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-purple-100 shadow-xl max-h-80">
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="hover:bg-purple-50 focus:bg-purple-50 rounded-lg"
                      >
                        <span className="flex items-center">
                          <span className="mr-3 text-lg">{category.icon}</span>
                          <span className="font-medium">{category.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 风格筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-600 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  {t('templates.style')}
                </label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="h-12 bg-white/80 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-300">
                    <SelectValue placeholder={t('templates.selectStyle')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-purple-100 shadow-xl">
                    {styles.map((style) => (
                      <SelectItem 
                        key={style.value} 
                        value={style.value}
                        className="hover:bg-purple-50 focus:bg-purple-50 rounded-lg"
                      >
                        <span className="flex items-center">
                          <span className="mr-3 text-lg">{style.icon}</span>
                          <span className="font-medium">{style.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 快捷筛选标签 */}
            <div className="mt-6 pt-6 border-t border-purple-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-purple-600">{t('templates.filter')}:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer px-3 py-1 rounded-full"
                        onClick={() => setSelectedCategory("all")}
                      >
                        {categories.find(c => c.value === selectedCategory)?.label}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    )}
                    {selectedStyle !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer px-3 py-1 rounded-full"
                        onClick={() => setSelectedStyle("all")}
                      >
                        {styles.find(s => s.value === selectedStyle)?.label}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    )}
                    {selectedSort !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer px-3 py-1 rounded-full"
                        onClick={() => setSelectedSort("all")}
                      >
                        {sortOptions.find(s => s.value === selectedSort)?.label}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* 清除所有筛选 */}
                {(selectedCategory !== "all" || selectedStyle !== "all" || selectedSort !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStyle("all");
                      setSelectedSort("all");
                      setSearchQuery("");
                    }}
                    className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl px-4 py-2"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    {t('common.reset')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      
      <div className={cn(
        "gap-8",
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-6"
      )}>
        {templateList.map((template) => (
          <Card 
            key={template.id} 
            className={cn(
              "template-card overflow-hidden transition-all duration-300 group cursor-pointer",
              viewMode === "grid" 
                ? "hover:scale-101" 
                : "flex hover:scale-1005"
            )}
            onClick={() => handlePreview(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            <div className={cn(
              "relative overflow-hidden",
              viewMode === "grid" ? "w-full" : "w-64 flex-shrink-0"
            )}>
              <img
                src={template.thumbnail_url || "/placeholder.svg"}
                alt={template.title}
                className={cn(
                  "object-cover transition-transform duration-300",
                  viewMode === "grid" ? "w-full h-56" : "w-full h-40"
                )}
                style={{
                  transform: hoveredTemplate === template.id ? 'scale(1.02)' : 'scale(1)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {template.is_new && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    NEW
                  </Badge>
                )}
                {template.is_premium && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteWithAuth(template.id);
                  }}
                >
                  <Heart className={cn(
                    "w-4 h-4 transition-all duration-300",
                    Array.from(favorites).includes(template.id) 
                      ? "fill-red-500 text-red-500 scale-105" 
                      : "text-tech-600"
                  )} />
                </Button>
              </div>
              
              {/* Download button */}
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadWithAuth(template);
                  }}
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2 group-hover/btn:scale-105 transition-transform" />
                    下载模板
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            </div>
            
            <CardContent className={cn(
              "flex-1",
              viewMode === "grid" ? "p-6" : "p-6 flex flex-col justify-between"
            )}>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-tech-800 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {template.title}
                </h3>
                
                {viewMode === "list" && (
                  <p className="text-tech-600 line-clamp-2">
                    {template.description || "专业的PPT模板设计，适用于各种商务场景"}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-tech-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {template.designer_name?.[0] || 'P'}
                      </span>
                    </div>
                    <span>{template.designer_name || 'PPTKING'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>{template.download_count || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const stats = [
    { label: "模板总数", value: "100,000+", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-100" },
    { label: "设计师", value: "5,000+", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "下载次数", value: "2,000,000+", icon: Download, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "用户评分", value: "4.9/5", icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-100" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header Section */}
        {/* <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-lg font-medium mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <Palette className="w-6 h-6 mr-2 animate-pulse" />
            模板库
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-tech-800 mb-8">
            10万+精美
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x"> PPT模板</span>
          </h1>
          <p className="text-xl lg:text-2xl text-tech-600 max-w-4xl mx-auto leading-relaxed">
            覆盖各行各业，满足不同场景需求
            <br />
            <span className="text-purple-600 font-medium">专业设计，一键下载</span>，让您的演示更加精彩
          </p>
        </div> */}



        {/* Templates Content */}
        <div className="mt-12 mb-20">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            renderTemplates(currentTemplates, getSortTitle())
          )}
        </div>
      </div>
    </div>
  );
}