import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "auto";

export interface AppConfig {
  theme: Theme;
  fontSize: number;
  fontFamily: string;
  autoGenerateTitle: boolean;
  sendPreviewBubble: boolean;
  enableAutoTitle: boolean;
  tightBorder: boolean;
  sendBotMessages: boolean;
  submitKey: "Enter" | "Ctrl+Enter" | "Shift+Enter";
  avatar: string;
  
  // Model settings
  modelConfig: {
    model: string;
    apiKey?: string;
    temperature: number;
    top_p: number;
    max_tokens: number;
    presence_penalty: number;
    frequency_penalty: number;
    historyMessageCount: number;
    compressMessageLengthThreshold: number;
    sendMemory: boolean;
    stream: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "auto",
  fontSize: 14,
  fontFamily: "system-ui",
  autoGenerateTitle: true,
  sendPreviewBubble: true,
  enableAutoTitle: true,
  tightBorder: false,
  sendBotMessages: true,
  submitKey: "Enter",
  avatar: "🤖",
  
  modelConfig: {
    model: "Qwen/Qwen2.5-72B-Instruct",
    apiKey: "",
    temperature: 0.7,
    top_p: 1,
    max_tokens: 4000,
    presence_penalty: 0,
    frequency_penalty: 0,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 1000,
    sendMemory: true,
    stream: true,
  },
};

export interface AppConfigStore {
  config: AppConfig;
  updateConfig: (updater: (config: AppConfig) => void) => void;
  resetConfig: () => void;
  mergeModels: (models: any[]) => void;
}

export const useAppConfig = create<AppConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,

      updateConfig(updater) {
        const config = { ...get().config };
        updater(config);
        set({ config });
      },

      resetConfig() {
        set({ config: DEFAULT_CONFIG });
      },

      mergeModels(models) {
        // This would merge available models - simplified for now
        console.log("Merging models:", models);
      },
    }),
    {
      name: "app-config",
    },
  ),
);

// Convenience hook to get just the config
export const useAppConfigValue = () => useAppConfig((state) => state.config);
