"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Plus,
  Bot,
  Trash2,
  Sparkles
} from "lucide-react";
import { useChatStore } from "../store/chat-store";
import { ChatSession } from "../types/chat";

interface SideBarProps {
  onClose?: () => void;
}

export function SideBar({ onClose }: SideBarProps) {
  const { t } = useTranslation();
  const {
    sessions,
    currentSessionIndex,
    newSession,
    selectSession,
    deleteSession,
  } = useChatStore();

  const startNewChat = () => {
    newSession();
    // 移动端创建新会话后关闭侧边栏
    if (onClose) {
      onClose();
    }
  };

  const handleDeleteChat = (index: number) => {
    deleteSession(index);
  };

  return (
    <div className="w-64 sm:w-72 lg:w-64 h-full bg-white/80 backdrop-blur-sm border-r border-[#C7D2FE] dark:bg-[#1F2937]/80 dark:border-[#374151] flex flex-col shadow-[0_4px_6px_rgba(99,102,241,0.1)] dark:shadow-[0_4px_6px_rgba(99,102,241,0.2)]">

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 relative">
        {sessions.map((session, index) => (
          <div
            key={session.id || index}
            className={`flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 group ${
              index === currentSessionIndex
                ? "bg-gradient-to-r from-[#C7D2FE] to-[#EEF2FF] dark:from-[#3730A3] dark:to-[#1F2937] text-[#4F46E5] dark:text-white shadow-[0_4px_6px_rgba(99,102,241,0.1)] dark:shadow-[0_4px_6px_rgba(99,102,241,0.2)]" 
                : "hover:bg-[#F9FAFB] dark:hover:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]"
            }`}
            onClick={() => {
              selectSession(index);
              // 移动端选择会话后关闭侧边栏
              if (onClose) {
                onClose();
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                index === currentSessionIndex
                  ? "bg-[#6366F1] text-white" 
                  : "bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]"
              }`}>
                <Bot className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-medium">{session.topic}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChat(index);
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button 
          onClick={startNewChat}
          className="w-[90%] absolute bottom-0 left-[50%] translate-x-[-50%] justify-start rounded gap-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#3730A3] text-white shadow-[0_8px_16px_rgba(99,102,241,0.15)] border-0 mb-3"
        >
          <Plus className="h-4 w-4" />
          {t('chat.newChat')}
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#C7D2FE] dark:border-[#374151]">
        
        <div className="text-xs text-[#9CA3AF] dark:text-[#6B7280] text-center">
          {t('chat.poweredBy', 'Powered by PPTKing')}
        </div>
      </div>
    </div>
  );
}
