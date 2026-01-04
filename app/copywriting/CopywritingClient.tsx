'use client';import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  FileText, 
  Link, 
  Lightbulb,
  Copy,
  Download,
  Star,
  Filter,
  Zap,
  Heart,
  CheckCircle,
  Brain,
  Palette,
  Users,
  Clock,
  User,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { generateId, generateTimestamp } from "@/lib/id-generator";
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  category?: string;
  timestamp: Date;
}

export default function Copywriting() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { showLoginModal } = useLoginModal();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inputType, setInputType] = useState("outline");
  const [userInput, setUserInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content: t('copywriting.welcomeMessage'),
      timestamp: new Date()
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copywritingCategories = [
    { value: "all", label: t('copywriting.categories.all'), icon: FileText, color: "from-purple-600 to-pink-600", description: t('copywriting.categoryDescriptions.all') },
    { value: "email", label: t('copywriting.categories.email'), icon: MessageSquare, color: "from-blue-600 to-cyan-600", description: t('copywriting.categoryDescriptions.email') },
    { value: "social", label: t('copywriting.categories.social'), icon: Star, color: "from-pink-600 to-rose-600", description: t('copywriting.categoryDescriptions.social') },
    { value: "sales", label: t('copywriting.categories.sales'), icon: Lightbulb, color: "from-green-600 to-teal-600", description: t('copywriting.categoryDescriptions.sales') },
    { value: "blog", label: t('copywriting.categories.blog'), icon: FileText, color: "from-indigo-600 to-purple-600", description: t('copywriting.categoryDescriptions.blog') },
    { value: "ad", label: t('copywriting.categories.ad'), icon: Sparkles, color: "from-orange-600 to-red-600", description: t('copywriting.categoryDescriptions.ad') },
    { value: "product", label: t('copywriting.categories.product'), icon: Copy, color: "from-purple-600 to-pink-600", description: t('copywriting.categoryDescriptions.product') },
    { value: "seo", label: t('copywriting.categories.seo'), icon: Link, color: "from-blue-600 to-cyan-600", description: t('copywriting.categoryDescriptions.seo') },
    { value: "press", label: t('copywriting.categories.press'), icon: Download, color: "from-green-600 to-teal-600", description: t('copywriting.categoryDescriptions.press') },
    { value: "script", label: t('copywriting.categories.script'), icon: MessageSquare, color: "from-purple-600 to-pink-600", description: t('copywriting.categoryDescriptions.script') },
    { value: "brand", label: t('copywriting.categories.brand'), icon: Star, color: "from-pink-600 to-rose-600", description: t('copywriting.categoryDescriptions.brand') },
    { value: "landing", label: t('copywriting.categories.landing'), icon: Lightbulb, color: "from-purple-600 to-pink-600", description: t('copywriting.categoryDescriptions.landing') },
    { value: "government", label: t('copywriting.categories.government'), icon: FileText, color: "from-red-600 to-orange-600", description: t('copywriting.categoryDescriptions.government') },
    { value: "party", label: t('copywriting.categories.party'), icon: Users, color: "from-red-600 to-pink-600", description: t('copywriting.categoryDescriptions.party') }
  ];

  const inputTypes = [
    { value: "outline", label: t('copywriting.inputTypes.outline'), icon: MessageSquare },
    { value: "title", label: t('copywriting.inputTypes.title'), icon: Sparkles },
    { value: "url", label: t('copywriting.inputTypes.url'), icon: Link },
    { value: "article", label: t('copywriting.inputTypes.article'), icon: FileText },
    { value: "keywords", label: t('copywriting.inputTypes.keywords'), icon: Star },
    { value: "brief", label: t('copywriting.inputTypes.brief'), icon: Copy }
  ];

  const features = [
    {
      title: t('copywriting.features.smartAnalysis.title'),
      description: t('copywriting.features.smartAnalysis.description'),
      icon: Brain,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: t('copywriting.features.multiScenario.title'),
      description: t('copywriting.features.multiScenario.description'),
      icon: Palette,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: t('copywriting.features.oneClickOptimize.title'),
      description: t('copywriting.features.oneClickOptimize.description'),
      icon: Zap,
      color: "from-green-500 to-emerald-500"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGenerate = async () => {
    if (!user) {
      showLoginModal();
      return;
    }

    if (!userInput.trim()) {
      toast({
        title: t('copywriting.error.noInput'),
        description: t('copywriting.error.noInputDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // 模拟生成过程
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: generateId('user'),
      type: 'user',
      content: userInput,
      category: selectedCategory,
      timestamp: generateTimestamp()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // 模拟AI响应
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: generateId('ai'),
        type: 'ai',
        content: t('copywriting.aiResponse'),
        timestamp: generateTimestamp()
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
      setUserInput("");
      
      toast({
        title: t('copywriting.success.generated'),
        description: t('copywriting.success.generatedDesc'),
      });
    }, 3000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: t('copywriting.copySuccess'),
      description: t('copywriting.copySuccessDesc'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-lg font-medium mb-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
            {t('copywriting.title')}
            <Badge variant="secondary" className="ml-3 bg-white/20 text-white border-white/30">
              Beta
            </Badge>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-tech-800 mb-8">
            {t('copywriting.hero.title')}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x"> {t('copywriting.hero.subtitle')}</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-tech-600 max-w-4xl mx-auto leading-relaxed">
            {t('copywriting.hero.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Input Section */}
            <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-101">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-2xl text-tech-800">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mr-4 shadow-md">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  {t('copywriting.input.title')}
                </CardTitle>
                <CardDescription className="text-lg text-tech-600">
                  {t('copywriting.input.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Category Selection */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-tech-700 flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-purple-500" />
                    {t('copywriting.type')}
                  </label>
                  <ScrollArea className="h-32">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {copywritingCategories.map((category) => (
                        <div
                          key={category.value}
                          className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-102 group",
                            selectedCategory === category.value
                              ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg"
                              : "border-purple-200 hover:border-purple-300 hover:shadow-md"
                          )}
                          onClick={() => setSelectedCategory(category.value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shadow-md",
                              `bg-gradient-to-r ${category.color}`
                            )}>
                              <category.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-tech-800 group-hover:text-purple-600 transition-colors">
                                {category.label}
                              </div>
                              <div className="text-xs text-tech-500 mt-1">{category.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Input Type Selection */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-tech-700 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-500" />
                    {t('copywriting.inputType')}
                  </label>
                  <Select value={inputType} onValueChange={setInputType}>
                    <SelectTrigger className="input-glass h-14 text-lg focus:border-purple-500 focus:ring-purple-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inputTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-3">
                            <type.icon className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Input */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-tech-700 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-purple-500" />
                    {t('copywriting.content')}
                  </label>
                  <Textarea
                    ref={textareaRef}
                    placeholder={t('copywriting.inputPlaceholder')}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="input-glass min-h-40 text-base resize-none focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !userInput.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg py-6 rounded-2xl group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {isGenerating ? (
                      <>
                        <Clock className="w-6 h-6 mr-3 animate-spin" />
                        {t('copywriting.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 mr-3 group-hover:scale-105 transition-transform" />
                        {t('copywriting.generate')}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>

                {/* Progress */}
                {isGenerating && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-tech-700">{t('copywriting.progress')}</div>
                      <div className="text-sm text-purple-600 font-medium">{progress}%</div>
                    </div>
                    <Progress value={progress} className="h-3 bg-purple-100">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
                    </Progress>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-101">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-tech-800">
                  <MessageSquare className="w-6 h-6 mr-3 text-purple-600" />
                  {t('chat.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-6">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex space-x-4",
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] p-4 rounded-2xl shadow-md",
                            message.type === 'user'
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                              : "bg-white border border-purple-200"
                          )}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            {message.type === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Brain className="w-4 h-4 text-purple-600" />
                            )}
                            <span className="text-sm font-medium">
                              {message.type === 'user' ? t('chat.user') : t('chat.ai')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.type === 'ai' && (
                            <div className="flex items-center space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(message.content)}
                                className="text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                {t('copywriting.copy')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Features */}
            <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-101">
              <CardHeader>
                <CardTitle className="flex items-center text-tech-800">
                  <Star className="w-6 h-6 mr-3 text-purple-600" />
                  {t('copywriting.features.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={feature.title} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      `bg-gradient-to-r ${feature.color}`
                    )}>
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-tech-800">{feature.title}</div>
                      <div className="text-xs text-tech-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-101">
              <CardHeader>
                <CardTitle className="flex items-center text-tech-800">
                  <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
                  {t('copywriting.stats.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">50K+</div>
                    <div className="text-xs text-tech-500">{t('copywriting.stats.generated')}</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">98%</div>
                    <div className="text-xs text-tech-500">{t('copywriting.stats.satisfaction')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
