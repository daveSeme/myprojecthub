
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { getProfile } from '@/lib/firestore';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);
        setUser(firebaseUser);
        setProfile(null);

        try {
          if (!firebaseUser) {
            return;
          }

          const userProfile = await getProfile(firebaseUser.uid);

          if (userProfile) {
            setProfile(userProfile);
          } else {
            console.warn(
              'Firebase user exists but no Firestore profile was found:',
              firebaseUser.uid
            );
          }
        } catch (error) {
          console.error(
            'Failed to load user profile:',
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  async function logout() {
    if (!auth) return;

    await signOut(auth);

    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

