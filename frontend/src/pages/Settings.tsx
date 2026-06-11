import React, { useState, useEffect } from 'react';
import { User, HardDrive, Globe, Cpu, AlertTriangle, Check, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/card';
import { useThemeStore, THEME_COLORS } from '../store/themeStore';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme, accentColor, setAccentColor } = useThemeStore();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [nvidiaKey, setNvidiaKey] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const { t } = useTranslation();
  
  useEffect(() => {
    api.get('/intelligence/settings').then(res => {
      if (res.data?.githubToken) {
        setGithubToken(res.data.githubToken);
      }
      if (res.data?.preferences?.nvidiaKey) {
        setNvidiaKey(res.data.preferences.nvidiaKey);
      }
    }).catch(console.error);
  }, []);

  const handleSave = () => {
    setSaveStatus(t('settings.saving'));
    setTimeout(() => {
      setSaveStatus(t('settings.saved'));
      setTimeout(() => setSaveStatus(null), 3000);
    }, 500);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: t('settings.passwordsMismatch', 'Les mots de passe ne correspondent pas') });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: t('settings.passwordTooShort', 'Le mot de passe doit faire au moins 6 caractères') });
      return;
    }
    
    setPasswordStatus(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPassword || undefined,
        newPassword
      });
      setPasswordStatus({ type: 'success', msg: t('settings.passwordChanged', 'Mot de passe modifié avec succès') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 4000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err.response?.data?.message || 'Erreur lors de la modification du mot de passe' });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl mx-auto pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-1">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </header>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User size={20} /> {t('settings.profile')}</CardTitle>
            <CardDescription>{t('settings.profileDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.name')}</label>
              <input 
                type="text" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                defaultValue={user?.name || "User Name"} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.email')}</label>
              <input 
                type="email" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                defaultValue={user?.email || "user@example.com"} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave}>{t('settings.saveChanges')}</Button>
            {saveStatus && <span className="ml-4 text-sm text-muted-foreground">{saveStatus}</span>}
          </CardFooter>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock size={20} /> Sécurité</CardTitle>
            <CardDescription>Modifiez votre mot de passe pour sécuriser votre compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {passwordStatus && (
                <div className={`p-3 rounded-md text-sm ${passwordStatus.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>
                  {passwordStatus.msg}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mot de passe actuel</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  placeholder="Laisser vide si connecté via Google"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button type="submit" variant="secondary" className="mt-2">
                Mettre à jour le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{t('settings.appearance')}</CardTitle>
            <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`p-1 border-2 rounded-lg ${theme === 'light' ? 'border-primary' : 'border-transparent'}`}
              >
                <div className="w-24 h-16 rounded-md bg-white border border-slate-200 overflow-hidden relative">
                  <div className="absolute top-0 w-full h-4 bg-slate-100 border-b border-slate-200"></div>
                  <div className="absolute top-4 left-0 w-6 h-full bg-slate-50 border-r border-slate-200"></div>
                </div>
                <span className="text-xs font-medium mt-2 block text-center">{t('settings.light')}</span>
              </button>
              
              <button 
                onClick={() => setTheme('dark')}
                className={`p-1 border-2 rounded-lg ${theme === 'dark' ? 'border-primary' : 'border-transparent'}`}
              >
                <div className="w-24 h-16 rounded-md bg-slate-950 border border-slate-800 overflow-hidden relative">
                  <div className="absolute top-0 w-full h-4 bg-slate-900 border-b border-slate-800"></div>
                  <div className="absolute top-4 left-0 w-6 h-full bg-slate-900 border-r border-slate-800"></div>
                </div>
                <span className="text-xs font-medium mt-2 block text-center">{t('settings.dark')}</span>
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">{t('settings.accentColor')}</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(THEME_COLORS).map(([colorName, hslValue]) => (
                  <button
                    key={colorName}
                    onClick={() => setAccentColor(hslValue)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === hslValue ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: `hsl(${hslValue})` }}
                    title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu size={20} /> {t('settings.aiConfig')}</CardTitle>
            <CardDescription>{t('settings.aiConfigDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.nvidiaKey')}</label>
              <input 
                type="password" 
                value={nvidiaKey}
                onChange={e => setNvidiaKey(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                placeholder="nvapi-..." 
              />
              <p className="text-xs text-muted-foreground">{t('settings.nvidiaKeyDesc')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.modelPref')}</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option>meta/llama-3.1-70b-instruct</option>
                <option>nvidia/nemotron-4-340b-instruct</option>
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => {
              api.patch('/intelligence/settings', { preferences: { nvidiaKey } }).then(() => {
                setSaveStatus(t('settings.saved'));
                setTimeout(() => setSaveStatus(null), 3000);
              });
            }}>{t('settings.saveAI')}</Button>
          </CardFooter>
        </Card>

        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{t('settings.integrations')}</CardTitle>
            <CardDescription>{t('settings.integrationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{t('settings.googleDrive')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.notConnected')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t('settings.connectBtn')}</Button>
            </div>

            <div className="flex flex-col gap-3 p-4 border border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-foreground/10 text-foreground rounded-full flex items-center justify-center">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">GitHub</h4>
                    <p className="text-xs text-primary flex items-center gap-1">
                      {githubToken ? <><Check size={12} /> {t('settings.connected')}</> : t('settings.notConnected')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-medium">{t('settings.githubToken')}</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      api.patch('/intelligence/settings', { githubToken }).then(() => {
                        setSaveStatus(t('settings.saved'));
                        setTimeout(() => setSaveStatus(null), 3000);
                      });
                    }}
                  >
                    {t('settings.saveChanges')}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">{t('settings.githubTokenDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail size={20} /> {t('settings.emailReports')}</CardTitle>
            <CardDescription>{t('settings.emailReportsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('settings.emailReportsInfo')}
            </p>
            <div className="flex items-center gap-4">
              <Button 
                variant="secondary"
                onClick={async () => {
                  setSaveStatus(t('settings.saving'));
                  try {
                    const res = await api.post('/weekly-report/test-send');
                    setSaveStatus(res.data.message || t('settings.reportSent'));
                  } catch {
                    setSaveStatus(t('settings.reportFailed'));
                  }
                  setTimeout(() => setSaveStatus(null), 3000);
                }}
              >
                {t('settings.sendTest')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle size={20} /> {t('settings.dangerZone')}</CardTitle>
            <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{t('settings.deleteWarn')}</p>
            <Button variant="destructive">{t('settings.deleteAcc')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
