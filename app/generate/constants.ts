import { useTranslation } from "react-i18next";

export const getPPTStyles = (t: any) => [
  { 
    value: "business", 
    label: t('generate.styles.business'), 
    color: "from-blue-500 to-purple-600", 
    icon: "💼",
    description: t('generate.styles.businessDesc'),
    features: [t('generate.styles.businessFeatures.simple'), t('generate.styles.businessFeatures.professional'), t('generate.styles.businessFeatures.suitable')]
  },
  { 
    value: "creative", 
    label: t('generate.styles.creative'), 
    color: "from-pink-500 to-purple-600", 
    icon: "🎨",
    description: t('generate.styles.creativeDesc'),
    features: [t('generate.styles.creativeFeatures.visual'), t('generate.styles.creativeFeatures.creative'), t('generate.styles.creativeFeatures.artistic')]
  },
  { 
    value: "minimal", 
    label: t('generate.styles.minimal'), 
    color: "from-gray-400 to-gray-600", 
    icon: "⚪",
    description: t('generate.styles.minimalDesc'),
    features: [t('generate.styles.minimalFeatures.simple'), t('generate.styles.minimalFeatures.focused'), t('generate.styles.minimalFeatures.academic')]
  },
  { 
    value: "tech", 
    label: t('generate.styles.tech'), 
    color: "from-cyan-500 to-blue-600", 
    icon: "🚀",
    description: t('generate.styles.techDesc'),
    features: [t('generate.styles.techFeatures.futuristic'), t('generate.styles.techFeatures.tech'), t('generate.styles.techFeatures.technical')]
  },
  { 
    value: "education", 
    label: t('generate.styles.education'), 
    color: "from-green-500 to-teal-600", 
    icon: "📚",
    description: t('generate.styles.educationDesc'),
    features: [t('generate.styles.educationFeatures.clear'), t('generate.styles.educationFeatures.interactive'), t('generate.styles.educationFeatures.teaching')]
  },
  { 
    value: "medical", 
    label: t('generate.styles.medical'), 
    color: "from-emerald-500 to-green-600", 
    icon: "🏥",
    description: t('generate.styles.medicalDesc'),
    features: [t('generate.styles.medicalFeatures.professional'), t('generate.styles.medicalFeatures.credible'), t('generate.styles.medicalFeatures.medical')]
  }
];

export const getColorSchemes = (t: any) => [
  { 
    value: "purple", 
    label: t('generate.colors.purple'), 
    colors: ["#6366F1", "#4F46E5", "#3730A3"], 
    gradient: "from-purple-400 to-purple-600",
    description: t('generate.colors.purpleDesc')
  },
  { 
    value: "blue", 
    label: t('generate.colors.blue'), 
    colors: ["#3B82F6", "#2563EB", "#1D4ED8"], 
    gradient: "from-blue-500 to-blue-600",
    description: t('generate.colors.blueDesc')
  },
  { 
    value: "green", 
    label: t('generate.colors.green'), 
    colors: ["#10B981", "#059669", "#047857"], 
    gradient: "from-green-500 to-green-600",
    description: t('generate.colors.greenDesc')
  },
  { 
    value: "orange", 
    label: t('generate.colors.orange'), 
    colors: ["#F59E0B", "#D97706", "#B45309"], 
    gradient: "from-orange-500 to-orange-600",
    description: t('generate.colors.orangeDesc')
  },
  { 
    value: "gray", 
    label: t('generate.colors.gray'), 
    colors: ["#6B7280", "#4B5563", "#374151"], 
    gradient: "from-gray-500 to-gray-600",
    description: t('generate.colors.grayDesc')
  }
];

