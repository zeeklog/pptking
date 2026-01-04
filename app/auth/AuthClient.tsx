'use client';import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { WeChatLogin } from '@/components/WeChatLogin';
import { Zap, Shield, X, Sparkles, Crown, Users, Clock, CheckCircle, ArrowRight, Heart, Star, Award, Target, TrendingUp } from 'lucide-react';

export default function Auth() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'wechat' | 'email'>('wechat');
  const [showTerms, setShowTerms] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      toast({
        title: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: t('auth.userExists'),
            description: t('auth.userExistsDesc'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.checkEmailForVerification'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.registerError'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: t('auth.fillEmailPassword'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: t('auth.loginError'),
            description: t('auth.wrongCredentials'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else if (data.user) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: t('auth.loginError'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* 左侧：登录表单 */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PPTKING
            </CardTitle>
            <CardDescription className="text-tech-600 mt-2">
              {t('auth.loginOrRegister')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Login Method Tabs */}
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'wechat' | 'email')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-purple-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="wechat" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300"
                >
                  {t('auth.wechat')}
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300"
                >
                  {t('auth.emailLogin')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="wechat" className="mt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-tech-600 mb-4">{t('auth.wechatScanLogin')}</div>
                    <WeChatLogin />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="mt-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-purple-100 p-1 rounded-xl mb-4">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300"
                    >
                      {t('auth.login')}
                    </TabsTrigger>
                                          <TabsTrigger 
                        value="register" 
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300"
                      >
                        {t('auth.register')}
                      </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-tech-700">{t('auth.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('auth.emailPlaceholder')}
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-tech-700">密码</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码"
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        disabled={loading}
                      >
                        {loading ? '登录中...' : '邮箱登录'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-tech-700">用户名</Label>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="请输入用户名"
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-tech-700">邮箱</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="请输入邮箱"
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-tech-700">密码</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码（至少6位）"
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                          required
                          minLength={6}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        disabled={loading}
                      >
                        {loading ? '注册中...' : '邮箱注册'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="text-center pt-4 border-t border-purple-100">
            <div className="flex items-center justify-center space-x-2 text-xs text-tech-500">
              <Shield className="w-3 h-3" />
              <span>注册即表示您同意我们的</span>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-purple-600 hover:text-purple-700 underline font-medium"
              >
                服务条款与隐私政策
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* 右侧：功能介绍 */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              欢迎来到PPTKING
            </h1>
            <p className="text-xl text-tech-600 mb-8 leading-relaxed">
              AI驱动的智能PPT制作平台，让您的演示文稿更加专业、高效、美观
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tech-800 mb-2">AI智能生成</h3>
                <p className="text-tech-600">一键生成专业PPT，支持多种风格和主题定制</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tech-800 mb-2">海量模板</h3>
                <p className="text-tech-600">10,000+精美模板，涵盖各个行业和场景</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tech-800 mb-2">团队协作</h3>
                <p className="text-tech-600">支持多人协作，实时同步编辑</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tech-800 mb-2">高效制作</h3>
                <p className="text-tech-600">节省90%的制作时间，专注内容创作</p>
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tech-800">已有10,000+用户选择我们</h3>
                <p className="text-tech-600">来自各行各业的用户都在使用PPTKING</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">50,000+</div>
                <div className="text-sm text-tech-600">生成PPT</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">99.9%</div>
                <div className="text-sm text-tech-600">满意度</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-tech-600">技术支持</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 服务条款弹窗 */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PPTKING 网站服务条款与隐私政策
            </DialogTitle>
            <p className="text-sm text-tech-500 text-center">修订版，2025年8月26日生效</p>
          </DialogHeader>
          
          <div className="prose prose-sm max-w-none text-tech-700 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-tech-800 mb-3">一、引言</h3>
              <p className="leading-relaxed">
                PPTKING 网站（以下简称"本网站"）由 [公司名称]（以下简称"本公司"）依法运营，提供人工智能（AI）自动生成演示文稿（PPT）服务。为明确双方权利义务，规范服务使用，您在使用本网站及相关服务前，须仔细阅读并充分理解本《服务条款与隐私政策》（以下简称"本协议"）。您点击"同意"、注册或实际使用本网站服务，即视为您已充分理解并接受本协议全部条款的约束。若您不同意本协议任何条款，请立即停止使用本网站。本公司不对因您未仔细阅读本协议而产生的任何后果承担责任。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-tech-800 mb-3">二、服务条款</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（一）定义</h4>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>PPTKING 会员：</strong>指按照本网站公布的收费标准支付费用，取得特定会员资格的注册用户。</li>
                    <li><strong>会员服务：</strong>指会员依据所购买的会员类型享有的服务，包括 AI 生成 PPT 的指定次数、模板下载及编辑功能，具体服务内容以本网站实时公示的列表为准。</li>
                    <li><strong>虚拟产品：</strong>指会员服务及相关数字内容，具有无形性、非实物性特征。</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（二）会员服务</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-tech-800 mb-1">1. 开通与支付</h5>
                      <p className="text-sm leading-relaxed">
                        您申请开通会员服务时，须提供真实、准确、完整且合法有效的手机号码、电子邮箱及第三方支付账户等信息，并自行承担因信息不实导致的全部法律责任及后果。本公司不负责验证您提供信息的真实性，且不对因信息不实引发的任何损失或纠纷承担责任。
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-tech-800 mb-1">2. 有效期与续费</h5>
                      <p className="text-sm leading-relaxed">
                        会员服务有效期自成功支付之日起依所购会员选项时长计算（如1个月会员为30日，季享会员为90日，年度会员为365日）。有效期内未使用的服务视为已消费，本公司不提供退款或续费补偿。
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（三）使用规范</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-tech-800 mb-1">1. 内容使用</h5>
                      <p className="text-sm leading-relaxed">
                        您通过本网站生成的 PPT 及相关内容（包括但不限于模板、字体、摄影图、素材、音乐等）仅限个人非商业用途。您不得从事以下行为，否则本公司有权立即终止服务并追究法律责任：
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                        <li>拆分、剥离或单独二次创作模板内素材</li>
                        <li>将内容用于向第三方授权、转让、共享、租售，或允许第三方下载、提取、解压缩</li>
                        <li>将内容用于竞争业务或特定行业的广告或推广项目</li>
                        <li>以冒犯、侵权或违法方式使用内容及其中人物肖像</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（四）退款政策</h4>
                  <p className="text-sm leading-relaxed">
                    会员服务为虚拟产品，一经开通即生效，不支持无理由退款。以下情形可申请退款，但须通过客服（support@pptking.cn）提交申请并提供有效证据：
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                    <li>因本公司原因（如服务故障且无法在48小时内修复，或 AI 生成 PPT 功能存在严重异常）导致您无法使用服务的，经核实后可按未使用服务比例退款。</li>
                    <li>退款申请须在服务开通后7日内提出，逾期不受理。</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-tech-800 mb-3">三、隐私政策</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（一）数据收集</h4>
                  <p className="text-sm leading-relaxed">
                    注册与使用数据：您注册或使用服务时，须提供手机号码、电子邮箱、第三方支付账户信息，并可能生成操作记录、模板使用偏好及浏览历史等数据，用于提供及优化服务。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（二）数据使用</h4>
                  <p className="text-sm leading-relaxed">
                    收集的数据用于以下目的：提供及优化 AI 生成 PPT 服务；基于使用数据进行个性化推荐；法律要求的身份验证、反欺诈检测或合规审查。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（三）数据安全</h4>
                  <p className="text-sm leading-relaxed">
                    本公司采取合理技术和管理措施（如加密传输、访问控制）保护数据，但不对因不可抗力（如黑客攻击）或您自身原因（如设备安全问题）导致的数据泄露、篡改或丢失负责。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-tech-800 mb-3">四、其他条款</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（一）协议变更</h4>
                  <p className="text-sm leading-relaxed">
                    本公司有权根据业务需要或法律法规变化单方面修订本协议。修订内容将通过网站公告或站内信提前通知，通知方式及时间由本公司决定。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（二）法律适用与争议解决</h4>
                  <p className="text-sm leading-relaxed">
                    本协议适用中华人民共和国法律（不含冲突法）。因本协议或服务产生的争议，双方可协商解决；协商不成的，任何一方须向本公司住所地有管辖权的人民法院提起诉讼。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-tech-800 mb-2">（三）联系方式</h4>
                  <p className="text-sm leading-relaxed">
                    如有疑问，可通过以下方式联系本公司：<br />
                    邮箱：support@pptking.cn<br />
                    电话：0755-32867416
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button 
              onClick={() => setShowTerms(false)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              我已阅读并同意
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}