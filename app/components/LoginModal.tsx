'use client';import { useState, useEffect } from 'react';
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
import { Zap, Shield } from 'lucide-react';
import { Z_INDEX } from '@/ppt-edit/constants/z-index';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'wechat' | 'email'>('wechat');
  const [showTerms, setShowTerms] = useState(false);
  const { user } = useAuth();

  // 如果用户已登录，关闭弹窗
  useEffect(() => {
    if (user && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, onClose, onSuccess]);

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
      // 先注册用户
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          toast({
            title: t('auth.userExists'),
            description: t('auth.userExistsDesc'),
            variant: "destructive",
          });
        } else {
          throw signUpError;
        }
      } else if (signUpData.user) {
        // 注册成功，立即尝试登录
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // 如果自动登录失败，提示用户手动登录
          toast({
            title: t('auth.registerSuccess'),
            description: t('auth.manualLogin'),
          });
        } else if (signInData.user) {
          // 自动登录成功
          toast({
            title: t('auth.registerAndLoginSuccess'),
            description: t('auth.welcomeMessage'),
          });
          onSuccess?.();
        }
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
        onSuccess?.();
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose} style={Z_INDEX.DIALOG}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">登录或注册</DialogTitle>
          <Card className="w-full shadow-purple-lg border-0 bg-white/95 backdrop-blur-sm relative">
            <CardHeader className="text-center pb-6 relative">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-purple-md">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gradient-primary">
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
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-purple-sm data-[state=active]:text-purple-600"
                  >
                    {t('auth.wechat')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="email" 
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-purple-sm data-[state=active]:text-purple-600"
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
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-purple-sm data-[state=active]:text-purple-600"
                      >
                        {t('auth.login')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register" 
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-purple-sm data-[state=active]:text-purple-600"
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
                            className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-tech-700">{t('auth.password')}</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full btn-primary shadow-purple-md hover:shadow-purple-lg"
                          disabled={loading}
                        >
                          {loading ? t('auth.loggingIn') : t('auth.emailLogin')}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium text-tech-700">{t('auth.username')}</Label>
                          <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t('auth.usernamePlaceholder')}
                            className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-tech-700">{t('auth.email')}</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.emailPlaceholder')}
                            className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-tech-700">{t('auth.password')}</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                            required
                            minLength={6}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full btn-primary shadow-purple-md hover:shadow-purple-lg"
                          disabled={loading}
                        >
                          {loading ? t('auth.registering') : t('auth.emailRegister')}
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
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  服务条款与隐私政策
                </button>
              </div>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>

      {/* 服务条款与隐私政策弹窗 */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-600 text-center">
              PPTKING 网站服务条款与隐私政策
            </DialogTitle>
            <p className="text-sm text-tech-600 text-center mt-2">
              修订版，2025年8月26日生效
            </p>
          </DialogHeader>
          <div className="prose prose-sm max-w-none space-y-6">
            {/* 一、引言 */}
            <section className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400">
              <h3 className="text-lg font-semibold text-purple-700 mb-3">一、引言</h3>
              <p className="text-tech-700 leading-relaxed">
                PPTKING 网站（以下简称"本网站"）由 [公司名称]（以下简称"本公司"）依法运营，提供人工智能（AI）自动生成演示文稿（PPT）服务。为明确双方权利义务，规范服务使用，您在使用本网站及相关服务前，须仔细阅读并充分理解本《服务条款与隐私政策》（以下简称"本协议"）。您点击"同意"、注册或实际使用本网站服务，即视为您已充分理解并接受本协议全部条款的约束。若您不同意本协议任何条款，请立即停止使用本网站。本公司不对因您未仔细阅读本协议而产生的任何后果承担责任。
              </p>
            </section>

            {/* 二、服务条款 */}
            <section>
              <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-purple-200 pb-2">二、服务条款</h3>
              
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-700 mb-2">（一）定义</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>PPTKING 会员：</strong>指按照本网站公布的收费标准支付费用，取得特定会员资格的注册用户。
                    </div>
                    <div>
                      <strong>会员服务：</strong>指会员依据所购买的会员类型享有的服务，包括 AI 生成 PPT 的指定次数、模板下载及编辑功能，具体服务内容以本网站实时公示的列表为准。本公司有权在法律法规允许范围内单方面调整服务内容，调整前将通过网站公告或站内信提前通知。
                    </div>
                    <div>
                      <strong>虚拟产品：</strong>指会员服务及相关数字内容，具有无形性、非实物性特征。
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3">（二）会员服务</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-blue-600 mb-2">1. 开通与支付</h5>
                      <p className="text-sm text-tech-700 leading-relaxed">
                        您申请开通会员服务时，须提供真实、准确、完整且合法有效的手机号码、电子邮箱及第三方支付账户等信息，并自行承担因信息不实导致的全部法律责任及后果。本公司不负责验证您提供信息的真实性，且不对因信息不实引发的任何损失或纠纷承担责任。本公司有权根据市场或运营需求调整会员服务定价，调整仅适用于未来购买的服务，不影响已支付的服务。会员服务为虚拟产品，一经开通不可退货、换货或兑换现金，法律法规另有规定的除外。会员服务仅限您本人使用，禁止用于商业买卖、置换、抵押或其他非个人用途。通过非本公司官方渠道获取的会员服务及其衍生服务不受本协议保护，本公司有权随时中止或终止相关服务，恕不另行通知。
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-blue-600 mb-2">2. 有效期与续费</h5>
                      <p className="text-sm text-tech-700 leading-relaxed">
                        会员服务有效期自成功支付之日起依所购会员选项时长计算（如1个月会员为30日，季享会员为90日，年度会员为365日）。有效期内未使用的服务视为已消费，本公司不提供退款或续费补偿。续费须在有效期届满前由您主动通过网站手动购买，本公司不提供自动续费服务。本公司可通过站内信或电子邮件提醒续费，但不对未及时续费导致的服务中断承担责任。
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-blue-600 mb-2">3. 使用限制</h5>
                      <p className="text-sm text-tech-700 leading-relaxed">
                        您确认具备与使用行为相适应的民事行为能力。若不具备，须在法定监护人协助下完成注册及使用，否则您应自行承担因此产生的一切后果。本公司可通过站内信、电子邮件、短信或电话（0755-32867416）向您发送会员活动或服务相关信息，您可通过联系客服（support@pptking.cn）要求停止接收，但本公司不对因您未及时取消通知导致的后果负责。会员服务仅限您本人使用，禁止非法获利、转让或转借。本公司有权基于合理怀疑（包括但不限于系统日志、用户举报或异常使用记录）暂停或终止您的会员资格，且不予退款。若您的行为造成本公司损失，本公司保留依法追偿的权利。本公司保留在法律法规允许范围内拒绝会员申请或调整服务内容的权利，且无须提供理由或提前通知。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3">（三）使用规范</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-green-600 mb-2">1. 内容使用</h5>
                      <p className="text-sm text-tech-700 leading-relaxed mb-3">
                        您通过本网站生成的 PPT 及相关内容（包括但不限于模板、字体、摄影图、素材、音乐等）仅限个人非商业用途。您不得从事以下行为，否则本公司有权立即终止服务并追究法律责任：
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-tech-700 ml-4">
                        <li>拆分、剥离或单独二次创作模板内素材；</li>
                        <li>将内容用于向第三方授权、转让、共享、租售，或允许第三方下载、提取、解压缩；</li>
                        <li>将内容用于竞争业务或特定行业（包括但不限于烟草、酒精、药物、整容、医疗保健产品等）的广告或推广项目；</li>
                        <li>以冒犯、侵权或违法方式使用内容及其中人物肖像（包括但不限于色情、暗示非法行为或政治性代言）；</li>
                        <li>将内容制成转售商品（如模板、壁纸）或用于户外广告、商标商号等。</li>
                      </ul>
                      <p className="text-sm text-tech-700 leading-relaxed mt-3">
                        如需上述用途，须事先联系本公司（support@pptking.cn）并签订书面许可协议。本公司对未经许可的使用行为不承担任何责任。
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-green-600 mb-2">2. 行为准则</h5>
                      <p className="text-sm text-tech-700 leading-relaxed mb-3">
                        您在使用本网站服务时，须严格遵守中华人民共和国法律法规及政策，禁止发布或传播以下内容：
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-tech-700 ml-4">
                        <li>反对宪法基本原则、危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家荣誉和利益；</li>
                        <li>煽动民族仇恨或歧视、破坏宗教政策；</li>
                        <li>传播谣言、淫秽色情、暴力恐怖、侮辱诽谤他人等违法违规信息。</li>
                      </ul>
                      <p className="text-sm text-tech-700 leading-relaxed mt-3">
                        违反上述规定的，本公司有权立即终止服务，删除相关内容，并向相关机关报告。您应自行承担因此产生的一切法律后果。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-700 mb-3">（四）退款政策</h4>
                  <div className="bg-red-100 p-3 rounded border-l-4 border-red-500 mb-3">
                    <p className="text-red-800 font-semibold text-sm">
                      <strong>重要声明：</strong>会员服务为虚拟产品，一经开通即生效，不支持无理由退款。
                    </p>
                  </div>
                  <p className="text-sm text-tech-700 leading-relaxed mb-3">
                    以下情形可申请退款，但须通过客服（support@pptking.cn）提交申请并提供有效证据：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-tech-700 ml-4 mb-3">
                    <li>因本公司原因（如服务故障且无法在48小时内修复，或 AI 生成 PPT 功能存在严重异常）导致您无法使用服务的，经核实后可按未使用服务比例退款。</li>
                  </ul>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    退款申请须在服务开通后7日内提出，逾期不受理。退款处理时间由本公司根据实际情况确定，且不保证具体时限。本公司保留核实服务使用情况及拒绝不合理退款申请的权利。所有退款以原支付渠道退回，您自行承担因支付渠道产生的费用或延误。
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-700 mb-3">（五）投诉处理</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    若您对本网站服务有异议，可通过客服邮箱（support@pptking.cn）或电话（0755-32867416）提交投诉，须提供投诉事项、证据及联系方式。本公司有权根据实际情况决定是否受理及处理方式，并将视情况通过电子邮件或电话回复。投诉处理不保证具体时限，您对处理结果不满意的，可依法向监管部门投诉或提起诉讼。本公司不对投诉处理结果承担进一步责任。
                  </p>
                </div>
              </div>
            </section>

            {/* 三、隐私政策 */}
            <section>
              <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-purple-200 pb-2">三、隐私政策</h3>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-700 mb-3">（一）数据收集</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>注册与使用数据：</strong>您注册或使用服务时，须提供手机号码、电子邮箱、第三方支付账户信息，并可能生成操作记录、模板使用偏好及浏览历史等数据，用于提供及优化服务。您确认提供信息的真实性，并自行承担因信息不实导致的后果。本公司不对未提供同意或未完成注册导致的服务不可用负责。
                    </div>
                    <div>
                      <strong>设备与网络数据：</strong>本公司可能收集设备信息（包括设备型号、操作系统、浏览器类型）及网络信息（包括 IP 地址、网络连接状态），用于维护网站安全及运行。本公司不对因您设备或网络问题导致的服务中断负责。
                    </div>
                    <div>
                      <strong>限制：</strong>本公司不主动收集敏感个人信息（如种族、健康数据等），除非法律要求或您主动提供。您应自行评估提供敏感信息的风险。
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-teal-700 mb-3">（二）数据使用</h4>
                  <p className="text-sm text-tech-700 leading-relaxed mb-3">收集的数据用于以下目的：</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-tech-700 ml-4">
                    <li>提供及优化 AI 生成 PPT 服务；</li>
                    <li>基于使用数据进行个性化推荐（需您通过设置页面同意）；</li>
                    <li>法律要求的身份验证、反欺诈检测或合规审查。</li>
                  </ul>
                  <p className="text-sm text-tech-700 leading-relaxed mt-3">
                    本公司有权在法律法规允许范围内决定数据使用方式，并不对数据使用效果或用户体验承担责任。您可通过设置页面管理个性化推荐设置，但关闭可能影响服务功能。
                  </p>
                </div>

                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-700 mb-3">（三）数据存储</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>存储位置：</strong>数据存储于中国境内服务器，符合相关法律法规要求。若需跨境传输，本公司有权决定是否进行，并不保证提前通知。
                    </div>
                    <div>
                      <strong>存储期限：</strong>数据在实现本协议目的的最短时间内保留（如会员服务记录保留2年以满足审计要求），之后可能删除或匿名化。本公司不对数据删除的后果承担责任。
                    </div>
                    <div>
                      <strong>数据销毁：</strong>本公司有权决定销毁方式，不保证数据完全不可恢复。
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-3">（四）数据安全</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    本公司采取合理技术和管理措施（如加密传输、访问控制）保护数据，但不对因不可抗力（如黑客攻击）或您自身原因（如设备安全问题）导致的数据泄露、篡改或丢失负责。若发生数据安全事件，本公司将根据法律法规决定是否通知您及监管部门，且不对通知时限或后果承担责任。
                  </p>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-pink-700 mb-3">（五）第三方共享与披露</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>共享：</strong>为提供服务，本公司可能向第三方（如支付或技术服务提供商）共享必要数据，共享范围及方式由本公司自行决定。第三方须遵守数据保护义务，但本公司不对第三方行为负责。
                    </div>
                    <div>
                      <strong>披露：</strong>本公司可在司法或行政机关依法要求时披露数据，无须提前通知您。您自行承担因披露导致的后果。
                    </div>
                    <div>
                      <strong>限制：</strong>本公司不向第三方出售数据，但不对共享或披露引发的间接后果负责。
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">（六）用户权利</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    根据《个人信息保护法》，您可能享有访问、更正、删除、撤回同意等权利，具体以法律法规为准。您可通过客服（support@pptking.cn）提出请求，本公司有权根据实际情况决定是否响应及响应方式，且不保证具体时限。您对处理结果不满意的，可依法向监管部门投诉。
                  </p>
                </div>
              </div>
            </section>

            {/* 四、其他条款 */}
            <section>
              <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-purple-200 pb-2">四、其他条款</h3>
              
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-700 mb-3">（一）协议变更</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    本公司有权根据业务需要或法律法规变化单方面修订本协议。修订内容将通过网站公告或站内信提前通知，通知方式及时间由本公司决定。修订生效后，您继续使用服务即视为接受修订条款；若不同意，须立即停止使用。本公司不对您因未及时停止使用导致的后果负责。
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3">（二）法律适用与争议解决</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    本协议适用中华人民共和国法律（不含冲突法）。因本协议或服务产生的争议，双方可协商解决；协商不成的，任何一方须向本公司住所地（[公司住所地]）有管辖权的人民法院提起诉讼。您自行承担诉讼相关费用及风险。
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3">（三）完整性与可分割性</h4>
                  <p className="text-sm text-tech-700 leading-relaxed">
                    本协议构成您与本公司之间关于本网站服务的完整协议，取代此前所有相关协议。若本协议任一条款被认定无效或不可执行，不影响其他条款的有效性，本公司有权替换为符合原条款目的的条款。
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-700 mb-3">（四）联系方式</h4>
                  <p className="text-sm text-tech-700 leading-relaxed mb-3">如有疑问，可通过以下方式联系本公司：</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-purple-600">邮箱：</span>
                      <span className="text-tech-700">support@pptking.cn</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-purple-600">电话：</span>
                      <span className="text-tech-700">0755-32867416</span>
                    </div>
                  </div>
                  <p className="text-sm text-tech-600 mt-3 italic">
                    本公司有权决定是否响应及响应方式，不对响应时限或结果负责。
                  </p>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
