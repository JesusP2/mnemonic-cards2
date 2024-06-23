import { useState } from 'react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export function ThemeSwitch() {
  const [theme, setTheme] = useState('light');
  return (
    <div suppressHydrationWarning>
      <Label htmlFor="theme-switch">Dark mode</Label>
      <Switch
        id="theme-switch"
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  );
}
