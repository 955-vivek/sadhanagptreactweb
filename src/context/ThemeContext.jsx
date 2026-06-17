import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
    console.log("Theme applied to DOM:", theme);
    console.log("Current documentElement classes:", root.classList);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log("Theme toggled from", prevTheme, "to", nextTheme);
      return nextTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
