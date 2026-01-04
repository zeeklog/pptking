-- Add WeChat and full_name fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS wechat_openid TEXT,
ADD COLUMN IF NOT EXISTS wechat_unionid TEXT,
ADD COLUMN IF NOT EXISTS wechat_bound BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wechat_info JSONB;

-- Create index for wechat_openid for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON public.profiles(wechat_openid);

-- Update the handle_new_user function to include full_name
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
