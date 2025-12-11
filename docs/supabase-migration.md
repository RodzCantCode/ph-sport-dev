# Migración a Supabase - Autenticación

Este documento contiene el código de referencia para migrar la autenticación de demo mode (sessionStorage) a Supabase.

## Función getCurrentUser()

### Implementación actual (Demo Mode)
La función actual lee desde `sessionStorage` cuando `shouldUseMockData()` retorna `true`.

### Implementación futura (Supabase)

```typescript
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  
  if (!profile) return null;
  
  // Mapear role de Supabase ('ADMIN' | 'DESIGNER') a nuestro formato
  const role = profile.role === 'ADMIN' ? 'admin' : 'designer';
  
  return {
    id: user.id,
    email: user.email || '',
    name: profile.full_name || user.email?.split('@')[0] || '',
    role: role as 'designer' | 'manager' | 'admin',
  };
}
```

### Notas importantes

1. **Cambio de síncrono a asíncrono**: La función pasará de ser síncrona a asíncrona, por lo que todos los lugares donde se llama necesitarán usar `await`.

2. **Llamadas en componentes**: Actualmente se llama en `useEffect` y durante render. Con Supabase, todas las llamadas deberán ser asíncronas.

3. **Manejo de errores**: Agregar try-catch para manejar errores de red o de Supabase.

4. **Caché**: Considerar implementar caché para evitar múltiples llamadas a Supabase.

### Archivos que necesitan actualización

- `lib/auth/get-current-user.ts` - Función principal
- `components/layout/sidebar.tsx` - Llamada en useEffect
- `components/layout/user-menu.tsx` - Llamada en useEffect
- `app/my-week/page.tsx` - Llamada en loadTasks
- Cualquier otro componente que use `getCurrentUser()`







