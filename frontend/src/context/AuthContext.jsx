import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

import axios from '../api/axios';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Suppression de la session locale
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Vérification de la session auprès du backend
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const response = await axios.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const userData = response.data.user || response.data;

      if (!userData?.user_id) {
        throw new Error('Profil utilisateur invalide.');
      }

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      // Ne pas supprimer la session pour une panne réseau
      // ou une erreur temporaire du serveur.
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
      }

      return null;
    }
  }, [logout]);

  // Initialisation de la session
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          return;
        }

        const response = await axios.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!active) return;

        const userData = response.data.user || response.data;

        if (!userData?.user_id) {
          throw new Error('Profil utilisateur invalide.');
        }

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        if (!active) return;

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          logout();
        }

        console.error(
          'Vérification de session impossible :',
          error.message
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [logout]);

  // Connexion
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      const userData = response.data.user;
      const token = response.data.token;

      if (!token || !userData?.user_id) {
        return {
          success: false,
          message: 'Réponse de connexion invalide.'
        };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Identifiants invalides ou erreur serveur.'
      };
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isSO = user?.role === 'user';

  const authValues = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isSO,
    isAuthenticated: Boolean(user)
  }), [
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isSO
  ]);

  return (
    <AuthContext.Provider value={authValues}>
      {!loading && children}
    </AuthContext.Provider>
  );
};