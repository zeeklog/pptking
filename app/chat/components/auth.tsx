"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccessStore } from "../store";
import { Bot, Key, Shield } from "lucide-react";

export function AuthPage() {
  const { t } = useTranslation();
  const [accessCode, setAccessCode] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateCode, updateToken } = useAccessStore();

  const handleAccessCodeSubmit = async () => {
    if (!accessCode.trim()) {
      setError(t('chat.auth.accessCodeRequired'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 这里可以添加访问码验证逻辑
      updateCode(accessCode);
      // 模拟验证成功
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setError(t('chat.auth.validationError'));
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      setError(t('chat.auth.apiKeyRequired'));
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      setError(t('chat.auth.invalidApiKey'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 验证API密钥
      const response = await fetch("/api/chat/openai/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        updateToken(apiKey);
        setError("");
      } else {
        setError(t('chat.auth.validationError'));
      }
    } catch (error) {
      setError(t('chat.error.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl text-white font-bold shadow-lg w-16 h-16 text-2xl">
              <Bot className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PPT Visionary AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('chat.title')}
          </p>
        </div>

        {/* Access Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('chat.auth.accessCode')}
            </CardTitle>
            <CardDescription>
              {t('chat.auth.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">{t('chat.auth.accessCode')}</Label>
              <Input
                id="access-code"
                type="password"
                placeholder={t('chat.auth.accessCodePlaceholder')}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAccessCodeSubmit()}
              />
            </div>
            <Button 
              onClick={handleAccessCodeSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('chat.auth.validating') : t('chat.auth.validateAccessCode')}
            </Button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-2 text-gray-500">
              {t('chat.auth.or')}
            </span>
          </div>
        </div>

        {/* API Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('chat.auth.apiKey')}
            </CardTitle>
            <CardDescription>
              {t('chat.auth.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">{t('chat.auth.apiKey')}</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={t('chat.auth.apiKeyPlaceholder')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleApiKeySubmit()}
              />
              <p className="text-xs text-gray-500">
                {t('chat.auth.privacyNote')}
              </p>
            </div>
            <Button 
              onClick={handleApiKeySubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('chat.auth.validating') : t('chat.auth.validateApiKey')}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>{t('footer.privacyPolicy')} & {t('footer.serviceTerms')}</p>
        </div>
      </div>
    </div>
  );
}
