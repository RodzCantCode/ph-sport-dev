'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      // Autenticar con Supabase
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

      // Verificar que el usuario tiene perfil
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

      // Redirigir con recarga completa para garantizar estado limpio
      // Esto es estándar en producción para flujos de autenticación
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
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <Card className="p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-primary mb-2">
              PH Sport
            </h2>
            <p className="text-muted-foreground">
              Inicia sesión en tu cuenta
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ¿No tienes cuenta? Regístrate
              </Link>
            </div>

            {error && (
              <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}

