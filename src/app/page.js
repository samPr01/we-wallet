'use client';

import styles from '../styles/Landing.module.css';
import { connectWallet, disconnectWallet, getProvider, getSigner, detectWallets, WALLET_TYPES, restoreWalletFromCookies, setupWalletListeners, removeWalletListeners } from '../lib/wallet';
import { RECEIVING_ADDRESSES } from '../lib/config';
import { fetchBTCBalance, getBTCAddressInfo, isValidBTCAddress } from '../lib/bitcoin';
import { 
  getBitcoinBalance, 
  getTransactionDetails,
  isValidBitcoinAddress as validateBTCAddress,
  isValidBitcoinAddressLenient as validateBTCLenient,
  testBitcoinAddress
} from '../lib/bitcoin-simple';
import {
  executeBitcoinTransfer,
  getAvailableTransferMethods,
  getNetworkFeeRates
} from '../lib/bitcoin-transactions';
import {
  getUSDTBalance,
  getUSDCBalance,
  transferUSDT,
  transferUSDC,
  getTokenInfo
} from '../lib/usdt-transactions';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import { 
  createUser, 
  getUserByAddress, 
  updateUserActivity, 
  createDeposit, 
  createWithdrawal,
  createTransaction 
} from '../lib/enhanced-user-management';
import { useUser } from '../contexts/UserContext';
import Navigation from '../components/Navigation';

