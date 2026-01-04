'use client';import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateCard } from "./TemplateCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { Skeleton } from "@/components/ui/skeleton";

export function TemplateSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const { templates, favorites, loading, handleFavorite, handleDownload, handlePreview } = useTemplates();

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-tech-400" />
        <Input
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-glass focus:border-purple-500 focus:ring-purple-500/20"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-purple-100 p-1 rounded-xl">
          <TabsTrigger 
            value="all"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
          >
            全部模版
          </TabsTrigger>
          <TabsTrigger 
            value="recent"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
          >
            最近更新
          </TabsTrigger>
          <TabsTrigger 
            value="favorites"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
          >
            收藏夹
          </TabsTrigger>
          <TabsTrigger 
            value="shared"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
          >
            共享作品
          </TabsTrigger>
          <TabsTrigger 
            value="mine"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
          >
            我的创作
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  id={template.id}
                  title={template.title}
                  thumbnail={template.thumbnail_url || '/placeholder.svg'}
                  isNew={template.is_new}
                  isCopyright={template.is_copyright}
                  downloadCount={template.download_count}
                  designer={template.designer_name}
                  isFavorited={favorites.has(template.id)}
                  onFavorite={handleFavorite}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates
                .filter(t => t.is_new)
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    title={template.title}
                    thumbnail={template.thumbnail_url || '/placeholder.svg'}
                    isNew={template.is_new}
                    isCopyright={template.is_copyright}
                    downloadCount={template.download_count}
                    designer={template.designer_name}
                    isFavorited={favorites.has(template.id)}
                    onFavorite={handleFavorite}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates
                .filter(t => favorites.has(t.id))
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    title={template.title}
                    thumbnail={template.thumbnail_url || '/placeholder.svg'}
                    isNew={template.is_new}
                    isCopyright={template.is_copyright}
                    downloadCount={template.download_count}
                    designer={template.designer_name}
                    isFavorited={true}
                    onFavorite={handleFavorite}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <div className="text-center py-12 text-tech-500">
            <p>暂无共享作品</p>
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <div className="text-center py-12 text-tech-500">
            <p>暂无个人创作</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}