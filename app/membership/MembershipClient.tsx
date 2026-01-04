'use client';import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  Star, 
  Zap, 
  Download, 
  FileText, 
  Users, 
  Calendar,
  CreditCard,
  Gift,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  status: 'active' | 'expired' | 'none';
  startDate?: string;
  endDate?: string;
  usage: {
    templates: number;
    generations: number;
    downloads: number;
  };
  limits: {
    templates: number;
    generations: number;
    downloads: number;
  };
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
}

export default function Membership() {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<MembershipTier | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMembershipData();
    }
  }, [user]);

  const loadMembershipData = async () => {
    setLoading(true);
    try {
      // 模拟从API获取会员数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockTier: MembershipTier = {
        id: "pro",
        name: "专业版",
        price: 99,
        period: "年",
        features: [
          "无限PPT生成",
          "高级模板库",
          "AI文案生成",
          "优先客服支持",
          "团队协作功能",
          "自定义品牌"
        ],
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        usage: {
          templates: 45,
          generations: 128,
          downloads: 67
        },
        limits: {
          templates: 100,
          generations: 500,
          downloads: 200
        }
      };

      const mockBilling: BillingHistory[] = [
        {
          id: "1",
          date: "2024-01-15",
          amount: 99,
          description: "专业版年费",
          status: 'paid'
        },
        {
          id: "2",
          date: "2023-12-15",
          amount: 29,
          description: "基础版月费",
          status: 'paid'
        }
      ];

      setCurrentTier(mockTier);
      setBillingHistory(mockBilling);
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载会员信息",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradeMembership = () => {
    toast({
      title: "升级会员",
      description: "正在跳转到支付页面...",
    });
  };

  const renewMembership = () => {
    toast({
      title: "续费会员",
      description: "正在跳转到支付页面...",
    });
  };

  const cancelMembership = () => {
    toast({
      title: "取消会员",
      description: "会员将在当前周期结束后自动取消",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-tech-600">请先登录</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-tech-600">加载会员信息中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-primary rounded-full text-white text-lg font-medium mb-6 shadow-purple-md">
            <Crown className="w-6 h-6 mr-2" />
            会员中心
          </div>
          <h1 className="text-4xl font-bold text-tech-800 mb-4">会员服务</h1>
          <p className="text-tech-600">管理您的会员权益和订阅信息</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Membership */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-purple-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  会员概览
                </TabsTrigger>
                <TabsTrigger 
                  value="usage" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  使用情况
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  账单记录
                </TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center text-2xl">
                          <Crown className="w-6 h-6 mr-2 text-purple-600" />
                          {currentTier?.name || '免费用户'}
                        </CardTitle>
                        <CardDescription className="text-tech-600">
                          {currentTier?.status === 'active' ? '当前会员状态' : '升级到会员享受更多权益'}
                        </CardDescription>
                      </div>
                      <Badge 
                        className={cn(
                          "text-sm px-3 py-1",
                          currentTier?.status === 'active' 
                            ? "bg-success-50 text-success-600 border-success-200" 
                            : "bg-tech-50 text-tech-600 border-tech-200"
                        )}
                      >
                        {currentTier?.status === 'active' ? '会员中' : '免费用户'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentTier ? (
                      <>
                        {/* Membership Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-tech-800">订阅周期</span>
                            </div>
                            <p className="text-sm text-tech-600">
                              {currentTier.startDate} 至 {currentTier.endDate}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-tech-800">订阅费用</span>
                            </div>
                            <p className="text-sm text-tech-600">
                              ¥{currentTier.price}/{currentTier.period}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <h3 className="text-lg font-semibold text-tech-800 mb-3">会员权益</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentTier.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-success-500" />
                                <span className="text-sm text-tech-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-4">
                          <Button onClick={renewMembership} className="btn-primary">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            续费会员
                          </Button>
                          <Button variant="outline" onClick={cancelMembership}>
                            取消订阅
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-tech-800 mb-2">升级到会员</h3>
                        <p className="text-tech-600 mb-4">享受更多专业功能和权益</p>
                        <Button onClick={upgradeMembership} className="btn-primary">
                          <Sparkles className="w-4 h-4 mr-2" />
                          立即升级
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Usage */}
              <TabsContent value="usage" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                      使用情况
                    </CardTitle>
                    <CardDescription>查看您的功能使用统计</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentTier ? (
                      <>
                        {/* Usage Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-tech-800">模板使用</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-2xl font-bold text-tech-800">{currentTier.usage.templates}</span>
                              <span className="text-sm text-tech-600"> / {currentTier.limits.templates}</span>
                            </div>
                            <Progress value={(currentTier.usage.templates / currentTier.limits.templates) * 100} className="h-2" />
                          </div>
                          <div className="p-4 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Zap className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-tech-800">AI生成</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-2xl font-bold text-tech-800">{currentTier.usage.generations}</span>
                              <span className="text-sm text-tech-600"> / {currentTier.limits.generations}</span>
                            </div>
                            <Progress value={(currentTier.usage.generations / currentTier.limits.generations) * 100} className="h-2" />
                          </div>
                          <div className="p-4 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Download className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-tech-800">下载次数</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-2xl font-bold text-tech-800">{currentTier.usage.downloads}</span>
                              <span className="text-sm text-tech-600"> / {currentTier.limits.downloads}</span>
                            </div>
                            <Progress value={(currentTier.usage.downloads / currentTier.limits.downloads) * 100} className="h-2" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-tech-600">升级会员后查看详细使用统计</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing */}
              <TabsContent value="billing" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                      账单记录
                    </CardTitle>
                    <CardDescription>查看您的支付历史</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingHistory.length > 0 ? (
                      <div className="space-y-4">
                        {billingHistory.map((bill) => (
                          <div key={bill.id} className="flex items-center justify-between p-4 border border-purple-200 rounded-lg">
                            <div>
                              <p className="font-medium text-tech-800">{bill.description}</p>
                              <p className="text-sm text-tech-600">{bill.date}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-tech-800">¥{bill.amount}</span>
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  bill.status === 'paid' 
                                    ? "bg-success-50 text-success-600 border-success-200" 
                                    : bill.status === 'pending'
                                    ? "bg-warning-50 text-warning-600 border-warning-200"
                                    : "bg-error-50 text-error-600 border-error-200"
                                )}
                              >
                                {bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '处理中' : '失败'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-tech-600">暂无账单记录</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Membership Plans */}
          <div className="lg:col-span-1">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-600" />
                  会员套餐
                </CardTitle>
                <CardDescription>选择适合您的套餐</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Free Plan */}
                <div className="p-4 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-tech-800">免费版</h3>
                    <span className="text-sm text-tech-600">¥0/月</span>
                  </div>
                  <ul className="text-sm text-tech-600 space-y-1 mb-3">
                    <li>• 5次PPT生成</li>
                    <li>• 基础模板库</li>
                    <li>• 标准客服</li>
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    当前套餐
                  </Button>
                </div>

                {/* Pro Plan */}
                <div className="p-4 border-2 border-purple-500 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-tech-800">专业版</h3>
                    <span className="text-sm text-purple-600">¥99/年</span>
                  </div>
                  <ul className="text-sm text-tech-600 space-y-1 mb-3">
                    <li>• 无限PPT生成</li>
                    <li>• 高级模板库</li>
                    <li>• AI文案生成</li>
                    <li>• 优先客服支持</li>
                  </ul>
                  <Button className="w-full bg-gradient-primary">
                    {currentTier?.status === 'active' ? '当前套餐' : '立即升级'}
                  </Button>
                </div>

                {/* Enterprise Plan */}
                <div className="p-4 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-tech-800">企业版</h3>
                    <span className="text-sm text-tech-600">¥299/年</span>
                  </div>
                  <ul className="text-sm text-tech-600 space-y-1 mb-3">
                    <li>• 所有专业版功能</li>
                    <li>• 团队协作</li>
                    <li>• 自定义品牌</li>
                    <li>• 专属客服</li>
                  </ul>
                  <Button variant="outline" className="w-full">
                    联系销售
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
