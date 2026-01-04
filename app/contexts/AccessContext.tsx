import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessState {
  // SiliconFlow 配置
  siliconflowUrl: string;
  siliconflowApiKey: string;
  
  // OpenAI 配置
  openaiApiKey: string;
  
  // Anthropic 配置
  anthropicApiKey: string;
  
  // 通用配置
  needCode: boolean;
  accessCode: string;
  hideUserApiKey: boolean;
  hideBalanceQuery: boolean;
  disableGPT4: boolean;
  disableFastLink: boolean;
  customModels: string;
  defaultModel: string;
  visionModels: string;
}

interface AccessContextType {
  access: AccessState;
  updateAccess: (updates: Partial<AccessState>) => void;
  isValidSiliconFlow: () => boolean;
  isValidOpenAI: () => boolean;
  isValidAnthropic: () => boolean;
  isAuthorized: () => boolean;
}

const defaultAccessState: AccessState = {
  // SiliconFlow 配置
  siliconflowUrl: "/api/chat/siliconflow",
  siliconflowApiKey: "",
  
  // OpenAI 配置
  openaiApiKey: "",
  
  // Anthropic 配置
  anthropicApiKey: "",
  
  // 通用配置
  needCode: true,
  accessCode: "",
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "Qwen/Qwen2.5-72B-Instruct@SiliconFlow",
  visionModels: "",
};

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [access, setAccess] = useState<AccessState>(() => {
    // 从localStorage加载配置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('access-store');
      if (saved) {
        try {
          return { ...defaultAccessState, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse access store:', e);
        }
      }
    }
    return defaultAccessState;
  });

  // 保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access-store', JSON.stringify(access));
    }
  }, [access]);

  const updateAccess = (updates: Partial<AccessState>) => {
    setAccess(prev => ({ ...prev, ...updates }));
  };

  const isValidSiliconFlow = () => {
    return !!access.siliconflowApiKey;
  };

  const isValidOpenAI = () => {
    return !!access.openaiApiKey;
  };

  const isValidAnthropic = () => {
    return !!access.anthropicApiKey;
  };

  const isAuthorized = () => {
    return (
      isValidSiliconFlow() ||
      isValidOpenAI() ||
      isValidAnthropic() ||
      !access.needCode ||
      (access.needCode && !!access.accessCode)
    );
  };

  const value: AccessContextType = {
    access,
    updateAccess,
    isValidSiliconFlow,
    isValidOpenAI,
    isValidAnthropic,
    isAuthorized,
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
    </AccessContext.Provider>
  );
};
