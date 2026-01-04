import { DEFAULT_MODELS, ServiceProvider } from "./constants";

const CustomSeq = {
  val: -1000, //To ensure the custom model located at front, start from -1000, refer to constant.ts
  cache: new Map<string, number>(),
  next: (id: string) => {
    if (CustomSeq.cache.has(id)) {
      return CustomSeq.cache.get(id) as number;
    } else {
      let seq = CustomSeq.val++;
      CustomSeq.cache.set(id, seq);
      return seq;
    }
  },
};

const customProvider = (providerName: string) => ({
  id: providerName.toLowerCase(),
  providerName: providerName,
  providerType: "custom",
  sorted: CustomSeq.next(providerName),
});

/**
 * get model name and provider from a formatted string,
 * e.g. `gpt-4@OpenAi` or `claude-3-5-sonnet@20240620@Google`
 * @param modelWithProvider model name with provider separated by last `@` char,
 * @returns [model, provider] tuple, if no `@` char found, provider is undefined
 */
export function getModelProvider(modelWithProvider: string): [string, string?] {
  const [model, provider] = modelWithProvider.split(/@(?!.*@)/);
  return [model, provider];
}

export function isModelNotavailableInServer(
  customModels: string,
  model: string,
  serviceProvider: string,
): boolean {
  if (!customModels || !model) {
    return false;
  }

  const models = customModels.split(",").map((m) => m.trim());
  const isAllowed = models.some((m) => {
    if (m.startsWith("-")) {
      // 禁止的模型
      const bannedModel = m.slice(1);
      return model.includes(bannedModel) || bannedModel.includes(model);
    } else {
      // 允许的模型
      return model.includes(m) || m.includes(model);
    }
  });

  // 如果没有明确允许的模型，则检查是否有禁止的模型
  const hasAllowedModels = models.some((m) => !m.startsWith("-"));
  if (!hasAllowedModels) {
    return !isAllowed;
  }

  return !isAllowed;
}

export function isGPT4Model(modelName: string): boolean {
  return modelName.startsWith("gpt-4") || 
         modelName.startsWith("chatgpt-4o") || 
         modelName.startsWith("o1") || 
         modelName.startsWith("o3");
}

export function isVisionModel(modelName: string): boolean {
  const visionModels = [
    "gpt-4-vision-preview",
    "gpt-4-turbo",
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-opus",
    "claude-3-sonnet", 
    "claude-3-haiku",
    "claude-3-5-sonnet",
    "claude-3-5-haiku",
    "gemini-pro-vision",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ];
  
  return visionModels.some(model => modelName.includes(model));
}
