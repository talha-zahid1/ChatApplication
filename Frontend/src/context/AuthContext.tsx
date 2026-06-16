import { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from 'react';
import { tokenStorage } from '../utils/tokenStorage';
import { authApi, type RegisterRequest } from '../api/auth';
import { profileApi } from '../api/profile';

interface UserState {
  id: number;
  username: string;
  email: string;
  profilePic: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: UserState | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfileState: (updates: Partial<Pick<UserState, 'profilePic' | 'bio'>>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserProfile = useCallback(async (userId: number, username: string, email: string) => {
    let profilePic: string | null = null;
    let bio: string | null = null;

    try {
      const picRes = await profileApi.getProfilePic();
      if (picRes.status) {
        profilePic = picRes.profile_url || picRes.url || null;
      }
    } catch {
      // Gracefully ignore profile pic 404/failure
    }

    try {
      const bioRes = await profileApi.getBio();
      if (bioRes.status) {
        bio = bioRes.bio || null;
      }
    } catch {
      // Gracefully ignore bio 404/failure
    }

    setUser({
      id: userId,
      username,
      email,
      profilePic,
      bio,
    });
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    setUser(null);
    window.dispatchEvent(new Event('chat-ws-disconnect'));
  }, []);

  const initializeAuth = useCallback(async () => {
    const tokens = tokenStorage.getTokens();
    if (tokens) {
      try {
        // ✅ FIX: JWT se username nahi milta, /get-user/ se lete hain
        const userRes = await authApi.getUser();
        await loadUserProfile(userRes.user_id, userRes.username, userRes.email);
      } catch {
        tokenStorage.clearTokens();
      }
    }
    setLoading(false);
  }, [loadUserProfile]);

  useEffect(() => {
    void initializeAuth();

    const handleLogoutEvent = () => {
      logout();
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [initializeAuth, logout]);

  const login = async (credentials: Record<string, string>) => {
    setLoading(true);
    try {
      const tokens = await authApi.login(credentials);
      tokenStorage.setTokens(tokens);
      // ✅ FIX: login ke baad bhi /get-user/ call karo
      const userRes = await authApi.getUser();
      await loadUserProfile(userRes.user_id, userRes.username, userRes.email);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.status && res.tokens) {
        tokenStorage.setTokens(res.tokens);
        setUser({
          id: Number(res.user_id),
          username: res.username,
          email: res.email,
          profilePic: null,
          bio: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (updates: Partial<Pick<UserState, 'profilePic' | 'bio'>>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadUserProfile(user.id, user.username, user.email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateProfileState,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};