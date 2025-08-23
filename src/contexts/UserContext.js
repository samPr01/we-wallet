'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('walletbase_userId');
    const savedWalletAddress = localStorage.getItem('walletbase_walletAddress');
    
    if (savedUserId) {
      setUserId(savedUserId);
    }
    if (savedWalletAddress) {
      setWalletAddress(savedWalletAddress);
    }
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('walletbase_userId', userId);
    }
    if (walletAddress) {
      localStorage.setItem('walletbase_walletAddress', walletAddress);
    }
  }, [userId, walletAddress]);

  const updateUser = (newUserId, newWalletAddress) => {
    setUserId(newUserId);
    setWalletAddress(newWalletAddress);
  };

  const clearUser = () => {
    setUserId('');
    setWalletAddress('');
    localStorage.removeItem('walletbase_userId');
    localStorage.removeItem('walletbase_walletAddress');
  };

  const value = {
    userId,
    walletAddress,
    updateUser,
    clearUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
