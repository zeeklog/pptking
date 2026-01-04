import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Template {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  download_url?: string;
  category?: string;
  style?: string;
  industry?: string;
  is_new?: boolean;
  is_copyright?: boolean;
  is_premium?: boolean;
  download_count?: number;
  designer_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "加载模板失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('template_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map(item => item.template_id) || []);
      setFavorites(favoriteIds);
    } catch (error: any) {
      console.error('Error fetching favorites:', error.message);
    }
  };

  const handleFavorite = async (templateId: string) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "收藏功能需要登录后使用",
        variant: "destructive",
      });
      return;
    }

    const isFavorited = favorites.has(templateId);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('template_id', templateId);

        if (error) throw error;
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(templateId);
          return newFavorites;
        });
        
        toast({
          title: "已取消收藏",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, template_id: templateId }]);

        if (error) throw error;
        
        setFavorites(prev => new Set([...prev, templateId]));
        
        toast({
          title: "已添加收藏",
        });
      }
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (templateId: string) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "下载功能需要登录后使用",
        variant: "destructive",
      });
      return;
    }

    try {
      // Record the download
      const { error } = await supabase
        .from('downloads')
        .insert([{ user_id: user.id, template_id: templateId }]);

      if (error) throw error;

      // Update download count
      const { data: templateData, error: fetchError } = await supabase
        .from('templates')
        .select('download_count')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('templates')
        .update({ download_count: (templateData.download_count || 0) + 1 })
        .eq('id', templateId);

      if (updateError) throw updateError;

      toast({
        title: "下载成功",
        description: "模板已开始下载",
      });

      // In a real app, this would trigger the actual file download
      // For now, we'll just show the success message
    } catch (error: any) {
      toast({
        title: "下载失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePreview = (templateId: string) => {
    // In a real app, this would open a preview modal or navigate to preview page
    toast({
      title: "预览功能",
      description: "预览功能开发中...",
    });
  };

  return {
    templates,
    favorites,
    loading,
    handleFavorite,
    handleDownload,
    handlePreview,
    refetch: fetchTemplates,
  };
};