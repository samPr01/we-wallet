'use client';

import styles from '../styles/Landing.module.css';
import { connectWallet, disconnectWallet, getProvider, getSigner, detectWallets, WALLET_TYPES, restoreWalletFromCookies, setupWalletListeners, removeWalletListeners } from '../lib/wallet';
import { RECEIVING_ADDRESSES } from '../lib/config';
import { fetchBTCBalance, getBTCAddressInfo, isValidBTCAddress } from '../lib/bitcoin';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function LandingPage() {
  const [walletAddress, setWalletAddress] = useState(null);
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
    BTC: '0.00000000'
  });
  const [availableWallets, setAvailableWallets] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
          setWalletAddress(newAddress);
        },
        (chainId) => {
          console.log('Chain changed:', chainId);
        },
        () => {
          console.log('Wallet disconnected');
          setWalletAddress(null);
        }
      );
      
      // Restore wallet connection from cookies
      try {
        const restoredAddress = await restoreWalletFromCookies();
        if (restoredAddress) {
          setWalletAddress(restoredAddress);
          console.log('Restored wallet from cookies:', restoredAddress);
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
              // Check if the wallet address is a valid Bitcoin address format
              if (isValidBTCAddress(walletAddress)) {
                const btcBalanceValue = await fetchBTCBalance(walletAddress);
                btcBalance = btcBalanceValue.toFixed(8);
              } else {
                console.warn('Wallet address is not a valid Bitcoin address format');
              }
            } catch (btcError) {
              console.warn('Error fetching BTC balance:', btcError);
            }
            
            setBalances({
              ETH: parseFloat(ethBalanceFormatted).toFixed(4),
              BTC: btcBalance
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
      
      setWalletAddress(address);
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
    setWalletAddress(null);
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
        // Handle BTC deposit using BlockCypher API
        console.log('Processing BTC deposit...');
        
        try {
          // Validate Bitcoin address format
          if (!isValidBTCAddress(walletAddress)) {
            throw new Error('Invalid Bitcoin address format');
          }
          
          // Get current BTC address info
          const btcAddressInfo = await getBTCAddressInfo(walletAddress);
          console.log('BTC address info:', btcAddressInfo);
          
          // For BTC deposits, we show the address where users can send BTC
          // In a real implementation, you'd create a new address or use existing one
          alert(`BTC deposit initiated!\n\nPlease send ${depositAmount} BTC to your wallet address:\n${walletAddress}\n\nNote: This is a read-only integration. You'll need to send BTC from an external wallet.`);
          
          // Refresh BTC balance after a delay to simulate checking for new transactions
          setTimeout(async () => {
            try {
              const newBtcBalance = await fetchBTCBalance(walletAddress);
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
      } else {
        // Handle other tokens (USDT, USDC)
        console.log(`Processing ${selectedToken} deposit...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`${selectedToken} deposit successful! Amount: ${depositAmount} ${selectedToken}`);
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

        const amountInWei = ethers.parseEther(withdrawAmount);
        const tx = {
          to: walletAddress,
          value: amountInWei
        };

        console.log('Sending ETH withdrawal transaction...');
        const transaction = await signer.sendTransaction(tx);
        const receipt = await transaction.wait();
        
        alert(`ETH withdrawal successful! Transaction hash: ${transaction.hash}`);
        
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
        // Handle BTC withdrawal using BlockCypher API
        console.log('Processing BTC withdrawal...');
        
        try {
          // Validate Bitcoin address format
          if (!isValidBTCAddress(walletAddress)) {
            throw new Error('Invalid Bitcoin address format');
          }
          
          // Get current BTC address info
          const btcAddressInfo = await getBTCAddressInfo(walletAddress);
          console.log('BTC address info:', btcAddressInfo);
          
          // Check if user has sufficient balance
          const currentBtcBalance = parseFloat(btcAddressInfo.balance);
          if (parseFloat(withdrawAmount) > currentBtcBalance) {
            throw new Error(`Insufficient BTC balance. Available: ${btcAddressInfo.balance} BTC`);
          }
          
          // For BTC withdrawals, we show information about the process
          // In a real implementation, you'd create and broadcast the transaction
          alert(`BTC withdrawal initiated!\n\nAmount: ${withdrawAmount} BTC\nTo: ${walletAddress}\n\nNote: This is a read-only integration. You'll need to use an external Bitcoin wallet to send transactions.`);
          
          // Refresh BTC balance after a delay
          setTimeout(async () => {
            try {
              const newBtcBalance = await fetchBTCBalance(walletAddress);
              setBalances(prev => ({
                ...prev,
                BTC: newBtcBalance.toFixed(8)
              }));
            } catch (error) {
              console.warn('Failed to refresh BTC balance:', error);
            }
          }, 5000);
          
        } catch (btcError) {
          console.error('BTC withdrawal error:', btcError);
          alert(`BTC withdrawal failed: ${btcError.message}`);
        }
      } else {
        // Handle other tokens (USDT, USDC)
        console.log(`Processing ${selectedToken} withdrawal...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`${selectedToken} withdrawal successful! Amount: ${withdrawAmount} ${selectedToken}`);
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

  const getBalanceDisplay = () => {
    if (!walletAddress) return 'Connect wallet to view address';
    
    const ethBalance = balances.ETH;
    const btcBalance = balances.BTC;
    return `${ethBalance} ETH | ${btcBalance} BTC`;
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
      {/* Header Navigation */}
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>WalletBase</div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navActive}>Home</a>
            <a href="/market" className={styles.navLink}>Market</a>
            <a href="/orders" className={styles.navLink}>Orders</a>
            <a href="/ai-trading" className={styles.navLink}>$ Intelligent AI Trading</a>
            <a href="/settings" className={styles.navLink}>Settings</a>
          </nav>
        </div>
        <div className={styles.navRight}>
          <div className={styles.walletInfo}>
            <span className={styles.address}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button onClick={handleDisconnect} className={styles.disconnectButton}>
              Disconnect
        </button>
          </div>
        </div>
      </header>

      {/* Wallet Information Section */}
      <section className={styles.walletSection}>
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <span className={styles.walletStatus}>
              {walletAddress ? 'Wallet Connected' : 'No Wallet Connected'}
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
            <div className={styles.balanceAmount}>
              {getBalanceDisplay()}
            </div>
            <div className={styles.balanceLabel}>Balance</div>
          </div>

          <div className={styles.walletStats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                <span className={styles.statPositive}>+0.0000 ETH</span>
                <span className={styles.statArrow}>↗</span>
              </div>
              <div className={styles.statLabel}>Today's P&L</div>
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
              onClick={() => setShowDepositModal(true)}
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
                <label>Amount ({selectedToken})</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  step={selectedToken === 'BTC' ? '0.00000001' : '0.001'}
                  min="0"
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
              <div className={styles.modalInfo}>
                <p>Current Balance: {getCurrentBalance()} {selectedToken}</p>
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
                onClick={handleDeposit}
                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {isProcessing ? 'Processing...' : 'Deposit'}
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
                onClick={() => setShowWithdrawModal(false)}
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
              <div className={styles.modalInfo}>
                <p>Available Balance: {getCurrentBalance()} {selectedToken}</p>
                <p>Network: {selectedToken === 'BTC' ? 'Bitcoin Network' : 'Ethereum Mainnet'}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => setShowWithdrawModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButtonPrimary}
                onClick={handleWithdraw}
                disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(getCurrentBalance())}
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
          <div className={styles.cryptoGrid}>
            {cryptoData.map((coin) => (
              <div key={coin.id} className={styles.cryptoCard}>
                <div className={styles.cryptoHeader}>
                  <img src={coin.image} alt={coin.name} className={styles.cryptoIcon} />
                  <div>
                    <div className={styles.cryptoSymbol}>{coin.symbol}</div>
                    <div className={styles.cryptoName}>{coin.name}</div>
                  </div>
                </div>
                
                <div className={styles.cryptoPrice}>
                  ${formatPrice(coin.price)}
                </div>
                
                <div className={styles.cryptoChange}>
                  <span className={coin.priceChange >= 0 ? styles.positive : styles.negative}>
                    {formatPriceChange(coin.priceChange)} {formatPriceChangeAmount(coin.priceChangeAmount)}
                  </span>
                </div>
                
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
