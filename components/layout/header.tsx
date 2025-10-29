'use client';

import { Sun, Moon, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/demo-mode';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDemo(isDemoMode());
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {isDemo && (
          <Badge variant="default" className="gap-2">
            <TestTube className="h-3 w-3" />
            DEMO MODE
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Alternar tema</span>
        </Button>
      </div>
    </div>
  );
}


