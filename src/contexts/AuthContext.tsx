import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  profileType: "empresa" | "estudante";
  habilidades?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, profileType: "empresa" | "estudante") => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "squadfinder_users";
const SESSION_KEY = "squadfinder_session";

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  profileType: "empresa" | "estudante";
  habilidades?: string[];
}

const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getUsers = (): StoredUser[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const userData = JSON.parse(sessionData);
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { error: "Usuário não encontrado" };
    }
    
    if (user.passwordHash !== hashPassword(password)) {
      return { error: "Senha incorreta" };
    }

    const sessionUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      profileType: user.profileType,
      habilidades: user.habilidades || [],
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return {};
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    profileType: "empresa" | "estudante"
  ): Promise<{ error?: string }> => {
    const users = getUsers();
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "Este e-mail já está cadastrado" };
    }

    const newUser: StoredUser = {
      id: generateId(),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      profileType,
    };

    saveUsers([...users, newUser]);

    const sessionUser: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      profileType: newUser.profileType,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return {};
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};