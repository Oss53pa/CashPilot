import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/app.store';

export function GeneralSettings() {
  const { t, i18n } = useTranslation();
  const { theme, locale, setTheme, setLocale } = useAppStore();

  const handleLocaleChange = (value: string) => {
    const newLocale = value as 'fr' | 'en';
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setTheme(newTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language', 'Language')}</CardTitle>
          <CardDescription>
            {t('settings.languageDesc', 'Choose your preferred language for the application.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="language-select" className="w-32">
              {t('settings.language', 'Language')}
            </Label>
            <Select value={locale} onValueChange={handleLocaleChange}>
              <SelectTrigger className="w-48" id="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Francais</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.theme', 'Theme')}</CardTitle>
          <CardDescription>
            {t('settings.themeDesc', 'Toggle between light and dark mode.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>{t('settings.darkMode', 'Dark Mode')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.darkModeDesc', 'Use dark theme for the application.')}
              </p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={handleThemeChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dateFormat', 'Date Format')}</CardTitle>
          <CardDescription>
            {t('settings.dateFormatDesc', 'Choose how dates are displayed.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="w-32">{t('settings.format', 'Format')}</Label>
            <Select defaultValue="dd/mm/yyyy">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.defaultCurrency', 'Default Currency')}</CardTitle>
          <CardDescription>
            {t('settings.defaultCurrencyDesc', 'Set the default currency for new entries.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="w-32">{t('settings.currency', 'Currency')}</Label>
            <Select defaultValue="XOF">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XOF">XOF - CFA Franc BCEAO</SelectItem>
                <SelectItem value="XAF">XAF - CFA Franc BEAC</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
