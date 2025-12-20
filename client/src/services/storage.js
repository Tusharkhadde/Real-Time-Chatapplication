const KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  SETTINGS: 'settings'
};

export const storage = {
  // Generic get/set methods
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return localStorage.getItem(key);
    }
  },
  
  set: (key, value) => {
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },

  // Token
  getToken: () => localStorage.getItem(KEYS.TOKEN),
  setToken: (token) => localStorage.setItem(KEYS.TOKEN, token),
  removeToken: () => localStorage.removeItem(KEYS.TOKEN),

  // User
  getUser: () => {
    try {
      const user = localStorage.getItem(KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(KEYS.USER, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(KEYS.USER),

  // Theme
  getTheme: () => localStorage.getItem(KEYS.THEME) || 'system',
  setTheme: (theme) => localStorage.setItem(KEYS.THEME, theme),

  // Settings
  getSettings: () => {
    try {
      const settings = localStorage.getItem(KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  },
  setSettings: (settings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)),

  // Clear all auth data
  clear: () => {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.USER);
  },
  
  // Clear everything
  clearAll: () => {
    localStorage.clear();
  }
};

export default storage;