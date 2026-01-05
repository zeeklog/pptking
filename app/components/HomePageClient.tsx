"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Palette,
  Download,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Star,
  Users,
  Clock,
  CheckCircle,
  Play,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { PPTGenerationSection } from "@/components/PPTGenerationSection";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function HomePageClient() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const { user } = useAuth();
  const { showLoginModal } = useLoginModal();
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFeatureClick = (feature: string) => {
    if (!user) {
      showLoginModal(() => {
        switch (feature) {
          case "generate":
            router.push("/generate");
            break;
          case "copywriting":
            router.push("/copywriting");
            break;
          default:
            break;
        }
      });
      return;
    }

    switch (feature) {
      case "generate":
        router.push("/generate");
        break;
      case "copywriting":
        router.push("/copywriting");
        break;
      default:
        break;
    }
  };

  const features = [
    {
      title: t("home.features.aiGeneration.title"),
      description: t("home.features.aiGeneration.description"),
      icon: Sparkles,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      action: () => handleFeatureClick("generate"),
      stats: t("home.features.aiGeneration.stats"),
    },
    {
      title: t("home.features.smartDesign.title"),
      description: t("home.features.smartDesign.description"),
      icon: Palette,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      action: () => handleFeatureClick("generate"),
      stats: t("home.features.smartDesign.stats"),
    },
    {
      title: t("copywriting.title"),
      description: t("copywriting.description"),
      icon: Zap,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      action: () => handleFeatureClick("copywriting"),
      stats: t("copywriting.types.marketing"),
    },
  ];

  const benefits = [
    {
      title: t("home.benefits.professionalTeam.title"),
      description: t("home.benefits.professionalTeam.description"),
      icon: Shield,
      gradient: "from-purple-500 to-indigo-500",
      features: [
        t("home.benefits.professionalTeam.features.designer"),
        t("home.benefits.professionalTeam.features.screening"),
        t("home.benefits.professionalTeam.features.optimization"),
      ],
    },
    {
      title: t("home.benefits.globalResources.title"),
      description: t("home.benefits.globalResources.description"),
      icon: Globe,
      gradient: "from-blue-500 to-teal-500",
      features: [
        t("home.benefits.globalResources.features.resources"),
        t("home.benefits.globalResources.features.culture"),
        t("home.benefits.globalResources.features.scenarios"),
      ],
    },
  ];

  const stats = [
    { label: t("home.stats.users"), value: "500,000+", icon: Users, color: "text-purple-600", bgColor: "bg-purple-100" },
    { label: t("home.stats.generations"), value: "2,000,000+", icon: Sparkles, color: "text-pink-600", bgColor: "bg-pink-100" },
    { label: t("home.stats.satisfaction"), value: "98%", icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  ];

  const testimonials = [
    {
      name: t("home.testimonials.zhang.name"),
      role: t("home.testimonials.zhang.role"),
      company: t("home.testimonials.zhang.company"),
      content: t("home.testimonials.zhang.content"),
      avatar: "👨‍💼",
    },
    {
      name: t("home.testimonials.li.name"),
      role: t("home.testimonials.li.role"),
      company: t("home.testimonials.li.company"),
      content: t("home.testimonials.li.content"),
      avatar: "👩‍🏫",
    },
    {
      name: t("home.testimonials.wang.name"),
      role: t("home.testimonials.wang.role"),
      company: t("home.testimonials.wang.company"),
      content: t("home.testimonials.wang.content"),
      avatar: "👨‍🎨",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 动态背景装饰 */}
        <div className="absolute inset-0 bg-gradient-tech-texture opacity-5"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10 container mx-auto px-4 py-24">
          <div className={`text-center max-w-5xl mx-auto ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-lg font-medium mb-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Zap className="w-6 h-6 mr-3 animate-pulse" />
              {t("home.hero.title")}
              <Badge variant="secondary" className="ml-3 bg-white/20 text-white border-white/30">
                Beta
              </Badge>
            </div>

            <h1 className="text-6xl lg:text-8xl font-bold text-tech-800 mb-8 leading-tight">
              {t("home.hero.mainTitle")} {" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">{t("home.hero.mainTitleHighlight")}</span>
            </h1>

            <p className="text-xl lg:text-2xl text-tech-600 mb-10 leading-relaxed max-w-4xl mx-auto">
              {t("home.hero.description")}
              <br />
              {t("home.hero.oneClickGenerate")}，{t("home.hero.makePresentation")}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button
                size="lg"
                className="btn-primary text-lg px-10 py-6 shadow-lg hover:shadow-xl group relative overflow-hidden"
                onClick={() => handleFeatureClick("generate")}
              >
                <span className="relative z-10 flex items-center">
                  {t("home.hero.getStarted")}
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>

            {/* 快速统计 */}
            <div className="flex justify-center items-center space-x-8 text-sm text-tech-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                {t("home.hero.tryFree")}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                {t("home.features.aiGeneration.stats")}
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-yellow-500" />
                {t("home.stats.satisfaction")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-20 ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
            <Badge variant="outline" className="mb-4 px-4 py-2 border-purple-200 text-purple-600">
              {t("home.featuresSection.badge")}
            </Badge>
            <h2 className="text-5xl font-bold text-tech-800 mb-6">
              {t("home.featuresSection.title")}
            </h2>
            <p className="text-xl text-tech-600 max-w-3xl mx-auto leading-relaxed">
              {t("home.featuresSection.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl border-0 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
                style={{ animationDelay: `${400 + index * 100}ms` }}
                onClick={feature.action}
                onMouseEnter={() => setHoveredFeature(feature.title)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-8 text-center relative overflow-hidden">
                  {/* 背景渐变 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  {/* 内容 */}
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                        `bg-gradient-to-r ${feature.gradient}`,
                      )}
                    >
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-tech-800 mb-3 group-hover:text-purple-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-tech-600 leading-relaxed mb-4">{feature.description}</p>

                    {/* 统计标签 */}
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      {feature.stats}
                    </Badge>
                  </div>

                  {/* 悬停效果 */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-r from-white to-purple-50/50 relative">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-20 ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "600ms" }}>
            <Badge variant="outline" className="mb-4 px-4 py-2 border-blue-200 text-blue-600">
              {t("home.benefitsSection.badge")}
            </Badge>
            <h2 className="text-5xl font-bold text-tech-800 mb-6">{t("home.benefitsSection.title")}</h2>
            <p className="text-xl text-tech-600 max-w-3xl mx-auto leading-relaxed">{t("home.benefitsSection.description")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card
                key={benefit.title}
                className={`group hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm ${isVisible ? "animate-fade-in" : "opacity-0"}`}
                style={{ animationDelay: `${800 + index * 200}ms` }}
              >
                <CardContent className="p-10">
                  <div className="flex items-start space-x-6">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
                        `bg-gradient-to-r ${benefit.gradient}`,
                      )}
                    >
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-tech-800 mb-4 group-hover:text-purple-600 transition-colors">{benefit.title}</h3>
                      <p className="text-tech-600 leading-relaxed mb-6">{benefit.description}</p>

                      {/* 特性标签 */}
                      <div className="flex flex-wrap gap-2">
                        {benefit.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`text-center group ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: `${1000 + index * 100}ms` }}>
                <div className={cn("w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500", stat.bgColor)}>
                  <stat.icon className={cn("w-10 h-10", stat.color)} />
                </div>
                <div className="text-4xl font-bold text-tech-800 mb-3 group-hover:text-purple-600 transition-colors">{stat.value}</div>
                <div className="text-tech-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-20 ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "1100ms" }}>
            <Badge variant="outline" className="mb-4 px-4 py-2 border-green-200 text-green-600">{t("home.testimonialsSection.badge")}</Badge>
            <h2 className="text-5xl font-bold text-tech-800 mb-6">{t("home.testimonialsSection.title")}</h2>
            <p className="text-xl text-tech-600 max-w-3xl mx-auto">{t("home.testimonialsSection.description")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className={`group hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: `${1200 + index * 200}ms` }}>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{testimonial.avatar}</div>
                    <p className="text-tech-600 leading-relaxed mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-tech-800">{testimonial.name}</div>
                      <div className="text-sm text-tech-500">{testimonial.role} · {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-tech-texture opacity-10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className={`max-w-4xl mx-auto ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "1300ms" }}>
            <h2 className="text-5xl font-bold text-white mb-8">{t("home.cta.title")}</h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              {t("home.cta.description")}
              <br />
              {t("home.cta.subDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 text-lg px-10 py-6 shadow-2xl hover:shadow-3xl group transition-all duration-300"
                onClick={() => handleFeatureClick("generate")}
              >
                <span className="flex items-center">
                  {t("home.cta.freeStart")}
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>

            {/* 底部统计 */}
            <div className="flex justify-center items-center space-x-8 mt-12 text-white/80">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("home.cta.dailyUsers")}
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                {t("home.cta.successRate")}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}