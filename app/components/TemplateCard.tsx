'use client';import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface TemplateCardProps {
  id: string;
  title: string;
  thumbnail: string;
  isNew?: boolean;
  isCopyright?: boolean;
  downloadCount?: number;
  isFavorited?: boolean;
  designer?: string;
  onFavorite?: (id: string) => void;
  onDownload?: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function TemplateCard({
  id,
  title,
  thumbnail,
  isNew = false,
  isCopyright = false,
  downloadCount,
  isFavorited = false,
  designer,
  onFavorite,
  onDownload,
  onPreview
}: TemplateCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="template-card hover-lift group cursor-pointer shadow-purple-md hover:shadow-purple-lg overflow-hidden transition-all duration-300">
      <div className="relative">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-purple-100 overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isNew && (
            <Badge className="bg-gradient-primary text-white text-xs px-2 py-1 shadow-purple-sm">
              {t('common.new')}
            </Badge>
          )}
          {isCopyright && (
            <Badge className="bg-warning-500 text-white text-xs px-2 py-1 shadow-purple-sm">
              {t('templates.copyright')}
            </Badge>
          )}
        </div>
        
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white shadow-purple-sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(id);
            }}
          >
            <Eye className="w-4 h-4 text-purple-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white shadow-purple-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.(id);
            }}
          >
            <Download className="w-4 h-4 text-purple-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white shadow-purple-sm"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(id);
            }}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-error-500 text-error-500")} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-sm text-tech-800 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-tech-500">
          {designer && (
            <span>By {designer}</span>
          )}
          {downloadCount && (
            <span>{downloadCount} {t('templates.downloads')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}