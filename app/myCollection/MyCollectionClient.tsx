'use client';import { useState, useEffect } from "react";
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
  HeartOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// 移除这些数组，将在组件内部定义

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

export default function MyCollection() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const { user } = useAuth();
  const { showLoginModal } = useLoginModal();
  const { 
    templates, 
    favorites, 
    loading, 
    toggleFavorite, 
    downloadTemplate 
  } = useTemplates();

  // 在组件内部定义分类和样式数组，这样可以使用 t 函数
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

  // 过滤出收藏的模板
  const favoriteTemplates = templates.filter(template => 
    favorites.has(template.id)
  );

  // 根据筛选条件过滤模板
  const filteredTemplates = favoriteTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesStyle = selectedStyle === "all" || template.style === selectedStyle;
    
    return matchesSearch && matchesCategory && matchesStyle;
  });

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-tech-800 dark:text-tech-200 mb-4">
            {t('membership.myCollection')}
          </h1>
          <p className="text-tech-600 dark:text-tech-400 mb-8">
            {t('membership.loginToViewCollection')}
          </p>
          <Button 
            onClick={() => showLoginModal()}
            className="btn-primary shadow-purple-md hover:shadow-purple-lg"
          >
            {t('auth.login')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          {t('membership.myCollection')}
        </h1>
        <p className="text-tech-600 dark:text-tech-400 text-lg">
          {t('membership.collectionCount', { count: favoriteTemplates.length })}
        </p>
      </div>

      {/* 筛选和搜索 */}
      <div className="mb-8 space-y-4">
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tech-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t('membership.searchCollection')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl shadow-sm"
          />
        </div>

        {/* 筛选选项 */}
        <div className="flex flex-wrap gap-4">
          {/* 分类筛选 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-500 focus:ring-purple-500/20">
              <SelectValue placeholder={t('templates.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <span className="flex items-center">
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 风格筛选 */}
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-500 focus:ring-purple-500/20">
              <SelectValue placeholder={t('templates.selectStyle')} />
            </SelectTrigger>
            <SelectContent>
              {styles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <span className="flex items-center">
                    <span className="mr-2">{style.icon}</span>
                    {style.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 视图模式切换 */}
          <div className="flex bg-white/80 backdrop-blur-sm border border-purple-200 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md",
                viewMode === "grid" && "bg-purple-500 text-white shadow-sm"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md",
                viewMode === "list" && "bg-purple-500 text-white shadow-sm"
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartOff className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-tech-800 dark:text-tech-200 mb-2">
            {searchQuery || selectedCategory !== "all" || selectedStyle !== "all" 
              ? t('membership.noMatchingTemplates') 
              : t('membership.noTemplates')}
          </h3>
          <p className="text-tech-600 dark:text-tech-400 mb-6">
            {searchQuery || selectedCategory !== "all" || selectedStyle !== "all"
              ? t('membership.adjustSearchCriteria')
              : t('membership.discoverMoreTemplates')}
          </p>
          <Button 
            onClick={() => window.location.href = '/templates'}
            className="btn-primary shadow-purple-md hover:shadow-purple-lg"
          >
            {t('membership.browseTemplates')}
          </Button>
        </div>
      ) : (
        <div className={cn(
          "gap-8",
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
        )}>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={cn(
                "template-card overflow-hidden hover:scale-101 transition-all duration-300 cursor-pointer",
                viewMode === "list" && "flex"
              )}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <div className={cn(
                "relative overflow-hidden",
                viewMode === "list" ? "w-48 h-32" : "w-full h-56"
              )}>
                <img
                  src={template.thumbnail}
                  alt={template.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 text-tech-800 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTemplate(template.id);
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t('templates.download')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 text-tech-800 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                    >
                      <Heart className="w-4 h-4 mr-1 fill-red-500 text-red-500" />
                      {t('membership.removeFromCollection')}
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardContent className={cn(
                "p-6",
                viewMode === "list" && "flex-1"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-tech-800 dark:text-tech-200 line-clamp-2">
                    {template.title}
                  </h3>
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    {template.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-tech-600 dark:text-tech-400 mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-tech-500">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {template.views}
                    </span>
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {template.downloads}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {template.isPremium && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{template.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
