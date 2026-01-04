'use client';import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Lock, 
  Github, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Camera,
  Shield,
  Key,
  Smartphone,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProfileData {
  username: string;
  email: string;
  avatar_url?: string;
  github_username?: string;
  wechat_bound: boolean;
  github_bound: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    email: "",
    avatar_url: "",
    github_username: "",
    wechat_bound: false,
    github_bound: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: ""
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // 获取用户元数据
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setProfileData({
          username: currentUser.user_metadata?.username || "",
          email: currentUser.email || "",
          avatar_url: currentUser.user_metadata?.avatar_url || "",
          github_username: currentUser.user_metadata?.github_username || "",
          wechat_bound: currentUser.user_metadata?.wechat_bound || false,
          github_bound: currentUser.user_metadata?.github_bound || false
        });
      }
    } catch (error) {
      console.error("加载个人资料失败:", error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: profileData.username,
          github_username: profileData.github_username
        }
      });

      if (error) throw error;

      toast({
        title: "个人资料更新成功",
        description: "您的个人资料已成功更新",
      });
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不一致",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "密码太短",
        description: "新密码至少需要6个字符",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "密码修改成功",
        description: "您的密码已成功更新",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "密码修改失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });

      if (error) throw error;

      toast({
        title: "邮箱更新请求已发送",
        description: "请检查您的新邮箱进行验证",
      });

      setEmailData({
        newEmail: "",
        password: ""
      });
    } catch (error: any) {
      toast({
        title: "邮箱更新失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bindWeChat = () => {
    // 这里应该集成微信扫码登录
    toast({
      title: "微信绑定",
      description: "微信绑定功能开发中...",
    });
  };

  const bindGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "GitHub绑定失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unbindGitHub = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          github_username: null,
          github_bound: false
        }
      });

      if (error) throw error;

      setProfileData(prev => ({
        ...prev,
        github_username: "",
        github_bound: false
      }));

      toast({
        title: "GitHub解绑成功",
        description: "您的GitHub账户已成功解绑",
      });
    } catch (error: any) {
      toast({
        title: "GitHub解绑失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-tech-800 mb-4">个人资料</h1>
          <p className="text-tech-600">管理您的账户信息和安全设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="template-card">
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={profileData.avatar_url} alt={profileData.username} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                      {profileData.username?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 w-8 h-8 p-0 rounded-full bg-white border-purple-200"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">{profileData.username || '用户'}</CardTitle>
                <CardDescription className="text-tech-600">{profileData.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tech-600">账户状态</span>
                    <Badge className="bg-success-50 text-success-600 border-success-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已验证
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tech-600">注册时间</span>
                    <span className="text-sm text-tech-800">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '未知'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-purple-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="basic" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  基本信息
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  安全设置
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  邮箱管理
                </TabsTrigger>
                <TabsTrigger 
                  value="social" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm"
                >
                  社交账户
                </TabsTrigger>
              </TabsList>

              {/* Basic Info */}
              <TabsContent value="basic" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-600" />
                      基本信息
                    </CardTitle>
                    <CardDescription>更新您的个人基本信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        placeholder="请输入用户名"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github_username">GitHub用户名</Label>
                      <Input
                        id="github_username"
                        value={profileData.github_username}
                        onChange={(e) => setProfileData({...profileData, github_username: e.target.value})}
                        placeholder="请输入GitHub用户名"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <Button 
                      onClick={updateProfile}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? '更新中...' : '保存更改'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-purple-600" />
                      安全设置
                    </CardTitle>
                    <CardDescription>修改您的账户密码</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">新密码</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="请输入新密码（至少6位）"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认密码</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="请再次输入新密码"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <Button 
                      onClick={changePassword}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? '修改中...' : '修改密码'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Email Management */}
              <TabsContent value="email" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-purple-600" />
                      邮箱管理
                    </CardTitle>
                    <CardDescription>修改您的绑定邮箱</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-tech-800">当前邮箱</p>
                          <p className="text-sm text-tech-600">{profileData.email}</p>
                        </div>
                        <Badge className="bg-success-50 text-success-600 border-success-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已验证
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">新邮箱地址</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={emailData.newEmail}
                        onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})}
                        placeholder="请输入新的邮箱地址"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">当前密码</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailData.password}
                        onChange={(e) => setEmailData({...emailData, password: e.target.value})}
                        placeholder="请输入当前密码确认"
                        className="input-glass focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <Button 
                      onClick={changeEmail}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? '更新中...' : '更新邮箱'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Accounts */}
              <TabsContent value="social" className="mt-6">
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                      社交账户
                    </CardTitle>
                    <CardDescription>管理您的第三方账户绑定</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* WeChat */}
                    <div className="flex items-center justify-between p-4 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-tech-800">微信</p>
                          <p className="text-sm text-tech-600">
                            {profileData.wechat_bound ? '已绑定' : '未绑定'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={profileData.wechat_bound ? "outline" : "default"}
                        onClick={bindWeChat}
                        className={profileData.wechat_bound ? "border-error-200 text-error-600 hover:bg-error-50" : ""}
                      >
                        {profileData.wechat_bound ? '解绑' : '绑定'}
                      </Button>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-4 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-tech-100 rounded-lg flex items-center justify-center">
                          <Github className="w-5 h-5 text-tech-600" />
                        </div>
                        <div>
                          <p className="font-medium text-tech-800">GitHub</p>
                          <p className="text-sm text-tech-600">
                            {profileData.github_bound ? `已绑定 (${profileData.github_username})` : '未绑定'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={profileData.github_bound ? "outline" : "default"}
                        onClick={profileData.github_bound ? unbindGitHub : bindGitHub}
                        disabled={loading}
                        className={profileData.github_bound ? "border-error-200 text-error-600 hover:bg-error-50" : ""}
                      >
                        {loading ? '处理中...' : (profileData.github_bound ? '解绑' : '绑定')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
