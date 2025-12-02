'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

      // Redirigir según rol
      if (profile.role === 'ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/my-week');
      }
    } catch (_err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <Card className="glass-effect-strong p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
              PH Sport Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Inicia sesión en tu cuenta
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="glass-effect w-full px-4 py-3 rounded-lg placeholder-gray-500 dark:placeholder-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200/20 dark:focus:border-white/20 transition-all duration-300"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="glass-effect w-full px-4 py-3 rounded-lg placeholder-gray-500 dark:placeholder-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200/20 dark:focus:border-white/20 transition-all duration-300"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 shadow-lg hover-lift transition-all duration-500 ease-in-out"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>

            {error && (
              <div className="p-3 glass-effect border border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}

