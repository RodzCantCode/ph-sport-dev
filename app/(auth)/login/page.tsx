'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'Email o contraseña incorrectos' 
          : authError.message);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('Usuario sin perfil configurado. Contacta al administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.role === 'ADMIN') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/my-week';
      }
    } catch {
      setError('Error al iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Iniciar Sesión
      </h1>
      <p className="text-muted-foreground mb-8">
        Accede a tu cuenta de PH Sport
      </p>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button 
              type="button" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="h-11"
          />
        </div>

        {error && (
          <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>
      </form>
    </div>
  );
}
