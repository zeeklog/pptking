-- Add WeChat and full_name fields to profiles table
-- 在 Supabase Dashboard > SQL Editor 中运行此脚本

-- 添加缺失的字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS wechat_openid TEXT,
ADD COLUMN IF NOT EXISTS wechat_unionid TEXT,
ADD COLUMN IF NOT EXISTS wechat_bound BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wechat_info JSONB;

-- 为 wechat_openid 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON public.profiles(wechat_openid);

-- 更新 handle_new_user 函数以包含 full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- 验证更改
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
