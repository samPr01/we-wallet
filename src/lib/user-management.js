// User Management Utility for Admin Panel Integration

const USERS_STORAGE_KEY = 'wewallet_users';
const DEPOSITS_STORAGE_KEY = 'wewallet_deposits';
const WITHDRAWALS_STORAGE_KEY = 'wewallet_withdrawals';

// User data structure
export const createUserData = (userId, walletAddress) => {
  return {
    userId,
    walletAddress,
    joinDate: new Date().toISOString(),
    totalDeposits: 0,
    totalWithdrawals: 0,
    lastActivity: new Date().toISOString(),
    deposits: [],
    withdrawals: []
  };
};

// Store user data in localStorage
export const storeUserData = (userData) => {
  try {
    const existingUsers = getUsersData();
    const userIndex = existingUsers.findIndex(user => user.userId === userData.userId);
    
    if (userIndex >= 0) {
      // Update existing user
      existingUsers[userIndex] = {
        ...existingUsers[userIndex],
        ...userData,
        lastActivity: new Date().toISOString()
      };
    } else {
      // Add new user
      existingUsers.push(userData);
    }
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    console.log('User data stored:', userData);
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Get all users data
export const getUsersData = () => {
  try {
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    return usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('Error getting users data:', error);
    return [];
  }
};

// Store deposit proof submission
export const storeDepositProof = (proofData) => {
  try {
    const existingDeposits = getDepositsData();
    const depositRecord = {
      id: Date.now().toString(),
      userId: proofData.userId,
      walletAddress: proofData.walletAddress,
      token: proofData.token,
      transactionHash: proofData.transactionHash,
      screenshot: proofData.screenshot ? 'Screenshot uploaded' : 'No screenshot',
      submissionDate: proofData.timestamp,
      status: 'pending',
      amount: proofData.amount || 'Not specified'
    };
    
    existingDeposits.push(depositRecord);
    localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(existingDeposits));
    
    // Update user's deposit count
    updateUserDepositCount(proofData.userId);
    
    console.log('Deposit proof stored:', depositRecord);
    return true;
  } catch (error) {
    console.error('Error storing deposit proof:', error);
    return false;
  }
};

// Store withdrawal request
export const storeWithdrawalRequest = (withdrawalData) => {
  try {
    const existingWithdrawals = getWithdrawalsData();
    const withdrawalRecord = {
      id: Date.now().toString(),
      userId: withdrawalData.userId,
      walletAddress: withdrawalData.walletAddress,
      token: withdrawalData.token,
      amount: withdrawalData.amount,
      destinationAddress: withdrawalData.destinationAddress,
      requestDate: new Date().toISOString(),
      status: 'pending'
    };
    
    existingWithdrawals.push(withdrawalRecord);
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(existingWithdrawals));
    
    // Update user's withdrawal count
    updateUserWithdrawalCount(withdrawalData.userId);
    
    console.log('Withdrawal request stored:', withdrawalRecord);
    return true;
  } catch (error) {
    console.error('Error storing withdrawal request:', error);
    return false;
  }
};

// Get deposits data
export const getDepositsData = () => {
  try {
    const depositsData = localStorage.getItem(DEPOSITS_STORAGE_KEY);
    return depositsData ? JSON.parse(depositsData) : [];
  } catch (error) {
    console.error('Error getting deposits data:', error);
    return [];
  }
};

// Get withdrawals data
export const getWithdrawalsData = () => {
  try {
    const withdrawalsData = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
    return withdrawalsData ? JSON.parse(withdrawalsData) : [];
  } catch (error) {
    console.error('Error getting withdrawals data:', error);
    return [];
  }
};

// Update user's deposit count
const updateUserDepositCount = (userId) => {
  try {
    const users = getUsersData();
    const userIndex = users.findIndex(user => user.userId === userId);
    
    if (userIndex >= 0) {
      users[userIndex].totalDeposits += 1;
      users[userIndex].lastActivity = new Date().toISOString();
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch (error) {
    console.error('Error updating user deposit count:', error);
  }
};

// Update user's withdrawal count
const updateUserWithdrawalCount = (userId) => {
  try {
    const users = getUsersData();
    const userIndex = users.findIndex(user => user.userId === userId);
    
    if (userIndex >= 0) {
      users[userIndex].totalWithdrawals += 1;
      users[userIndex].lastActivity = new Date().toISOString();
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch (error) {
    console.error('Error updating user withdrawal count:', error);
  }
};

// Get user by ID
export const getUserById = (userId) => {
  try {
    const users = getUsersData();
    return users.find(user => user.userId === userId) || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Clear all data (for testing)
export const clearAllData = () => {
  try {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(DEPOSITS_STORAGE_KEY);
    localStorage.removeItem(WITHDRAWALS_STORAGE_KEY);
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
