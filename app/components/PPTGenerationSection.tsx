'use client';import { FeatureCard } from "./FeatureCard";
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Palette, 
  FileUp, 
  Settings,
  Layers
} from "lucide-react";

export function PPTGenerationSection() {
  const features = [
    {
      title: "新建PPT",
      description: "从空白画布开始创建，发挥您的创意",
      icon: FileText,
      gradient: false
    },
    {
      title: "AI生成自由画布",
      description: "AI智能生成PPT内容，一键创建专业演示",
      icon: Sparkles,
      gradient: true,
      image: 'https://onewo-space-public-pro.obs.cn-south-1.myhuaweicloud.com/scripts/ai-template-icon.jpg'
    },
    {
      title: "导入文档生成PPT",
      description: "支持Word、PDF等多种格式，智能转换为PPT",
      icon: FileUp,
      gradient: false,
      image: 'https://onewo-space-public-pro.obs.cn-south-1.myhuaweicloud.com/scripts/document-import.jpg'
    },
    {
      title: "上传PPT美化",
      description: "一键美化现有PPT，专业设计师级别效果",
      icon: Palette,
      gradient: false
    },
    {
      title: "上传PDF",
      description: "PDF文档智能转换，保持原有格式和布局",
      icon: Upload,
      gradient: false
    },
    {
      title: "自定义模版",
      description: "创建您的专属模板，统一品牌形象",
      icon: Settings,
      gradient: false
    },
    {
      title: "选择模版生成",
      description: "从丰富的模板库中选择，快速生成专业PPT",
      icon: Layers,
      gradient: false
    }
  ];

  const handleFeatureClick = (title: string) => {
    console.log("Feature clicked:", title);
    // Handle feature navigation
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tech-800 mb-4">
          PPT生成
        </h2>
        <p className="text-tech-600 text-lg">
          选择您喜欢的方式开始创建专业PPT
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            {...feature}
            onClick={() => handleFeatureClick(feature.title)}
            className="animate-fade-in"
          />
        ))}
      </div>
    </div>
  );
}