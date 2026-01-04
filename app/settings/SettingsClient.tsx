'use client';import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Shield, 
  Globe, 
  Download,
  Eye,
  Moon,
  Sun,
  Monitor,
  Languages,
  Volume2,
  VolumeX,
  Smartphone,
  Desktop,
  Tablet,
  Save,
  RotateCcw,
  Zap,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeProvider";
import { useAccess } from "@/contexts/AccessContext";
import { toast } from "@/hooks/use-toast";

interface UserSettings {
  // 外观设置
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'purple' | 'blue' | 'green';
  
  // 通知设置
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  updateNotifications: boolean;
  
  // 隐私设置
  profileVisibility: 'public' | 'private' | 'friends';
  dataCollection: boolean;
  analytics: boolean;
  
  // 功能设置
  autoSave: boolean;
  autoBackup: boolean;
  downloadQuality: 'standard' | 'high' | 'ultra';
  defaultLanguage: 'zh-CN' | 'en-US' | 'ja-JP';
  
  // 性能设置
  hardwareAcceleration: boolean;
  cacheSize: 'small' | 'medium' | 'large';
  backgroundSync: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { access, updateAccess } = useAccess();
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 'medium',
    colorScheme: 'purple',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    updateNotifications: true,
    profileVisibility: 'public',
    dataCollection: true,
    analytics: true,
    autoSave: true,
    autoBackup: true,
    downloadQuality: 'high',
    defaultLanguage: 'zh-CN',
    hardwareAcceleration: true,
    cacheSize: 'medium',
    backgroundSync: true
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      // 从localStorage或API加载设置
      const savedSettings = localStorage.getItem('pptking-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // 保存到localStorage或API
      localStorage.setItem('pptking-settings', JSON.stringify(settings));
      
      // 应用设置
      applySettings(settings);
      
      setHasChanges(false);
      toast({
        title: "设置已保存",
        description: "您的设置已成功保存并应用",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存设置，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings: UserSettings = {
      fontSize: 'medium',
      colorScheme: 'purple',
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      updateNotifications: true,
      profileVisibility: 'public',
      dataCollection: true,
      analytics: true,
      autoSave: true,
      autoBackup: true,
      downloadQuality: 'high',
      defaultLanguage: 'zh-CN',
      hardwareAcceleration: true,
      cacheSize: 'medium',
      backgroundSync: true
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
    
    toast({
      title: "设置已重置",
      description: "所有设置已恢复为默认值",
    });
  };

  const applySettings = (newSettings: UserSettings) => {
    // 应用字体大小
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = fontSizeMap[newSettings.fontSize];
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-tech-600 dark:text-tech-400">请先登录</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-primary rounded-full text-white text-lg font-medium mb-6 shadow-purple-md">
            <SettingsIcon className="w-6 h-6 mr-2" />
            系统设置
          </div>
          <h1 className="text-4xl font-bold text-tech-800 dark:text-tech-200 mb-4">PPTKING 设置</h1>
          <p className="text-tech-600 dark:text-tech-400">个性化您的PPTKING使用体验</p>
        </div>

        {/* Settings Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge className="bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400">
                有未保存的更改
              </Badge>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置设置
            </Button>
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges || loading}
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-purple-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger 
              value="appearance" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              外观
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              通知
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              隐私
            </TabsTrigger>
            <TabsTrigger 
              value="features" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              功能
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              AI配置
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-purple-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
            >
              性能
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="mt-6">
            <Card className="template-card dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  外观设置
                </CardTitle>
                <CardDescription className="dark:text-gray-400">自定义PPTKING的视觉外观</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium dark:text-gray-200">主题模式</Label>
                    <p className="text-sm text-tech-600 dark:text-tech-400">选择您喜欢的主题模式</p>
                  </div>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="w-4 h-4 mr-2" />
                          浅色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="w-4 h-4 mr-2" />
                          深色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Monitor className="w-4 h-4 mr-2" />
                          跟随系统
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium dark:text-gray-200">字体大小</Label>
                    <p className="text-sm text-tech-600 dark:text-tech-400">调整界面文字大小</p>
                  </div>
                  <Select value={settings.fontSize} onValueChange={(value) => handleSettingChange('fontSize', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">小</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="large">大</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Color Scheme */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium dark:text-gray-200">色彩方案</Label>
                    <p className="text-sm text-tech-600 dark:text-tech-400">选择您喜欢的色彩主题</p>
                  </div>
                  <Select value={settings.colorScheme} onValueChange={(value) => handleSettingChange('colorScheme', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purple">紫色系</SelectItem>
                      <SelectItem value="blue">蓝色系</SelectItem>
                      <SelectItem value="green">绿色系</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-purple-600" />
                  通知设置
                </CardTitle>
                <CardDescription>管理您接收的通知类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">邮件通知</Label>
                    <p className="text-sm text-tech-600">接收重要事件的邮件通知</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <Separator />

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">推送通知</Label>
                    <p className="text-sm text-tech-600">接收浏览器推送通知</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications} 
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>

                <Separator />

                {/* Marketing Emails */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">营销邮件</Label>
                    <p className="text-sm text-tech-600">接收产品更新和优惠信息</p>
                  </div>
                  <Switch 
                    checked={settings.marketingEmails} 
                    onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                  />
                </div>

                <Separator />

                {/* Update Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">更新通知</Label>
                    <p className="text-sm text-tech-600">接收新功能和安全更新通知</p>
                  </div>
                  <Switch 
                    checked={settings.updateNotifications} 
                    onCheckedChange={(checked) => handleSettingChange('updateNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="mt-6">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600" />
                  隐私设置
                </CardTitle>
                <CardDescription>管理您的隐私和数据使用偏好</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">个人资料可见性</Label>
                    <p className="text-sm text-tech-600">控制谁可以看到您的个人资料</p>
                  </div>
                  <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">公开</SelectItem>
                      <SelectItem value="friends">仅好友</SelectItem>
                      <SelectItem value="private">私密</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Data Collection */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">数据收集</Label>
                    <p className="text-sm text-tech-600">允许收集使用数据以改进服务</p>
                  </div>
                  <Switch 
                    checked={settings.dataCollection} 
                    onCheckedChange={(checked) => handleSettingChange('dataCollection', checked)}
                  />
                </div>

                <Separator />

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">分析统计</Label>
                    <p className="text-sm text-tech-600">允许使用分析工具了解使用情况</p>
                  </div>
                  <Switch 
                    checked={settings.analytics} 
                    onCheckedChange={(checked) => handleSettingChange('analytics', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Settings */}
          <TabsContent value="features" className="mt-6">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-purple-600" />
                  功能设置
                </CardTitle>
                <CardDescription>自定义PPTKING的功能行为</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">自动保存</Label>
                    <p className="text-sm text-tech-600">自动保存您的工作进度</p>
                  </div>
                  <Switch 
                    checked={settings.autoSave} 
                    onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                  />
                </div>

                <Separator />

                {/* Auto Backup */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">自动备份</Label>
                    <p className="text-sm text-tech-600">自动备份您的项目到云端</p>
                  </div>
                  <Switch 
                    checked={settings.autoBackup} 
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>

                <Separator />

                {/* Download Quality */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">下载质量</Label>
                    <p className="text-sm text-tech-600">设置PPT下载的默认质量</p>
                  </div>
                  <Select value={settings.downloadQuality} onValueChange={(value) => handleSettingChange('downloadQuality', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">标准</SelectItem>
                      <SelectItem value="high">高清</SelectItem>
                      <SelectItem value="ultra">超清</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Language */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">默认语言</Label>
                    <p className="text-sm text-tech-600">设置界面显示语言</p>
                  </div>
                  <Select value={settings.defaultLanguage} onValueChange={(value) => handleSettingChange('defaultLanguage', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="mt-6">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-600" />
                  AI配置
                </CardTitle>
                <CardDescription>配置AI服务提供商和API密钥</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SiliconFlow Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">SiliconFlow API密钥</Label>
                      <p className="text-sm text-tech-600">用于访问SiliconFlow AI服务</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="输入您的SiliconFlow API密钥"
                      value={access?.siliconflowApiKey || ""}
                      onChange={(e) => updateAccess({ siliconflowApiKey: e.target.value })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      您可以在SiliconFlow控制台获取API密钥
                    </p>
                  </div>
                </div>

                <Separator />

                {/* SiliconFlow URL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">SiliconFlow接口地址</Label>
                      <p className="text-sm text-tech-600">SiliconFlow API的接口地址</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="https://api.siliconflow.cn"
                      value={access?.siliconflowUrl || "/api/chat/siliconflow"}
                      onChange={(e) => updateAccess({ siliconflowUrl: e.target.value })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      默认使用本地代理接口
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Default Model */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">默认模型</Label>
                    <p className="text-sm text-tech-600">设置默认使用的AI模型</p>
                  </div>
                  <Select 
                    value={access?.defaultModel || "Qwen/Qwen2.5-72B-Instruct@SiliconFlow"} 
                    onValueChange={(value) => updateAccess({ defaultModel: value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Qwen/Qwen2.5-72B-Instruct@SiliconFlow">
                        Qwen/Qwen2.5-72B-Instruct@SiliconFlow
                      </SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="mt-6">
            <Card className="template-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  性能设置
                </CardTitle>
                <CardDescription>优化PPTKING的性能表现</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hardware Acceleration */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">硬件加速</Label>
                    <p className="text-sm text-tech-600">使用GPU加速提升渲染性能</p>
                  </div>
                  <Switch 
                    checked={settings.hardwareAcceleration} 
                    onCheckedChange={(checked) => handleSettingChange('hardwareAcceleration', checked)}
                  />
                </div>

                <Separator />

                {/* Cache Size */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">缓存大小</Label>
                    <p className="text-sm text-tech-600">设置本地缓存存储空间</p>
                  </div>
                  <Select value={settings.cacheSize} onValueChange={(value) => handleSettingChange('cacheSize', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">小 (100MB)</SelectItem>
                      <SelectItem value="medium">中 (500MB)</SelectItem>
                      <SelectItem value="large">大 (1GB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Background Sync */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">后台同步</Label>
                    <p className="text-sm text-tech-600">在后台自动同步数据</p>
                  </div>
                  <Switch 
                    checked={settings.backgroundSync} 
                    onCheckedChange={(checked) => handleSettingChange('backgroundSync', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