export default function LandingPage() {
  const { userId, walletAddress, updateUser, clearUser } = useUser();
  const [cryptoData, setCryptoData] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balances, setBalances] = useState({
    ETH: '0.0000',
    BTC: '0.00000000',
    USDT: '0.00',
    USDC: '0.00'
  });
  const [usdBalances, setUsdBalances] = useState({
    ETH: 0,
    BTC: 0,
    USDT: 0,
    USDC: 0,
    total: 0
  });
  const [prices, setPrices] = useState({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionScreenshot, setTransactionScreenshot] = useState(null);
  const [withdrawToAddress, setWithdrawToAddress] = useState('');
  const [transferMethod, setTransferMethod] = useState('server-side');
  const [availableTransferMethods, setAvailableTransferMethods] = useState([]);
  const [networkFeeRates, setNetworkFeeRates] = useState({ low: 5000, medium: 10000, high: 20000 });
  const [selectedFeeRate, setSelectedFeeRate] = useState('medium');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load transfer methods and fee rates
  useEffect(() => {
    const loadTransferData = async () => {
      try {
        // Get available transfer methods
        const methods = getAvailableTransferMethods();
        setAvailableTransferMethods(methods);
        
        // Get current network fee rates
        const rates = await getNetworkFeeRates();
        setNetworkFeeRates(rates);
      } catch (error) {
        console.error('Failed to load transfer data:', error);
      }
    };
    
    loadTransferData();
  }, []);

  // Detect available wallets and load wallet data from cookies on component mount
  useEffect(() => {
    const initializeWallet = async () => {
      // Detect available wallets
      const wallets = detectWallets();
      setAvailableWallets(wallets);
      
      // Set up wallet listeners
      setupWalletListeners(
        (newAddress) => {
          console.log('Account changed:', newAddress);
          updateUser(userId, newAddress);
        },
        (chainId) => {
          console.log('Chain changed:', chainId);
        },
        () => {
          console.log('Wallet disconnected');
          clearUser();
        }
      );
      
      // Restore wallet connection from cookies
      try {
        const restoredAddress = await restoreWalletFromCookies();
        if (restoredAddress) {
          // Generate user ID for restored wallet
          const newUserId = generateUserIdFromAddress(restoredAddress);
          updateUser(newUserId, restoredAddress);
          console.log('Restored wallet from cookies:', restoredAddress);
          console.log('Generated User ID for restored wallet:', newUserId);
        }
      } catch (error) {
        console.log('Wallet restoration failed:', error.message);
      }
    };
    
    initializeWallet();
    
    // Cleanup wallet listeners on unmount
    return () => {
      removeWalletListeners();
    };
  }, []);

  // Generate user ID and create user when wallet address changes
  useEffect(() => {
    if (walletAddress && !userId) {
      const newUserId = generateUserIdFromAddress(walletAddress);
      setUserId(newUserId);
      
      // Create or get user in the system
      const existingUser = getUserByAddress(walletAddress);
      if (!existingUser) {
        createUser(walletAddress, newUserId);
        console.log('New user created:', newUserId);
      } else {
        console.log('Existing user found:', existingUser.userId);
      }
      
      // Update user activity
      updateUserActivity(walletAddress);
    }
  }, [walletAddress, userId]);

  // Fetch crypto data on component mount
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
        );
        const data = await response.json();
        
        const formattedData = data.map(coin => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          priceChange: coin.price_change_percentage_24h,
          priceChangeAmount: coin.price_change_24h,
          volume: coin.total_volume,
          marketCap: coin.market_cap,
          image: coin.image
        }));
        
        setCryptoData(formattedData);
      } catch (error) {
        console.error('Failed to fetch crypto data:', error);
        // Fallback data
        setCryptoData([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 121496.76, priceChange: 0.66, priceChangeAmount: 796.28, volume: 28400000000, marketCap: 2400000000000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3248.19, priceChange: -0.32, priceChangeAmount: -10.32, volume: 15800000000, marketCap: 390000000000, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
          { id: 'solana', symbol: 'SOL', name: 'Solana', price: 197.01, priceChange: 0.22, priceChangeAmount: 0.4341, volume: 3200000000, marketCap: 89000000000, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
          { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: 0.5265, priceChange: 0.89, priceChangeAmount: 0.0046, volume: 2100000000, marketCap: 29000000000, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
          { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', price: 508.62, priceChange: -0.84, priceChangeAmount: -4.29, volume: 1800000000, marketCap: 78000000000, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.4094, priceChange: -0.59, priceChangeAmount: -0.0024, volume: 890000000, marketCap: 14500000000, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
          { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 5.24, priceChange: 0.35, priceChangeAmount: 0.0183, volume: 450000000, marketCap: 6600000000, image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot_new_logo.png' },
          { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 15.78, priceChange: -0.59, priceChangeAmount: -0.0942, volume: 1200000000, marketCap: 9300000000, image: 'https://assets.coingecko.com/coins/images/877/large/chainlink.png' },
          { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', price: 0.8198, priceChange: -0.13, priceChangeAmount: -0.0011, volume: 670000000, marketCap: 7600000000, image: 'https://assets.coingecko.com/coins/images/4713/large/matic.png' },
          { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 25.26, priceChange: 0.01, priceChangeAmount: 0.0025, volume: 890000000, marketCap: 9500000000, image: 'https://assets.coingecko.com/coins/images/12559/large/avalanche.png' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  // Fetch and update prices for USD conversion
  const fetchAndUpdatePrices = async () => {
    try {
      const response = await fetch('/api/prices');
      const data = await response.json();
      
      if (data.success) {
        setPrices(data.prices);
        setLastPriceUpdate(data.timestamp);
        
        // Calculate USD balances
        const newUsdBalances = {};
        let totalUSD = 0;
        
        Object.keys(balances).forEach(token => {
          if (data.prices[token]) {
            const usdValue = parseFloat(balances[token]) * data.prices[token].usd;
            newUsdBalances[token] = usdValue;
            totalUSD += usdValue;
          }
        });
        
        newUsdBalances.total = totalUSD;
        setUsdBalances(newUsdBalances);
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  };

  // Update prices every 5 minutes
  useEffect(() => {
    const priceInterval = setInterval(fetchAndUpdatePrices, 300000); // 5 minutes
    return () => clearInterval(priceInterval);
  }, [balances]);

  // Fetch wallet balances when connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (walletAddress) {
        try {
          const provider = getProvider();
          if (provider) {
            // Fetch ETH balance
            const ethBalance = await provider.getBalance(walletAddress);
            const ethBalanceFormatted = ethers.formatEther(ethBalance);
            
            // Fetch real BTC balance using our utility function
            let btcBalance = '0.00000000';
            try {
              // For BTC, we need to use a different approach since walletAddress is Ethereum
              // We'll use the deposit address to check BTC balance or create a mapping
              // For now, we'll show a placeholder and handle BTC separately
              console.log('BTC balance check: Wallet address is Ethereum format, BTC balance will be handled separately');
              btcBalance = '0.00000000'; // Placeholder - in real app, you'd map Ethereum address to BTC address
            } catch (btcError) {
              console.warn('Error fetching BTC balance:', btcError);
            }
            
            // Fetch USDT and USDC balances
            let usdtBalance = '0.00';
            let usdcBalance = '0.00';
            
            try {
              usdtBalance = (await getUSDTBalance(walletAddress, provider)).toFixed(2);
            } catch (error) {
              console.warn('Error fetching USDT balance:', error);
            }
            
            try {
              usdcBalance = (await getUSDCBalance(walletAddress, provider)).toFixed(2);
            } catch (error) {
              console.warn('Error fetching USDC balance:', error);
            }
            
            setBalances({
              ETH: parseFloat(ethBalanceFormatted).toFixed(4),
              BTC: btcBalance,
              USDT: usdtBalance,
              USDC: usdcBalance
            });
          }
        } catch (error) {
          console.error('Failed to fetch balances:', error);
        }
      }
    };

    fetchBalances();
  }, [walletAddress]);

  const handleConnect = async (walletType = WALLET_TYPES.METAMASK) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setShowWalletModal(false);
    
    try {
      console.log('Starting wallet connection...');
      
      const address = await connectWallet(walletType);
      console.log('Wallet connection result:', address);
      
      // If address is null, user cancelled the connection
      if (address === null) {
        console.log('User cancelled wallet connection');
        setIsConnecting(false); // Reset connecting state
        return; // Just return without showing error or changing state
      }
      
      // Generate user ID when wallet connects
      const newUserId = generateUserIdFromAddress(address);
      updateUser(newUserId, address);
      
      // Create or get user in the system
      const existingUser = getUserByAddress(address);
      if (!existingUser) {
        createUser(address, newUserId);
        console.log('New user created:', newUserId);
      } else {
        console.log('Existing user found:', existingUser.userId);
      }
      
      // Update user activity
      updateUserActivity(address);
      console.log('Generated User ID:', newUserId);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = error.message;
      
      // Handle specific wallet connection errors
      if (error.message.includes('not installed')) {
        errorMessage = 'Please install the wallet extension first.';
      } else if (error.message.includes('User rejected') || 
                 error.message.includes('cancelled by user') ||
                 error.message.includes('Connection was cancelled')) {
        errorMessage = 'Connection was cancelled. Please try again and approve the connection.';
      } else if (error.message.includes('WalletConnect connection failed')) {
        errorMessage = 'WalletConnect connection failed. Please try again or use an injected wallet.';
      } else if (error.message.includes('No Web3 wallet detected')) {
        errorMessage = 'No Web3 wallet detected. Please install MetaMask or another wallet extension.';
      } else if (error.message.includes('No accounts found')) {
        errorMessage = 'No accounts found. Please unlock your wallet and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    clearUser();
    setBalances({
      ETH: '0.0000',
      BTC: '0.00000000'
    });
  };

  const handleDeposit = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedToken === 'ETH') {
        // Handle ETH deposit
        const signer = getSigner();
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const amountInWei = ethers.parseEther(depositAmount);
        const tx = {
          to: walletAddress,
          value: amountInWei
        };

        console.log('Sending ETH deposit transaction...');
        const transaction = await signer.sendTransaction(tx);
        const receipt = await transaction.wait();
        
        alert(`ETH deposit successful! Transaction hash: ${transaction.hash}`);
        
        // Create transaction record
        createTransaction(userId, walletAddress, 'ETH', 'deposit', depositAmount, transaction.hash);
        
        // Refresh ETH balance
        const provider = getProvider();
        if (provider) {
          const newEthBalance = await provider.getBalance(walletAddress);
          const ethBalanceFormatted = ethers.formatEther(newEthBalance);
          setBalances(prev => ({
            ...prev,
            ETH: parseFloat(ethBalanceFormatted).toFixed(4)
          }));
        }
      } else if (selectedToken === 'BTC') {
        // Handle real BTC deposit
        console.log('Processing real BTC deposit...');
        
        try {
          // For BTC deposits, we need to handle this differently since walletAddress is Ethereum
          // In a real implementation, you would either:
          // 1. Have users provide their BTC address separately
          // 2. Use a mapping service to convert Ethereum address to BTC address
          // 3. Use a multi-coin wallet that supports both
          
          console.log('BTC deposit: Using deposit address for balance check');
          const depositAddress = RECEIVING_ADDRESSES.BTC;
          
          // Get current BTC balance from deposit address (this would be the platform's BTC balance)
          const currentBalance = await getBitcoinBalance(depositAddress);
          console.log('Platform BTC balance:', currentBalance);
          
          // Check if user has sufficient balance
          if (parseFloat(depositAmount) > currentBalance) {
            throw new Error(`Insufficient BTC balance. Available: ${currentBalance} BTC`);
          }
          
          // Create and broadcast the transaction
          // depositAddress is already declared above
          
          // Note: In a real implementation, you would need the private key
          // For security reasons, this is handled server-side
          alert(`BTC deposit initiated!\n\nAmount: ${depositAmount} BTC\nTo: ${depositAddress}\n\nNote: Real BTC transactions require private key access. This is a demonstration of the transaction flow.`);
          
          // Refresh BTC balance after a delay
          setTimeout(async () => {
            try {
              const newBtcBalance = await getBitcoinBalance(depositAddress);
              setBalances(prev => ({
                ...prev,
                BTC: newBtcBalance.toFixed(8)
              }));
            } catch (error) {
              console.warn('Failed to refresh BTC balance:', error);
            }
          }, 5000);
          
        } catch (btcError) {
          console.error('BTC deposit error:', btcError);
          alert(`BTC deposit failed: ${btcError.message}`);
        }
      } else if (selectedToken === 'USDT') {
        // Handle real USDT deposit
        console.log('Processing real USDT deposit...');
        
        try {
          const signer = getSigner();
          if (!signer) {
            throw new Error('Wallet not connected');
          }
          
          const provider = getProvider();
          if (!provider) {
            throw new Error('Provider not available');
          }
          
          // Get current USDT balance
          const currentBalance = await getUSDTBalance(walletAddress, provider);
          console.log('Current USDT balance:', currentBalance);
          
          // Check if user has sufficient balance
          if (parseFloat(depositAmount) > currentBalance) {
            throw new Error(`Insufficient USDT balance. Available: ${currentBalance} USDT`);
          }
          
          // Transfer USDT to deposit address
          const depositAddress = RECEIVING_ADDRESSES.USDT;
          const result = await transferUSDT(walletAddress, depositAddress, depositAmount, signer);
          
          alert(`USDT deposit successful!\n\nAmount: ${depositAmount} USDT\nTransaction Hash: ${result.txHash}`);
          
          // Create transaction record
          createTransaction(userId, walletAddress, 'USDT', 'deposit', depositAmount, result.txHash);
          
          // Refresh USDT balance
          const newBalance = await getUSDTBalance(walletAddress, provider);
          setBalances(prev => ({
            ...prev,
            USDT: newBalance.toFixed(2)
          }));
          
        } catch (usdtError) {
          console.error('USDT deposit error:', usdtError);
          alert(`USDT deposit failed: ${usdtError.message}`);
        }
      } else if (selectedToken === 'USDC') {
        // Handle real USDC deposit
        console.log('Processing real USDC deposit...');
        
        try {
          const signer = getSigner();
          if (!signer) {
            throw new Error('Wallet not connected');
          }
          
          const provider = getProvider();
          if (!provider) {
            throw new Error('Provider not available');
          }
          
          // Get current USDC balance
          const currentBalance = await getUSDCBalance(walletAddress, provider);
          console.log('Current USDC balance:', currentBalance);
          
          // Check if user has sufficient balance
          if (parseFloat(depositAmount) > currentBalance) {
            throw new Error(`Insufficient USDC balance. Available: ${currentBalance} USDC`);
          }
          
          // Transfer USDC to deposit address
          const depositAddress = RECEIVING_ADDRESSES.USDT; // Using same address for USDC
          const result = await transferUSDC(walletAddress, depositAddress, depositAmount, signer);
          
          alert(`USDC deposit successful!\n\nAmount: ${depositAmount} USDC\nTransaction Hash: ${result.txHash}`);
          
          // Create transaction record
          createTransaction(userId, walletAddress, 'USDC', 'deposit', depositAmount, result.txHash);
          
          // Refresh USDC balance
          const newBalance = await getUSDCBalance(walletAddress, provider);
          setBalances(prev => ({
            ...prev,
            USDC: newBalance.toFixed(2)
          }));
          
        } catch (usdcError) {
          console.error('USDC deposit error:', usdcError);
          alert(`USDC deposit failed: ${usdcError.message}`);
        }
      }
      
      setShowDepositModal(false);
      setDepositAmount('');
      
    } catch (error) {
      console.error('Deposit failed:', error);
      alert(`Deposit failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const currentBalance = parseFloat(balances[selectedToken]);
    if (parseFloat(withdrawAmount) > currentBalance) {
      alert(`Insufficient ${selectedToken} balance for withdrawal.`);
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedToken === 'ETH') {
        // Handle ETH withdrawal
        const signer = getSigner();
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        // Validate destination address
        if (!withdrawToAddress.trim()) {
          throw new Error('Please enter a destination address');
        }
        
        // Basic Ethereum address validation
        if (!withdrawToAddress || typeof withdrawToAddress !== 'string' || !withdrawToAddress.startsWith('0x') || withdrawToAddress.length !== 42) {
          throw new Error('Please enter a valid Ethereum address (0x...)');
        }

        const amountInWei = ethers.parseEther(withdrawAmount);
        const tx = {
          to: withdrawToAddress.trim(),
          value: amountInWei
        };

        console.log('Sending ETH withdrawal transaction...');
        const transaction = await signer.sendTransaction(tx);
        const receipt = await transaction.wait();
        
        alert(`ETH withdrawal successful! Transaction hash: ${transaction.hash}`);
        
        // Create transaction record
        createTransaction(userId, walletAddress, 'ETH', 'withdrawal', withdrawAmount, transaction.hash);
        
        // Refresh ETH balance
        const provider = getProvider();
        if (provider) {
          const newEthBalance = await provider.getBalance(walletAddress);
          const ethBalanceFormatted = ethers.formatEther(newEthBalance);
          setBalances(prev => ({
            ...prev,
            ETH: parseFloat(ethBalanceFormatted).toFixed(4)
          }));
        }
      } else if (selectedToken === 'BTC') {
        // Handle real BTC withdrawal
        console.log('Processing real BTC withdrawal...');
        
        try {
          // Validate destination address
          if (!withdrawToAddress.trim()) {
            throw new Error('Please enter a destination address');
          }
          
          // Validate Bitcoin address format
          console.log('Validating BTC withdrawal address:', withdrawToAddress.trim());
          const isValidLenient = validateBTCLenient(withdrawToAddress.trim());
          
          if (!isValidLenient) {
            throw new Error('Please enter a valid Bitcoin address (bc1..., 1..., or 3...)');
          }
          
          // Prepare transfer data
          const transferData = {
            fromAddress: RECEIVING_ADDRESSES.BTC, // Platform's BTC address
            toAddress: withdrawToAddress.trim(),
            amount: parseFloat(withdrawAmount),
            feeRate: selectedFeeRate,
            network: 'main'
          };
          
          console.log('Executing BTC transfer with method:', transferMethod);
          console.log('Transfer data:', transferData);
          
          // Execute the transfer using selected method
          const result = await executeBitcoinTransfer(transferData, transferMethod);
          
          if (result.success) {
            let successMessage = `BTC withdrawal successful!\n\n`;
            successMessage += `Amount: ${withdrawAmount} BTC\n`;
            successMessage += `To: ${withdrawToAddress.trim()}\n`;
            successMessage += `Method: ${result.method}\n`;
            
            if (result.txHash) {
              successMessage += `Transaction Hash: ${result.txHash}\n`;
            }
            
            if (result.fee) {
              successMessage += `Fee: ${result.fee} satoshis\n`;
            }
            
            if (result.status) {
              successMessage += `Status: ${result.status}\n`;
            }
            
            alert(successMessage);
            
                    // Create withdrawal record
        createWithdrawal(userId, walletAddress, 'BTC', withdrawAmount, withdrawToAddress.trim(), transferMethod);
        
        // Create transaction record
        createTransaction(userId, walletAddress, 'BTC', 'withdrawal', withdrawAmount, result.txHash || 'pending');
            
            // Refresh BTC balance
            setTimeout(async () => {
              try {
                const platformBtcAddress = RECEIVING_ADDRESSES.BTC;
                const newBtcBalance = await getBitcoinBalance(platformBtcAddress);
                setBalances(prev => ({
                  ...prev,
                  BTC: newBtcBalance.toFixed(8)
                }));
              } catch (error) {
                console.warn('Failed to refresh BTC balance:', error);
              }
            }, 5000);
            
          } else {
            throw new Error(result.error || 'Transfer failed');
          }
          
        } catch (btcError) {
          console.error('BTC withdrawal error:', btcError);
          alert(`BTC withdrawal failed: ${btcError.message}`);
        }
      } else if (selectedToken === 'USDT') {
        // Handle real USDT withdrawal
        console.log('Processing real USDT withdrawal...');
        
        try {
          const signer = getSigner();
          if (!signer) {
            throw new Error('Wallet not connected');
          }
          
          const provider = getProvider();
          if (!provider) {
            throw new Error('Provider not available');
          }
          
          // Get current USDT balance
          const currentBalance = await getUSDTBalance(walletAddress, provider);
          console.log('Current USDT balance:', currentBalance);
          
          // Check if user has sufficient balance
          if (parseFloat(withdrawAmount) > currentBalance) {
            throw new Error(`Insufficient USDT balance. Available: ${currentBalance} USDT`);
          }
          
          // Validate destination address
          if (!withdrawToAddress.trim()) {
            throw new Error('Please enter a destination address');
          }
          
          // Basic Ethereum address validation for USDT
          if (!withdrawToAddress || typeof withdrawToAddress !== 'string' || !withdrawToAddress.startsWith('0x') || withdrawToAddress.length !== 42) {
            throw new Error('Please enter a valid Ethereum address for USDT (0x...)');
          }
          
          // Transfer USDT from deposit address to destination
          const depositAddress = RECEIVING_ADDRESSES.USDT;
          const result = await transferUSDT(depositAddress, withdrawToAddress.trim(), withdrawAmount, signer);
          
          alert(`USDT withdrawal successful!\n\nAmount: ${withdrawAmount} USDT\nTransaction Hash: ${result.txHash}`);
          
                  // Create withdrawal record
        createWithdrawal(userId, walletAddress, 'USDT', withdrawAmount, withdrawToAddress.trim(), 'server-side');
        
        // Create transaction record
        createTransaction(userId, walletAddress, 'USDT', 'withdrawal', withdrawAmount, result.txHash);
          
          // Refresh USDT balance
          const newBalance = await getUSDTBalance(walletAddress, provider);
          setBalances(prev => ({
            ...prev,
            USDT: newBalance.toFixed(2)
          }));
          
        } catch (usdtError) {
          console.error('USDT withdrawal error:', usdtError);
          alert(`USDT withdrawal failed: ${usdtError.message}`);
        }
      } else if (selectedToken === 'USDC') {
        // Handle real USDC withdrawal
        console.log('Processing real USDC withdrawal...');
        
        try {
          const signer = getSigner();
          if (!signer) {
            throw new Error('Wallet not connected');
          }
          
          const provider = getProvider();
          if (!provider) {
            throw new Error('Provider not available');
          }
          
          // Get current USDC balance
          const currentBalance = await getUSDCBalance(walletAddress, provider);
          console.log('Current USDC balance:', currentBalance);
          
          // Check if user has sufficient balance
          if (parseFloat(withdrawAmount) > currentBalance) {
            throw new Error(`Insufficient USDC balance. Available: ${currentBalance} USDC`);
          }
          
          // Validate destination address
          if (!withdrawToAddress.trim()) {
            throw new Error('Please enter a destination address');
          }
          
          // Basic Ethereum address validation for USDC
          if (!withdrawToAddress || typeof withdrawToAddress !== 'string' || !withdrawToAddress.startsWith('0x') || withdrawToAddress.length !== 42) {
            throw new Error('Please enter a valid Ethereum address for USDC (0x...)');
          }
          
          // Transfer USDC from deposit address to destination
          const depositAddress = RECEIVING_ADDRESSES.USDT; // Using same address for USDC
          const result = await transferUSDC(depositAddress, withdrawToAddress.trim(), withdrawAmount, signer);
          
          alert(`USDC withdrawal successful!\n\nAmount: ${withdrawAmount} USDC\nTransaction Hash: ${result.txHash}`);
          
                  // Create withdrawal record
        createWithdrawal(userId, walletAddress, 'USDC', withdrawAmount, withdrawToAddress.trim(), 'server-side');
        
        // Create transaction record
        createTransaction(userId, walletAddress, 'USDC', 'withdrawal', withdrawAmount, result.txHash);
          
          // Refresh USDC balance
          const newBalance = await getUSDCBalance(walletAddress, provider);
          setBalances(prev => ({
            ...prev,
            USDC: newBalance.toFixed(2)
          }));
          
        } catch (usdcError) {
          console.error('USDC withdrawal error:', usdcError);
          alert(`USDC withdrawal failed: ${usdcError.message}`);
        }
      }
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatPriceChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatPriceChangeAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    if (Math.abs(amount) >= 1) return `(${sign}$${Math.abs(amount).toFixed(2)})`;
    if (Math.abs(amount) >= 0.01) return `(${sign}$${Math.abs(amount).toFixed(4)})`;
    return `(${sign}$${Math.abs(amount).toFixed(6)})`;
  };

  const getCurrentBalance = () => {
    return balances[selectedToken] || '0.0000';
  };

  const getReceivingAddress = (token) => {
    switch (token) {
      case 'BTC': return RECEIVING_ADDRESSES.BTC;
      case 'USDT': return RECEIVING_ADDRESSES.USDT;
      case 'ETH': 
      case 'USDC': return RECEIVING_ADDRESSES.ETH;
      default: return RECEIVING_ADDRESSES.ETH;
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Address copied to clipboard!');
    }
  };

  // Generate QR code for address
  const generateQRCode = async (address) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Generate 6-digit User ID in format: 3 letters + 3 numbers (e.g., AVA927)
  const generateUserId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result; // Format: AAA000
  };

  // Generate User ID from wallet address for consistency (format: 3 letters + 3 numbers)
  const generateUserIdFromAddress = (address) => {
    if (!address) return generateUserId();
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    // Generate 3 letters based on wallet address
    for (let i = 0; i < 3; i++) {
      const charCode = address.charCodeAt(i + 2) || 0;
      const letterIndex = charCode % letters.length;
      result += letters[letterIndex];
    }
    
    // Generate 3 numbers based on wallet address
    for (let i = 0; i < 3; i++) {
      const charCode = address.charCodeAt(i + 5) || 0;
      const numberIndex = charCode % numbers.length;
      result += numbers[numberIndex];
    }
    
    return result; // Format: AAA000
  };

  // Handle proof submission
  const handleProofSubmission = async () => {
    if (!transactionHash || !transactionScreenshot) {
      alert('Please provide both transaction hash and screenshot');
      return;
    }

    setIsProcessing(true);
    try {
      // Here you would typically send this data to your backend
      const proofData = {
        userId,
        walletAddress,
        token: selectedToken,
        transactionHash: transactionHash.slice(-6), // Last 6 digits
        screenshot: transactionScreenshot,
        timestamp: new Date().toISOString()
      };

      console.log('Proof submitted:', proofData);
      
      // Create deposit record in the system
      createDeposit(userId, walletAddress, selectedToken, depositAmount, transactionHash, transactionScreenshot);
      
      alert('Proof submitted successfully! Admin will review your deposit.');
      
      setShowProofModal(false);
      setTransactionHash('');
      setTransactionScreenshot(null);
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Error submitting proof. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type && typeof file.type === 'string' && file.type.startsWith('image/')) {
      setTransactionScreenshot(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const getBalanceDisplay = () => {
    if (!walletAddress) return 'Connect wallet to view address';
    
    const ethBalance = balances.ETH;
    const btcBalance = balances.BTC;
    const usdtBalance = balances.USDT;
    const usdcBalance = balances.USDC;
    return `${ethBalance} ETH | ${btcBalance} BTC | ${usdtBalance} USDT | ${usdcBalance} USDC`;
  };

  const gainingCoins = cryptoData.filter(coin => coin.priceChange > 0).length;
  const decliningCoins = cryptoData.filter(coin => coin.priceChange < 0).length;
  const totalVolume = cryptoData.reduce((sum, coin) => sum + coin.volume, 0);

  // Wallet Gate - Show only connection screen if no wallet is connected
  if (!walletAddress) {
    return (
      <main className={styles.container}>
        <div className={styles.walletGate}>
          <div className={styles.walletGateContent}>
            <div className={styles.walletGateLogo}>
              <div className={styles.logo}>WalletBase</div>
            </div>
            
            <div className={styles.walletGateTitle}>
              <h1>Welcome to WalletBase</h1>
              <p>Connect your wallet to access the decentralized trading platform</p>
            </div>

            <div className={styles.walletGateFeatures}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>🔐</div>
                <div className={styles.featureText}>
                  <h3>Secure Wallet Connection</h3>
                  <p>Connect with any Web3 wallet for secure, decentralized access</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>📊</div>
                <div className={styles.featureText}>
                  <h3>Live Market Data</h3>
                  <p>Real-time cryptocurrency prices and market analysis</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>🤖</div>
                <div className={styles.featureText}>
                  <h3>AI Trading</h3>
                  <p>Intelligent trading strategies powered by AI</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>💎</div>
                <div className={styles.featureText}>
                  <h3>Multi-Chain Support</h3>
                  <p>Trade ETH, BTC, and other cryptocurrencies</p>
                </div>
              </div>
            </div>

            <div className={styles.walletGateConnect}>
              <button 
                onClick={() => setShowWalletModal(true)}
                className={styles.walletGateButton}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className={styles.spinner}></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className={styles.walletIcon}>🔗</span>
                    Connect Wallet
                  </>
                )}
              </button>
              
              <div className={styles.walletGateInfo}>
                <p>Don't have a wallet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Download MetaMask</a></p>
                <p>By connecting, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Selection Modal */}
        {showWalletModal && (
          <div className={styles.modalOverlay} onClick={() => setShowWalletModal(false)}>
            <div className={styles.walletModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Choose Your Wallet</h3>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowWalletModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.walletGrid}>
                  {availableWallets.map((wallet) => (
                    <button
                      key={wallet.type}
                      className={styles.walletOption}
                      onClick={() => handleConnect(wallet.type)}
                      disabled={isConnecting}
                    >
                      <div className={styles.walletIcon}>{wallet.icon}</div>
                      <div className={styles.walletInfo}>
                        <div className={styles.walletName}>{wallet.name}</div>
                        <div className={styles.walletDescription}>{wallet.description}</div>
                      </div>
                      {wallet.isInstalled && (
                        <div className={styles.installedBadge}>Installed</div>
                      )}
                    </button>
                  ))}
                </div>
                
                {availableWallets.length === 0 && (
                  <div className={styles.noWallets}>
                    <p>No Web3 wallets detected</p>
                    <p>Please install a wallet extension to continue</p>
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.installLink}
                    >
                      Install MetaMask
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }



  // Main application content - only shown when wallet is connected
  return (
    <main className={styles.container}>
      {/* Navigation Component */}
      <Navigation />

      {/* Wallet Information Section */}
      <section className={styles.walletSection}>
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <span className={styles.walletStatus}>
              {walletAddress ? (userId ? `User ID: ${userId}` : 'User ID: Loading...') : 'No Wallet Connected'}
            </span>
            <div className={styles.welcomeText}>
              Welcome! {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          
          <div className={styles.walletBalance}>
            <div className={styles.balanceHeader}>
              <div className={styles.balanceLabel}>Portfolio Balance (USD)</div>
            </div>
            
            <div className={styles.balanceDisplay}>
              <div className={styles.totalUSD}>
                Total Portfolio Value: <span className={styles.totalUSDValue}>${usdBalances.total?.toFixed(2) || '0.00'}</span>
              </div>
              {lastPriceUpdate && (
                <div className={styles.priceUpdate}>
                  Last updated: {new Date(lastPriceUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <div className={styles.walletStats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                <span className={styles.statPositive}>+$0.00</span>
                <span className={styles.statArrow}>↗</span>
              </div>
              <div className={styles.statLabel}>Today's P&L (USD)</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                <span className={styles.statPositive}>+0.00%</span>
                <span className={styles.statArrow}>↗</span>
              </div>
              <div className={styles.statLabel}>ROI</div>
              <div className={styles.statDate}>Today, {currentTime.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          <div className={styles.walletActions}>
            <button 
              className={styles.actionButton}
              onClick={() => {
                setShowDepositModal(true);
                generateQRCode(getReceivingAddress(selectedToken));
              }}
              disabled={!walletAddress}
            >
              <span className={styles.actionIcon}>↓</span>
              Deposit
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => setShowWithdrawModal(true)}
              disabled={!walletAddress}
            >
              <span className={styles.actionIcon}>✈</span>
              Withdraw
            </button>
          </div>
        </div>
      </section>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className={styles.modalOverlay} onClick={() => !isProcessing && setShowDepositModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Deposit Funds</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowDepositModal(false)}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Token</label>
                <select 
                  value={selectedToken} 
                  onChange={(e) => {
                    setSelectedToken(e.target.value);
                    generateQRCode(getReceivingAddress(e.target.value));
                  }}
                  disabled={isProcessing}
                  className={styles.modalSelect}
                >
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                </select>
              </div>
              <div className={styles.modalInfo}>
                <p>Current Balance: ${usdBalances[selectedToken]?.toFixed(2) || '0.00'} USD</p>
                <p>Network: {selectedToken === 'BTC' ? 'Bitcoin Network' : 'Ethereum Mainnet'}</p>
                <div className={styles.receivingAddress}>
                  <label>Receiving Address:</label>
                  <div className={styles.addressDisplay}>
                    <code>{getReceivingAddress(selectedToken)}</code>
                    <button 
                      className={styles.copyButton}
                      onClick={() => copyToClipboard(getReceivingAddress(selectedToken))}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                  {qrCodeDataUrl && (
                    <div className={styles.qrCodeContainer}>
                      <img src={qrCodeDataUrl} alt="QR Code" className={styles.qrCode} />
                      <p>Scan QR code to get the address</p>
                    </div>
                  )}
                  <p className={styles.addressNote}>
                    Send {selectedToken} to this address to complete your deposit
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => setShowDepositModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButtonPrimary}
                onClick={() => {
                  setShowDepositModal(false);
                  setShowProofModal(true);
                }}
                disabled={isProcessing}
              >
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Submission Modal */}
      {showProofModal && (
        <div className={styles.modalOverlay} onClick={() => !isProcessing && setShowProofModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Submit Transaction Proof</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowProofModal(false)}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Transaction Hash (Last 6 digits)</label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Enter last 6 digits of transaction hash"
                  disabled={isProcessing}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Transaction Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className={styles.modalInput}
                />
                {transactionScreenshot && (
                  <p className={styles.fileSelected}>File selected: {transactionScreenshot.name}</p>
                )}
              </div>
              <div className={styles.modalInfo}>
                <p><strong>User ID:</strong> {userId}</p>
                <p><strong>Token:</strong> {selectedToken}</p>
                <p><strong>Wallet Address:</strong> {walletAddress}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => setShowProofModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButtonPrimary}
                onClick={handleProofSubmission}
                disabled={isProcessing || !transactionHash || !transactionScreenshot}
              >
                {isProcessing ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className={styles.modalOverlay} onClick={() => !isProcessing && setShowWithdrawModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Withdraw Funds</h3>
              <button 
                className={styles.modalClose}
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawToAddress('');
                }}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Amount ({selectedToken})</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  step={selectedToken === 'BTC' ? '0.00000001' : '0.001'}
                  min="0"
                  max={getCurrentBalance()}
                  disabled={isProcessing}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Token</label>
                <select 
                  value={selectedToken} 
                  onChange={(e) => setSelectedToken(e.target.value)}
                  disabled={isProcessing}
                  className={styles.modalSelect}
                >
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Destination Address</label>
                <input
                  type="text"
                  value={withdrawToAddress}
                  onChange={(e) => setWithdrawToAddress(e.target.value)}
                  placeholder={selectedToken === 'BTC' ? 'bc1...' : '0x...'}
                  disabled={isProcessing}
                  className={styles.modalInput}
                />
                <small className={styles.inputHelp}>
                  Paste the {selectedToken} address you want to withdraw to
                </small>
              </div>
              
              {/* BTC Transfer Method Selection */}
              {selectedToken === 'BTC' && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Transfer Method</label>
                    <select 
                      value={transferMethod} 
                      onChange={(e) => setTransferMethod(e.target.value)}
                      disabled={isProcessing}
                      className={styles.modalSelect}
                    >
                      {availableTransferMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} {method.recommended ? '(Recommended)' : ''}
                        </option>
                      ))}
                    </select>
                    <small className={styles.inputHelp}>
                      Choose how to process your Bitcoin transfer
                    </small>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>Fee Rate</label>
                    <select 
                      value={selectedFeeRate} 
                      onChange={(e) => setSelectedFeeRate(e.target.value)}
                      disabled={isProcessing}
                      className={styles.modalSelect}
                    >
                      <option value="low">Low ({networkFeeRates.low} sat/byte)</option>
                      <option value="medium">Medium ({networkFeeRates.medium} sat/byte)</option>
                      <option value="high">High ({networkFeeRates.high} sat/byte)</option>
                    </select>
                    <small className={styles.inputHelp}>
                      Higher fees = faster confirmation
                    </small>
                  </div>
                </>
              )}
              <div className={styles.modalInfo}>
                <p>Available Balance: ${usdBalances[selectedToken]?.toFixed(2) || '0.00'} USD</p>
                <p>Network: {selectedToken === 'BTC' ? 'Bitcoin Network' : 'Ethereum Mainnet'}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawToAddress('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButtonPrimary}
                onClick={handleWithdraw}
                disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(getCurrentBalance()) || !withdrawToAddress.trim()}
              >
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Crypto Charts Section */}
      <section className={styles.chartsSection}>
        <h2>Live Crypto Charts</h2>
        <p>Real-time cryptocurrency prices and market data</p>
      </section>

      {/* Live Crypto Market Section */}
      <section className={styles.marketSection}>
        <div className={styles.marketHeader}>
          <div>
            <h2>Live Crypto Market</h2>
            <p>Real-time cryptocurrency prices and trading</p>
          </div>
          <button className={styles.refreshButton} onClick={() => window.location.reload()}>
            <span className={styles.refreshIcon}>↻</span>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading market data...</div>
        ) : (
          <div className={styles.cryptoList}>
            {cryptoData.map((coin) => (
              <div key={coin.id} className={styles.cryptoListItem}>
                <div className={styles.cryptoListHeader}>
                  <div className={styles.cryptoListLeft}>
                    <img src={coin.image} alt={coin.name} className={styles.cryptoIcon} />
                    <div className={styles.cryptoListInfo}>
                      <div className={styles.cryptoSymbol}>{coin.symbol}</div>
                      <div className={styles.cryptoName}>{coin.name}</div>
                    </div>
                  </div>
                  
                  <div className={styles.cryptoListCenter}>
                    <div className={styles.cryptoPrice}>
                      ${formatPrice(coin.price)}
                    </div>
                    <div className={styles.cryptoChange}>
                      <span className={coin.priceChange >= 0 ? styles.positive : styles.negative}>
                        {formatPriceChange(coin.priceChange)} {formatPriceChangeAmount(coin.priceChangeAmount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.cryptoListRight}>
                    <div className={styles.cryptoVolume}>
                      Volume: {formatVolume(coin.volume)}
                    </div>
                    <div className={styles.cryptoTrend}>
                      <span className={coin.priceChange >= 0 ? styles.bull : styles.bear}>
                        {coin.priceChange >= 0 ? '↗ BULL' : '↘ BEAR'}
                      </span>
                    </div>
                    <button className={styles.tradeButton}>
                      Trade {coin.symbol}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Market Summary */}
      <section className={styles.marketSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Gaining</span>
          <span className={styles.summaryValue}>{gainingCoins}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Declining</span>
          <span className={styles.summaryValue}>{decliningCoins}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Volume</span>
          <span className={styles.summaryValue}>{formatVolume(totalVolume)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Cryptocurrencies</span>
          <span className={styles.summaryValue}>{cryptoData.length}</span>
        </div>
      </section>

      {/* How to Trade Section */}
      <section className={styles.tradingInfo}>
        <p>Click on any cryptocurrency above to start trading. You'll be redirected to the trading page where you can place UP/DOWN trades with automated 50-50 resolution.</p>
      </section>

      {/* Quick Actions */}
      <section className={styles.quickActions}>
        <a href="/market" className={styles.quickActionButton}>
          Market Analysis
        </a>
        <a href="/ai-trading" className={styles.quickActionButton}>
          Intelligent AI Trading
        </a>
      </section>
    </main>
  );
}
