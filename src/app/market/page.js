'use client';

import styles from '../styles/Market.module.css';
import { connectWallet, disconnectWallet, getProvider, getSigner, detectWallets, WALLET_TYPES, restoreWalletFromCookies, setupWalletListeners, removeWalletListeners } from '../../lib/wallet';
import { RECEIVING_ADDRESSES } from '../../lib/config';
import { fetchBTCBalance, getBTCAddressInfo, isValidBTCAddress } from '../../lib/bitcoin';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function MarketPage() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [cryptoData, setCryptoData] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [isProcessing, setIsProcessing] = useState(false);
  const [balances, setBalances] = useState({
    ETH: '0.0000',
    BTC: '0.00000000'
  });
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    btcDominance: 0,
    ethDominance: 0
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
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true'
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
          image: coin.image,
          sparkline: coin.sparkline_in_7d?.price || [],
          ath: coin.ath,
          athChangePercentage: coin.ath_change_percentage,
          atl: coin.atl,
          atlChangePercentage: coin.atl_change_percentage
        }));
        
        setCryptoData(formattedData);
        
        // Calculate market stats
        const totalMarketCap = data.reduce((sum, coin) => sum + coin.market_cap, 0);
        const totalVolume = data.reduce((sum, coin) => sum + coin.total_volume, 0);
        const btcData = data.find(coin => coin.symbol === 'btc');
        const ethData = data.find(coin => coin.symbol === 'eth');
        
        setMarketStats({
          totalMarketCap,
          totalVolume,
          btcDominance: btcData ? (btcData.market_cap / totalMarketCap) * 100 : 0,
          ethDominance: ethData ? (ethData.market_cap / totalMarketCap) * 100 : 0
        });
      } catch (error) {
        console.error('Failed to fetch crypto data:', error);
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
            const ethBalance = await provider.getBalance(walletAddress);
            const ethBalanceFormatted = ethers.formatEther(ethBalance);
            
            let btcBalance = '0.00000000';
            try {
              if (isValidBTCAddress(walletAddress)) {
                const btcBalanceValue = await fetchBTCBalance(walletAddress);
                btcBalance = btcBalanceValue.toFixed(8);
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
      const address = await connectWallet(walletType);
      
      // If address is null, user cancelled the connection
      if (address === null) {
        console.log('User cancelled wallet connection');
        setIsConnecting(false); // Reset connecting state
        return; // Just return without showing error or changing state
      }
      
      setWalletAddress(address);
    } catch (error) {
      console.error("Wallet connection failed:", error);
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

  const handleTrade = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!selectedCrypto) {
      alert('Please select a cryptocurrency to trade.');
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate trade processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const action = tradeType === 'buy' ? 'purchased' : 'sold';
      alert(`Successfully ${action} ${tradeAmount} ${selectedCrypto.symbol} at $${selectedCrypto.price.toFixed(2)}`);
      
      setShowTradeModal(false);
      setTradeAmount('');
      setSelectedCrypto(null);
    } catch (error) {
      console.error('Trade failed:', error);
      alert(`Trade failed: ${error.message}`);
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

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(0)}`;
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
                  <p>Connect with MetaMask for secure, decentralized access</p>
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
            <a href="/" className={styles.navLink}>Home</a>
            <a href="/market" className={styles.navActive}>Market</a>
            <a href="/orders" className={styles.navLink}>Orders</a>
            <a href="/ai-trading" className={styles.navLink}>$ Intelligent AI Trading</a>
            <a href="/settings" className={styles.navLink}>Settings</a>
          </nav>
        </div>
        <div className={styles.navRight}>
          {walletAddress ? (
            <div className={styles.walletInfo}>
              <span className={styles.address}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button onClick={handleDisconnect} className={styles.disconnectButton}>
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect} 
              className={styles.connectButton}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {/* Market Overview */}
      <section className={styles.marketOverview}>
        <div className={styles.overviewCard}>
          <h2>Market Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Market Cap</span>
              <span className={styles.statValue}>{formatMarketCap(marketStats.totalMarketCap)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>24h Volume</span>
              <span className={styles.statValue}>{formatVolume(marketStats.totalVolume)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>BTC Dominance</span>
              <span className={styles.statValue}>{marketStats.btcDominance.toFixed(2)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>ETH Dominance</span>
              <span className={styles.statValue}>{marketStats.ethDominance.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Market Table */}
      <section className={styles.marketTable}>
        <div className={styles.tableHeader}>
          <h2>Cryptocurrency Market</h2>
          <div className={styles.tableControls}>
            <input 
              type="text" 
              placeholder="Search cryptocurrencies..." 
              className={styles.searchInput}
            />
            <select className={styles.sortSelect}>
              <option value="market_cap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
              <option value="change">24h Change</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading market data...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.marketTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                  <th>Volume (24h)</th>
                  <th>Circulating Supply</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cryptoData.map((coin, index) => (
                  <tr key={coin.id} className={styles.tableRow}>
                    <td>{index + 1}</td>
                    <td className={styles.coinInfo}>
                      <img src={coin.image} alt={coin.name} className={styles.coinIcon} />
                      <div>
                        <div className={styles.coinName}>{coin.name}</div>
                        <div className={styles.coinSymbol}>{coin.symbol}</div>
                      </div>
                    </td>
                    <td className={styles.price}>${formatPrice(coin.price)}</td>
                    <td className={`${styles.change} ${coin.priceChange >= 0 ? styles.positive : styles.negative}`}>
                      {formatPriceChange(coin.priceChange)}
                    </td>
                    <td>{formatMarketCap(coin.marketCap)}</td>
                    <td>{formatVolume(coin.volume)}</td>
                    <td>{coin.symbol}</td>
                    <td>
                      <button 
                        className={styles.tradeButton}
                        onClick={() => {
                          setSelectedCrypto(coin);
                          setShowTradeModal(true);
                        }}
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trade Modal */}
      {showTradeModal && selectedCrypto && (
        <div className={styles.modalOverlay} onClick={() => !isProcessing && setShowTradeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Trade {selectedCrypto.symbol}</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowTradeModal(false)}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.cryptoInfo}>
                <img src={selectedCrypto.image} alt={selectedCrypto.name} className={styles.modalCryptoIcon} />
                <div>
                  <div className={styles.modalCryptoName}>{selectedCrypto.name}</div>
                  <div className={styles.modalCryptoPrice}>${formatPrice(selectedCrypto.price)}</div>
                  <div className={`${styles.modalCryptoChange} ${selectedCrypto.priceChange >= 0 ? styles.positive : styles.negative}`}>
                    {formatPriceChange(selectedCrypto.priceChange)}
                  </div>
                </div>
              </div>
              
              <div className={styles.tradeTypeSelector}>
                <button 
                  className={`${styles.tradeTypeButton} ${tradeType === 'buy' ? styles.active : ''}`}
                  onClick={() => setTradeType('buy')}
                  disabled={isProcessing}
                >
                  Buy
                </button>
                <button 
                  className={`${styles.tradeTypeButton} ${tradeType === 'sell' ? styles.active : ''}`}
                  onClick={() => setTradeType('sell')}
                  disabled={isProcessing}
                >
                  Sell
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label>Amount ({selectedCrypto.symbol})</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.000001"
                  disabled={isProcessing}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.tradeSummary}>
                <div className={styles.summaryItem}>
                  <span>Price:</span>
                  <span>${formatPrice(selectedCrypto.price)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Total Value:</span>
                  <span>${tradeAmount ? (parseFloat(tradeAmount) * selectedCrypto.price).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => setShowTradeModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={`${styles.modalButtonPrimary} ${tradeType === 'buy' ? styles.buyButton : styles.sellButton}`}
                onClick={handleTrade}
                disabled={isProcessing || !tradeAmount || parseFloat(tradeAmount) <= 0}
              >
                {isProcessing ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedCrypto.symbol}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
