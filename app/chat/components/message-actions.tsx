"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  RotateCcw, 
  Trash2, 
  Pin, 
  Check,
  PinOff
} from "lucide-react";

import { ChatMessage } from "../types/chat";
import { copyToClipboard } from "../utils/message-utils";
import { useState } from "react";

interface MessageActionsProps {
  message: ChatMessage;
  onRetry?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onCopy?: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

export function MessageActions({
  message,
  onRetry,
  onDelete,
  onPin,
  onCopy,
  isStreaming = false,
  onStop,
}: MessageActionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onCopy?.();
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        title={t('common.copy')}
      >
        {copied ? (
          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        ) : (
          <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        )}
      </Button>
      
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          title={t('common.retry')}
        >
          <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Button>
      )}
      
      {onPin && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onPin}
          className={`h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            message.pinned ? 'text-blue-600 dark:text-blue-400' : ''
          }`}
          title={message.pinned ? t('common.unpin', '取消固定') : t('common.pin')}
        >
          {message.pinned ? (
            <PinOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          ) : (
            <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          )}
        </Button>
      )}
      
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          title={t('common.delete')}
        >
          <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Button>
      )}
    </div>
  );
}
