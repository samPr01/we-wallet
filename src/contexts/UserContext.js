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
    const loadUserData = async () => {
      const savedUserId = localStorage.getItem('walletbase_userId');
      const savedWalletAddress = localStorage.getItem('walletbase_walletAddress');
    
      if (savedUserId) {
        setUserId(savedUserId);
      }
      if (savedWalletAddress && typeof savedWalletAddress === 'string') {
        // Validate the saved wallet address before setting it
        try {
          if (savedWalletAddress.startsWith('0x') && savedWalletAddress.length === 42) {
            // Try to get the proper checksum format
            try {
              const { ethers } = await import('ethers');
              const checksumAddress = ethers.getAddress(savedWalletAddress);
              setWalletAddress(checksumAddress);
              // Update localStorage with corrected address
              localStorage.setItem('walletbase_walletAddress', checksumAddress);
            } catch (ethersError) {
              console.warn('Failed to import ethers for address validation:', ethersError);
              // Set the address as-is if ethers is not available
              setWalletAddress(savedWalletAddress);
            }
          } else {
            console.warn('Invalid wallet address format in localStorage:', savedWalletAddress);
            // Clear invalid address
            localStorage.removeItem('walletbase_walletAddress');
            localStorage.removeItem('walletbase_userId');
          }
        } catch (error) {
          console.warn('Failed to validate saved wallet address:', error);
          // Clear invalid address
          localStorage.removeItem('walletbase_walletAddress');
          localStorage.removeItem('walletbase_userId');
        }
      }
    };
    
    loadUserData();
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

  const updateUser = async (newUserId, newWalletAddress) => {
    // Validate wallet address before setting
    if (newWalletAddress && typeof newWalletAddress === 'string') {
      try {
        const { ethers } = await import('ethers');
        if (ethers.isAddress(newWalletAddress)) {
          const checksumAddress = ethers.getAddress(newWalletAddress);
          setUserId(newUserId);
          setWalletAddress(checksumAddress);
        } else {
          console.error('Invalid wallet address provided to updateUser:', newWalletAddress);
        }
      } catch (error) {
        console.error('Failed to validate wallet address in updateUser:', error);
        // Set the address as-is if validation fails
        setUserId(newUserId);
        setWalletAddress(newWalletAddress);
      }
    } else {
      setUserId(newUserId);
      setWalletAddress('');
    }
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
