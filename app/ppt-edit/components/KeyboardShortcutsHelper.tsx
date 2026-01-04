'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Badge } from '@/components/ui/badge';
import { 
  Keyboard,
  Command,
  HelpCircle
} from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelperProps {
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsHelper({ trigger }: KeyboardShortcutsHelperProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Keyboard className="w-4 h-4 mr-2" />
      快捷键
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh]" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            键盘快捷键
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {KEYBOARD_SHORTCUTS.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Command className="w-4 h-4" />
                  {category.category}
                </h3>
                
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      
                      <div className="flex gap-1">
                        {shortcut.keys.split(/[\s\+\/]/).map((key, keyIndex) => {
                          if (key === '+' || key === '/' || key === '') return null;
                          
                          return (
                            <Badge 
                              key={keyIndex}
                              variant="outline" 
                              className="text-xs font-mono px-2 py-1"
                            >
                              {key}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={() => setIsOpen(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}