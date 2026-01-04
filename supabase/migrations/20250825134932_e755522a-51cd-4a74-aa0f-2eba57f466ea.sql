-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create membership tiers table
CREATE TABLE public.membership_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  ai_points_monthly INTEGER,
  download_limit_daily INTEGER,
  has_commercial_license BOOLEAN DEFAULT false,
  cloud_storage_gb INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user memberships table
CREATE TABLE public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.membership_tiers(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  download_url TEXT,
  category TEXT,
  style TEXT,
  industry TEXT,
  is_new BOOLEAN DEFAULT false,
  is_copyright BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  designer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Create downloads table
CREATE TABLE public.downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for membership tiers (readable by all)
CREATE POLICY "Membership tiers are viewable by everyone" ON public.membership_tiers
  FOR SELECT USING (true);

-- Create policies for user memberships
CREATE POLICY "Users can view their own memberships" ON public.user_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" ON public.user_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for templates (viewable by all)
CREATE POLICY "Templates are viewable by everyone" ON public.templates
  FOR SELECT USING (true);

-- Create policies for user favorites
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for downloads
CREATE POLICY "Users can view their own downloads" ON public.downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can record their own downloads" ON public.downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default membership tiers
INSERT INTO public.membership_tiers (name, price_monthly, price_yearly, ai_points_monthly, download_limit_daily, has_commercial_license, cloud_storage_gb, description) VALUES
('免费用户', 0, 0, 30, 10, false, 0, '基础功能，适合个人学习使用'),
('个人会员', 7.86, 78.60, 300, -1, true, 2, '专业功能，支持商用授权'),
('企业会员', 21.58, 215.80, 1000, -1, true, 5, '团队协作，企业级功能'),
('企业定制', 0, 0, -1, -1, true, -1, '私有化部署，定制化服务');

-- Insert sample templates
INSERT INTO public.templates (title, thumbnail_url, category, style, industry, is_new, is_copyright, download_count, designer_name, description) VALUES
('商业计划书模板', '/placeholder.svg', '商务', '专业', '通用', true, true, 1234, 'Liang', '专业的商业计划书模板，适合创业展示'),
('工作总结汇报PPT', '/placeholder.svg', '工作', '简约', '通用', false, true, 856, 'iRis', '年终总结汇报专用模板'),
('产品发布会演示模板', '/placeholder.svg', '产品', '科技', 'IT互联网', true, false, 2341, 'Liang', '产品发布会专业演示模板'),
('教育培训课件模板', '/placeholder.svg', '教育', '清新', '教育', false, true, 567, 'iRis', '教育培训专用课件模板'),
('年终述职报告模板', '/placeholder.svg', '工作', '商务', '通用', false, false, 1789, 'Liang', '年终述职报告专业模板'),
('项目提案演示模板', '/placeholder.svg', '项目', '创意', '通用', true, true, 934, 'iRis', '项目提案专业演示模板');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON public.user_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();