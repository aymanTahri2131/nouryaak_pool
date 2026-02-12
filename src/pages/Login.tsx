import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getAccessToken } from '@/apis';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, t } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken() && currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('Please fill in all fields', 'Veuillez remplir tous les champs', 'يرجى ملء جميع الحقول'));
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.login(email, password);
      setCurrentUser(user);
      toast.success(t('Welcome back!', 'Bienvenue!', 'مرحباً بعودتك!'));
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Login failed', 'Connexion échouée', 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error(t('PIN must be 4 digits', 'Le PIN doit contenir 4 chiffres', 'يجب أن يتكون رمز PIN من 4 أرقام'));
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.pinLogin(pin);
      setCurrentUser(user);
      toast.success(t('Welcome back!', 'Bienvenue!', 'مرحباً بعودتك!'));
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Invalid PIN', 'PIN invalide', 'رمز الدخول غير صحيح'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center">
            <img src="/NooryakBg.png" alt="Nouryaak Pool" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-2xl">{t('Nouryaak Pool', 'Nouryaak Pool', 'نورياك بول')}</CardTitle>
          <CardDescription>
            {t('Sign in to continue', 'Connectez-vous pour continuer', 'سجل الدخول للمتابعة')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin">{t('PIN', 'PIN', 'رمز الدخول')}</TabsTrigger>
              <TabsTrigger value="email">{t('Email', 'Email', 'البريد الإلكتروني')}</TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="mt-6">
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">{t('4-digit PIN', 'PIN à 4 chiffres', 'رمز الدخول المكون من 4 أرقام')}</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-[0.5em]"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('Signing in...', 'Connexion...', 'جاري تسجيل الدخول...') : t('Sign in', 'Se connecter', 'تسجيل الدخول')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('Email', 'Email', 'البريد الإلكتروني')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nouryaak-pool.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('Password', 'Mot de passe', 'كلمة المرور')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('Signing in...', 'Connexion...', 'جاري تسجيل الدخول...') : t('Sign in', 'Se connecter', 'تسجيل الدخول')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t('Demo: PIN 0000 or admin@nouryaak-pool.local / admin123', 'Démo: PIN 0000 ou admin@nouryaak-pool.local / admin123', 'تجربة: PIN 0000 أو admin@nouryaak-pool.local / admin123')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
