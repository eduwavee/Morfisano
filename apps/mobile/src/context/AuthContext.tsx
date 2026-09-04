import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  /** true mientras se lee la sesión guardada al abrir la app. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Devuelve true si Supabase ya dejó al usuario adentro; false si falta confirmar el mail. */
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Supabase devuelve los errores de auth en inglés y bastante crípticos.
 * Los traducimos a algo que se pueda mostrar tal cual en pantalla.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Mail o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Todavía no confirmaste tu mail. Revisá tu casilla.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese mail.';
  if (m.includes('password should be at least')) {
    return 'La contraseña tiene que tener al menos 6 caracteres.';
  }
  if (m.includes('unable to validate email address') || m.includes('invalid email')) {
    return 'Ese mail no parece válido.';
  }
  if (m.includes('email rate limit') || m.includes('rate limit')) {
    return 'Demasiados intentos seguidos. Esperá un rato y volvé a probar.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'No pudimos conectarnos. Revisá tu conexión.';
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión guardada de la última vez (si vencío, supabase-js la refresca solo).
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    // A partir de acá, la fuente de verdad son los eventos: login, logout,
    // refresh del token y expiración quedan todos cubiertos.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(translateAuthError(error.message));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) throw new Error(translateAuthError(error.message));
    // Si el proyecto pide confirmación por mail, Supabase devuelve el usuario
    // creado pero sin sesión: no se puede entrar hasta que confirme.
    return data.session !== null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
