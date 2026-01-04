import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

export function usePromptEnhancement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  const enhance = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim()) {
      toast({
        title: t('generate.errors.inputContent'),
        description: t('generate.errors.inputPPTDescription'),
        variant: "destructive",
      });
      return null;
    }

    setIsGeneratingOutline(true);
    
    try {
      const response = await fetch("/api/chat/openrouter/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model: "openai/gpt-3.5-turbo"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${t('generate.errors.apiRequestFailed')}: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let enhancedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                enhancedContent += content;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      return enhancedContent.trim() || null;

    } catch (error: any) {
      console.error(t('generate.errors.promptEnhancementFailed'), error);
      toast({
        title: t('generate.errors.enhancementFailed'),
        description: error.message || t('generate.errors.enhancementError'),
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingOutline(false);
    }
  }, [t, toast]);

  return {
    isGeneratingOutline,
    enhance,
  };
}

