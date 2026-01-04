export function getClientConfig() {
  if (typeof document !== "undefined") {
    // Try to get config from meta tag (set by server)
    const configElement = document.querySelector('meta[name="config"]');
    if (configElement) {
      try {
        return JSON.parse(configElement.getAttribute("content") || "{}");
      } catch (e) {
        console.error("[Config] failed to parse client config", e);
      }
    }
  }

  // Default client config
  return {
    version: "1.0.0",
    buildMode: "standalone",
    isApp: false,
    needCode: false,
    hideUserApiKey: false,
    hideBalanceQuery: true,
    disableGPT4: false,
    disableFastLink: false,
    customModels: "",
    defaultModel: "",
  };
}
