'use client';import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Sparkles, Shield, Cloud, Users, ArrowRight, Target, Award, TrendingUp, Heart, Clock, CheckCircle, Gift, Rocket, Diamond, MessageCircle, HelpCircle, ThumbsUp, Globe, Lock, Zap as Lightning, Palette, Download, Share2, Users as Team, Building, Headphones, Shield as Security, BarChart3, Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MembershipTier {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  ai_points_monthly: number;
  download_limit_daily: number;
  has_commercial_license: boolean;
  cloud_storage_gb: number;
  description: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function Pricing() {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const { user } = useAuth();

  // 客户评价数据
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: t('pricing.testimonials.sarah.name'),
      role: t('pricing.testimonials.sarah.role'),
      company: t('pricing.testimonials.sarah.company'),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: t('pricing.testimonials.sarah.content'),
      rating: 5
    },
    {
      id: 2,
      name: t('pricing.testimonials.michael.name'),
      role: t('pricing.testimonials.michael.role'),
      company: t('pricing.testimonials.michael.company'),
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content: t('pricing.testimonials.michael.content'),
      rating: 5
    },
    {
      id: 3,
      name: t('pricing.testimonials.emma.name'),
      role: t('pricing.testimonials.emma.role'),
      company: t('pricing.testimonials.emma.company'),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: t('pricing.testimonials.emma.content'),
      rating: 5
    }
  ];

  // 常见问题数据
  const faqs: FAQ[] = [
    {
      id: 1,
      question: t('pricing.faqQuestions.q1'),
      answer: t('pricing.faqQuestions.a1')
    },
    {
      id: 2,
      question: t('pricing.faqQuestions.q2'),
      answer: t('pricing.faqQuestions.a2')
    },
    {
      id: 3,
      question: t('pricing.faqQuestions.q3'),
      answer: t('pricing.faqQuestions.a3')
    },
    {
      id: 4,
      question: t('pricing.faqQuestions.q4'),
      answer: t('pricing.faqQuestions.a4')
    },
    {
      id: 5,
      question: t('pricing.faqQuestions.q5'),
      answer: t('pricing.faqQuestions.a5')
    }
  ];

  useEffect(() => {
    fetchMembershipTiers();
    setIsVisible(true);
  }, []);

  const fetchMembershipTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      toast({
        title: t('pricing.errors.loadFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier: MembershipTier) => {
    if (!user) {
      toast({
        title: t('pricing.errors.loginRequired'),
        description: t('pricing.errors.loginRequiredDesc'),
        variant: "destructive",
      });
      // 使用 window.location 替代 navigate
      window.location.href = '/auth';
      return;
    }

    toast({
      title: t('pricing.errors.featureInDevelopment'),
      description: t('pricing.errors.featureInDevelopmentDesc', { plan: tier.name }),
    });
  };

  const getTierIcon = (tierName: string) => {
    if (tierName.includes('免费')) return <Sparkles className="w-6 h-6" />;
    if (tierName.includes('个人')) return <Star className="w-6 h-6" />;
    if (tierName.includes('企业')) return <Crown className="w-6 h-6" />;
    if (tierName.includes('定制')) return <Diamond className="w-6 h-6" />;
    return null;
  };

  const getTierColor = (tierName: string) => {
    if (tierName.includes('免费')) return 'from-gray-400 to-gray-600';
    if (tierName.includes('个人')) return 'from-purple-500 to-pink-500';
    if (tierName.includes('企业')) return 'from-blue-500 to-purple-600';
    if (tierName.includes('定制')) return 'from-orange-500 to-red-500';
    return 'from-purple-500 to-pink-500';
  };

  const getPrice = (tier: MembershipTier) => {
    if (tier.price_monthly === 0) return t('pricing.free');
    const price = isYearly ? tier.price_yearly : tier.price_monthly;
    return `¥${price.toFixed(2)}`;
  };

  const getPeriod = (tier: MembershipTier) => {
    if (tier.price_monthly === 0) return '';
    return isYearly ? t('pricing.perYear') : t('pricing.perMonth');
  };

  const getSavings = (tier?: MembershipTier) => {
    if (!tier || tier.price_monthly === 0) return 0;
    const yearlySavings = (tier.price_monthly * 12) - tier.price_yearly;
    return Math.round((yearlySavings / (tier.price_monthly * 12)) * 100);
  };

  const toggleFAQ = (id: number) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-600 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <p className="mt-6 text-tech-600 font-medium">{t('pricing.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* 页面标题区域 */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-lg font-medium mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <Crown className="w-6 h-6 mr-2 animate-pulse" />
            {t('pricing.title')}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {t('pricing.hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl text-tech-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            {t('pricing.hero.description')}
          </p>
          
          <p className="text-tech-500 mb-12">
            {t('pricing.hero.userCount')} <span className="font-semibold text-purple-600">10,000+</span> {t('pricing.hero.userCountSuffix')}
          </p>
          
          {/* 切换按钮 */}
          <div className="flex items-center justify-center space-x-6 mb-12">
            <span className={`text-lg font-medium transition-colors duration-300 ${!isYearly ? 'text-tech-800' : 'text-tech-500'}`}>
              {t('pricing.monthly')}
            </span>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsYearly(!isYearly)}
              className="relative bg-white border-2 border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className={`w-16 h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full relative transition-all duration-300 ${isYearly ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}>
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-lg ${isYearly ? 'left-9' : 'left-1'}`} />
              </div>
            </Button>
            
            <div className="flex items-center space-x-3">
              <span className={`text-lg font-medium transition-colors duration-300 ${isYearly ? 'text-tech-800' : 'text-tech-500'}`}>
                {t('pricing.yearly')}
              </span>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg animate-pulse">
                <Gift className="w-3 h-3 mr-1" />
                {t('pricing.save')}{getSavings(tiers[1] || tiers[0])}%
              </Badge>
            </div>
          </div>
        </div>

        {/* 会员卡片网格 */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {tiers.map((tier, index) => (
            <Card 
              key={tier.id} 
              className={`relative group hover:scale-105 transition-all duration-500 hover:shadow-2xl ${
                tier.name.includes('个人') 
                  ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 text-white shadow-2xl border-0' 
                  : 'bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl hover:shadow-2xl'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* 推荐标签 */}
              {tier.name.includes('个人') && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg px-4 py-2 text-sm font-semibold animate-bounce">
                    <Star className="w-3 h-3 mr-1" />
                    {t('pricing.mostPopular')}
                  </Badge>
                </div>
              )}
              
              {/* 免费标签 */}
              {tier.name.includes('免费') && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg px-4 py-2 text-sm font-semibold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('pricing.freeTrial')}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className={`p-3 rounded-full ${tier.name.includes('个人') ? 'bg-white/20' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
                    {getTierIcon(tier.name)}
                  </div>
                  <CardTitle className={`text-2xl font-bold ${tier.name.includes('个人') ? 'text-white' : 'text-tech-800'}`}>
                    {tier.name}
                  </CardTitle>
                </div>
                
                <div className="mb-4">
                  <div className={`text-4xl font-bold ${tier.name.includes('个人') ? 'text-white' : 'text-tech-800'}`}>
                    {getPrice(tier)}
                    <span className={`text-lg font-normal ${tier.name.includes('个人') ? 'text-white/80' : 'text-tech-500'}`}>
                      {getPeriod(tier)}
                    </span>
                  </div>
                  {isYearly && tier.price_monthly > 0 && (
                    <div className={`text-sm ${tier.name.includes('个人') ? 'text-white/70' : 'text-tech-500'}`}>
                      {t('pricing.equivalentTo')} ¥{(tier.price_yearly / 12).toFixed(2)}{t('pricing.units.perMonth')}
                    </div>
                  )}
                </div>
                
                <CardDescription className={`text-base ${tier.name.includes('个人') ? 'text-white/80' : 'text-tech-600'}`}>
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${tier.name.includes('个人') ? 'bg-white/20' : 'bg-green-100'}`}>
                      <Check className={`w-4 h-4 ${tier.name.includes('个人') ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <span className={`text-sm ${tier.name.includes('个人') ? 'text-white/90' : 'text-tech-700'}`}>
                      <span className="font-semibold">{tier.ai_points_monthly === -1 ? t('pricing.unlimited') : tier.ai_points_monthly}</span> {t('pricing.aiPointsPerMonth')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${tier.name.includes('个人') ? 'bg-white/20' : 'bg-green-100'}`}>
                      <Check className={`w-4 h-4 ${tier.name.includes('个人') ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <span className={`text-sm ${tier.name.includes('个人') ? 'text-white/90' : 'text-tech-700'}`}>
                      <span className="font-semibold">{tier.download_limit_daily === -1 ? t('pricing.unlimited') : `${tier.download_limit_daily}${t('pricing.units.perDay')}`}</span> {t('pricing.templateDownloads')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${tier.name.includes('个人') ? 'bg-white/20' : 'bg-green-100'}`}>
                      <Check className={`w-4 h-4 ${tier.name.includes('个人') ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <span className={`text-sm ${tier.name.includes('个人') ? 'text-white/90' : 'text-tech-700'}`}>
                      <span className="font-semibold">{tier.cloud_storage_gb === -1 ? t('pricing.unlimited') : tier.cloud_storage_gb === 0 ? t('pricing.units.none') : `${tier.cloud_storage_gb}GB`}</span> {t('pricing.cloudStorage')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {tier.has_commercial_license ? (
                      <div className={`p-1 rounded-full ${tier.name.includes('个人') ? 'bg-white/20' : 'bg-green-100'}`}>
                        <Check className={`w-4 h-4 ${tier.name.includes('个人') ? 'text-white' : 'text-green-600'}`} />
                      </div>
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                    <span className={`text-sm ${!tier.has_commercial_license ? (tier.name.includes('个人') ? 'text-white/60 line-through' : 'text-tech-400 line-through') : (tier.name.includes('个人') ? 'text-white/90' : 'text-tech-700')}`}>
                      {tier.has_commercial_license ? t('pricing.commercialLicense') : t('pricing.commercialLicense')}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button 
                  className={`w-full h-12 text-base font-semibold transition-all duration-300 group ${
                    tier.name.includes('个人') 
                      ? 'bg-white text-purple-600 hover:bg-white/90 hover:scale-105 shadow-lg' 
                      : tier.name.includes('免费')
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border-2 border-purple-200 hover:from-purple-200 hover:to-pink-200'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 shadow-lg'
                  }`}
                  onClick={() => handleSubscribe(tier)}
                  disabled={tier.name.includes('免费')}
                >
                  <span className="flex items-center">
                    {tier.name.includes('免费') ? t('pricing.currentPlan') : tier.name.includes('定制') ? t('pricing.contactSales') : t('pricing.buyNow')}
                    {!tier.name.includes('免费') && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 特色功能展示 */}
        <div className={`mb-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.whyChooseUs')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.whyChooseUsDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Lightning className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.aiGeneration')}</h3>
                  <p className="text-tech-600">{t('pricing.aiGenerationDesc')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.templateLibrary')}</h3>
                  <p className="text-tech-600">{t('pricing.templateLibraryDesc')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Security className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.secureReliable')}</h3>
                  <p className="text-tech-600">{t('pricing.secureReliableDesc')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.professionalSupport')}</h3>
                  <p className="text-tech-600">{t('pricing.professionalSupportDesc')}</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&crop=center" 
                alt={t('pricing.altTexts.pptDemo')} 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-tech-700">{t('pricing.realtimeAI')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 客户评价区域 */}
        <div className={`mb-20 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.userReviews')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.userReviewsDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={`${testimonial.name} ${t('common.avatar')}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-tech-800">{testimonial.name}</h4>
                      <p className="text-sm text-tech-600">{testimonial.role} · {testimonial.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-tech-700 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 成功案例展示 */}
        <div className={`mb-20 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.successCases.title')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.successCases.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                <img 
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop&crop=center" 
                  alt={t('pricing.altTexts.businessPresentation')} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold">{t('pricing.successCases.business.title')}</h3>
                  <p className="text-sm opacity-90">{t('pricing.successCases.business.subtitle')}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-tech-700">{t('pricing.successCases.business.description')}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-green-500 to-teal-600">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop&crop=center" 
                  alt={t('pricing.altTexts.educationalContent')} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold">{t('pricing.successCases.education.title')}</h3>
                  <p className="text-sm opacity-90">{t('pricing.successCases.education.subtitle')}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-tech-700">{t('pricing.successCases.education.description')}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-orange-500 to-red-600">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=center" 
                  alt={t('pricing.altTexts.marketingCampaign')} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold">{t('pricing.successCases.marketing.title')}</h3>
                  <p className="text-sm opacity-90">{t('pricing.successCases.marketing.subtitle')}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-tech-700">{t('pricing.successCases.marketing.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 功能对比区域 */}
        <div className={`mb-20 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.featureComparison.title')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.featureComparison.description')}
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-2xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.basicFeatures')}</h3>
                      <p className="text-tech-600">{t('pricing.basicFeaturesDesc')}</p>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.aiGeneratePPT')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.smartTextPolish')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.basicTemplateLibrary')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.onlineEditTools')}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                        <Crown className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.professionalFeatures')}</h3>
                      <p className="text-tech-600">{t('pricing.professionalFeaturesDesc')}</p>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.unlimitedAIGeneration')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.commercialLicense')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.cloudSync')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.prioritySupport')}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                        <Diamond className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-tech-800 mb-2">{t('pricing.enterpriseFeatures')}</h3>
                      <p className="text-tech-600">{t('pricing.enterpriseFeaturesDesc')}</p>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.teamCollaboration')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.brandCustomization')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.apiInterface')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-tech-700">{t('pricing.dedicatedManager')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 常见问题区域 */}
        <div className={`mb-20 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.faq.title')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.faq.description')}
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id} className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <button
                      className="w-full text-left flex items-center justify-between"
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <h3 className="text-lg font-semibold text-tech-800">{faq.question}</h3>
                      <div className={`transform transition-transform duration-300 ${activeFAQ === faq.id ? 'rotate-180' : ''}`}>
                        <ArrowRight className="w-5 h-5 text-purple-600" />
                      </div>
                    </button>
                    {activeFAQ === faq.id && (
                      <div className="mt-4 pt-4 border-t border-purple-100">
                        <p className="text-tech-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* 统计数据区域 */}
        <div className={`mb-20 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('pricing.userTrustUs')}
            </h2>
            <p className="text-xl text-tech-600 max-w-2xl mx-auto">
              {t('pricing.userTrustUsDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
              <div className="text-tech-600">{t('pricing.activeUsers')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">50,000+</div>
              <div className="text-tech-600">{t('pricing.generatedPPT')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-tech-600">{t('pricing.serviceAvailability')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-tech-600">{t('pricing.technicalSupport')}</div>
            </div>
          </div>
        </div>

        {/* 行动召唤区域 */}
        <div className={`text-center transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold mb-4">{t('pricing.readyToStart')}</h2>
              <p className="text-xl mb-8 opacity-90">{t('pricing.readyToStartDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => window.location.href = '/auth'}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('pricing.freeStart')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}