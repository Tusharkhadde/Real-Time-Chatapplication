import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@services/api';
import storage from '@services/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = storage.getToken();
        const savedUser = storage.getUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);

          // Verify token is still valid
          try {
            const response = await authAPI.getMe();
            if (response.data.success) {
              setUser(response.data.data);
              storage.setUser(response.data.data);
            }
          } catch (err) {
            console.log('Token invalid, clearing...');
            storage.clear();
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      console.log('AuthContext register:', userData);

      // Ensure we're sending a proper object
      const payload = {
        username: String(userData.username).trim(),
        email: String(userData.email).trim().toLowerCase(),
        password: String(userData.password)
      };

      const response = await authAPI.register(payload);
      
      console.log('Register response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        storage.setToken(newToken);
        storage.setUser(newUser);
        setToken(newToken);
        setUser(newUser);

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Register error:', err);
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      console.log('AuthContext login:', { email: credentials.email });

      // Ensure we're sending a proper object
      const payload = {
        email: String(credentials.email).trim().toLowerCase(),
        password: String(credentials.password)
      };

      const response = await authAPI.login(payload);
      
      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        storage.setToken(newToken);
        storage.setUser(newUser);
        setToken(newToken);
        setUser(newUser);

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      storage.clear();
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateUser,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;