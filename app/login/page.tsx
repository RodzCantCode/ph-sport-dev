'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockUsers } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Buscar usuario en mockUsers por email
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    // Si no existe, crear uno temporal basado en el email
    const userData = user || {
      id: `temp-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: email.includes('eva') || email.includes('manager') || email.includes('admin') 
        ? 'manager' 
        : 'designer',
    };

    sessionStorage.setItem('user', JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    }));

    // Redirigir directamente según rol
    if (userData.role === 'manager' || userData.role === 'admin') {
      router.replace('/dashboard');
    } else {
      router.replace('/my-week');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <Card className="glass-effect-strong p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
              PH Sport Dashboard
            </h2>
            <p className="text-gray-400">
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
                  className="glass-effect w-full px-4 py-3 rounded-lg placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-white/20 transition-all duration-300"
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
                  className="glass-effect w-full px-4 py-3 rounded-lg placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-white/20 transition-all duration-300"
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

            <div className="text-center text-sm text-gray-400">
              Demo: Usa cualquier email/contraseña
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

