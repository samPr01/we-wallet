'use client';

import styles from '../styles/AITrading.module.css';
import { connectWallet, disconnectWallet, getProvider, getSigner, restoreWalletFromCookies, setupWalletListeners, removeWalletListeners } from '../../lib/wallet';
import { fetchBTCBalance, getBTCAddressInfo, isValidBTCAddress } from '../../lib/bitcoin';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function AITradingPage() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [balances, setBalances] = useState({
    ETH: '0.0000',
    BTC: '0.00000000'
  });
  const [aiPredictions, setAiPredictions] = useState([]);
  const [tradingStrategies, setTradingStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [strategyConfig, setStrategyConfig] = useState({
    name: '',
    riskLevel: 'medium',
    investmentAmount: '',
    targetProfit: '',
    stopLoss: ''
  });

  // Update time every second and initialize wallet
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
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
    const restoreWallet = async () => {
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
    
    restoreWallet();
    
    return () => {
      clearInterval(timer);
      removeWalletListeners();
    };
  }, []);

  // Fetch AI predictions and strategies on component mount
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        // Simulate AI predictions
        const predictions = [
          {
            id: 1,
            symbol: 'BTC',
            name: 'Bitcoin',
            currentPrice: 121496.76,
            predictedPrice: 125000.00,
            confidence: 85,
            timeframe: '24h',
            direction: 'up',
            reasoning: 'Strong technical indicators and institutional buying pressure'
          },
          {
            id: 2,
            symbol: 'ETH',
            name: 'Ethereum',
            currentPrice: 3248.19,
            predictedPrice: 3100.00,
            confidence: 72,
            timeframe: '24h',
            direction: 'down',
            reasoning: 'Market correction expected after recent rally'
          },
          {
            id: 3,
            symbol: 'SOL',
            name: 'Solana',
            currentPrice: 197.01,
            predictedPrice: 210.00,
            confidence: 78,
            timeframe: '24h',
            direction: 'up',
            reasoning: 'Positive momentum and growing DeFi adoption'
          }
        ];

        const strategies = [
          {
            id: 1,
            name: 'Conservative Growth',
            description: 'Low-risk strategy focusing on stable coins and blue-chip cryptocurrencies',
            riskLevel: 'low',
            expectedReturn: '5-15%',
            minInvestment: 100,
            maxInvestment: 10000,
            active: true
          },
          {
            id: 2,
            name: 'Balanced Portfolio',
            description: 'Medium-risk strategy with diversified crypto assets',
            riskLevel: 'medium',
            expectedReturn: '15-30%',
            minInvestment: 500,
            maxInvestment: 50000,
            active: true
          },
          {
            id: 3,
            name: 'Aggressive Growth',
            description: 'High-risk strategy targeting maximum returns through active trading',
            riskLevel: 'high',
            expectedReturn: '30-60%',
            minInvestment: 1000,
            maxInvestment: 100000,
            active: false
          }
        ];

        setAiPredictions(predictions);
        setTradingStrategies(strategies);
      } catch (error) {
        console.error('Failed to fetch AI data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIData();
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

  const handleConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      let errorMessage = error.message;
      if (error.message.includes('MetaMask is not installed')) {
        errorMessage = 'Please install MetaMask browser extension first.';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Connection was cancelled. Please try again and approve the connection.';
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

  const handleCreateStrategy = () => {
    if (!strategyConfig.name || !strategyConfig.investmentAmount) {
      alert('Please fill in all required fields.');
      return;
    }

    const newStrategy = {
      id: Date.now(),
      ...strategyConfig,
      active: false,
      createdAt: new Date().toISOString()
    };

    setTradingStrategies(prev => [...prev, newStrategy]);
    setShowStrategyModal(false);
    setStrategyConfig({
      name: '',
      riskLevel: 'medium',
      investmentAmount: '',
      targetProfit: '',
      stopLoss: ''
    });
    alert('Trading strategy created successfully!');
  };

  const handleActivateStrategy = (strategyId) => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }

    setTradingStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, active: !strategy.active }
          : strategy
      )
    );

    const strategy = tradingStrategies.find(s => s.id === strategyId);
    const action = strategy.active ? 'deactivated' : 'activated';
    alert(`Strategy ${action} successfully!`);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return styles.highConfidence;
    if (confidence >= 60) return styles.mediumConfidence;
    return styles.lowConfidence;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return styles.lowRisk;
      case 'medium': return styles.mediumRisk;
      case 'high': return styles.highRisk;
      default: return styles.mediumRisk;
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <main className={styles.container}>
      {/* Header Navigation */}
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>WalletBase</div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navLink}>Home</a>
            <a href="/market" className={styles.navLink}>Market</a>
            <a href="/orders" className={styles.navLink}>Orders</a>
            <a href="/ai-trading" className={styles.navActive}>$ Intelligent AI Trading</a>
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

      {/* AI Trading Overview */}
      <section className={styles.aiOverview}>
        <div className={styles.overviewCard}>
          <h2>🤖 Intelligent AI Trading</h2>
          <p>Leverage advanced AI algorithms for automated cryptocurrency trading</p>
          <div className={styles.aiStats}>
            <div className={styles.aiStat}>
              <span className={styles.aiStatValue}>85%</span>
              <span className={styles.aiStatLabel}>Prediction Accuracy</span>
            </div>
            <div className={styles.aiStat}>
              <span className={styles.aiStatValue}>$2.4M</span>
              <span className={styles.aiStatLabel}>Total Profit Generated</span>
            </div>
            <div className={styles.aiStat}>
              <span className={styles.aiStatValue}>1,247</span>
              <span className={styles.aiStatLabel}>Successful Trades</span>
            </div>
            <div className={styles.aiStat}>
              <span className={styles.aiStatValue}>24/7</span>
              <span className={styles.aiStatLabel}>Active Monitoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Predictions */}
      <section className={styles.predictionsSection}>
        <div className={styles.sectionHeader}>
          <h3>🎯 AI Market Predictions</h3>
          <p>Real-time predictions based on advanced machine learning algorithms</p>
        </div>
        
        {isLoading ? (
          <div className={styles.loading}>Loading AI predictions...</div>
        ) : (
          <div className={styles.predictionsGrid}>
            {aiPredictions.map((prediction) => (
              <div key={prediction.id} className={styles.predictionCard}>
                <div className={styles.predictionHeader}>
                  <div className={styles.cryptoInfo}>
                    <h4>{prediction.symbol}</h4>
                    <span className={styles.cryptoName}>{prediction.name}</span>
                  </div>
                  <div className={`${styles.direction} ${prediction.direction === 'up' ? styles.up : styles.down}`}>
                    {prediction.direction === 'up' ? '↗' : '↘'}
                  </div>
                </div>
                
                <div className={styles.priceInfo}>
                  <div className={styles.currentPrice}>
                    <span className={styles.priceLabel}>Current:</span>
                    <span className={styles.priceValue}>${formatPrice(prediction.currentPrice)}</span>
                  </div>
                  <div className={styles.predictedPrice}>
                    <span className={styles.priceLabel}>Predicted:</span>
                    <span className={styles.priceValue}>${formatPrice(prediction.predictedPrice)}</span>
                  </div>
                </div>
                
                <div className={styles.predictionDetails}>
                  <div className={styles.confidence}>
                    <span className={styles.confidenceLabel}>Confidence:</span>
                    <span className={`${styles.confidenceValue} ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </span>
                  </div>
                  <div className={styles.timeframe}>
                    <span className={styles.timeframeLabel}>Timeframe:</span>
                    <span className={styles.timeframeValue}>{prediction.timeframe}</span>
                  </div>
                </div>
                
                <div className={styles.reasoning}>
                  <span className={styles.reasoningLabel}>Analysis:</span>
                  <p className={styles.reasoningText}>{prediction.reasoning}</p>
                </div>
                
                <button className={styles.tradeButton}>
                  Trade {prediction.symbol}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trading Strategies */}
      <section className={styles.strategiesSection}>
        <div className={styles.sectionHeader}>
          <h3>📊 Trading Strategies</h3>
          <div className={styles.strategyControls}>
            <button 
              className={styles.createStrategyButton}
              onClick={() => setShowStrategyModal(true)}
            >
              + Create Strategy
            </button>
          </div>
        </div>
        
        <div className={styles.strategiesGrid}>
          {tradingStrategies.map((strategy) => (
            <div key={strategy.id} className={styles.strategyCard}>
              <div className={styles.strategyHeader}>
                <h4>{strategy.name}</h4>
                <span className={`${styles.riskLevel} ${getRiskColor(strategy.riskLevel)}`}>
                  {strategy.riskLevel.toUpperCase()}
                </span>
              </div>
              
              <p className={styles.strategyDescription}>{strategy.description}</p>
              
              <div className={styles.strategyStats}>
                <div className={styles.strategyStat}>
                  <span className={styles.statLabel}>Expected Return:</span>
                  <span className={styles.statValue}>{strategy.expectedReturn}</span>
                </div>
                <div className={styles.strategyStat}>
                  <span className={styles.statLabel}>Min Investment:</span>
                  <span className={styles.statValue}>${strategy.minInvestment}</span>
                </div>
                <div className={styles.strategyStat}>
                  <span className={styles.statLabel}>Max Investment:</span>
                  <span className={styles.statValue}>${strategy.maxInvestment}</span>
                </div>
              </div>
              
              <div className={styles.strategyActions}>
                <button 
                  className={`${styles.activateButton} ${strategy.active ? styles.deactivate : ''}`}
                  onClick={() => handleActivateStrategy(strategy.id)}
                >
                  {strategy.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className={styles.editButton}>
                  Edit
                </button>
              </div>
              
              {strategy.active && (
                <div className={styles.activeIndicator}>
                  <span className={styles.activeDot}></span>
                  Active
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Strategy Creation Modal */}
      {showStrategyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowStrategyModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Trading Strategy</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowStrategyModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Strategy Name</label>
                <input
                  type="text"
                  value={strategyConfig.name}
                  onChange={(e) => setStrategyConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter strategy name"
                  className={styles.modalInput}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Risk Level</label>
                <select 
                  value={strategyConfig.riskLevel}
                  onChange={(e) => setStrategyConfig(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className={styles.modalSelect}
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Investment Amount ($)</label>
                <input
                  type="number"
                  value={strategyConfig.investmentAmount}
                  onChange={(e) => setStrategyConfig(prev => ({ ...prev, investmentAmount: e.target.value }))}
                  placeholder="Enter amount"
                  className={styles.modalInput}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Target Profit (%)</label>
                <input
                  type="number"
                  value={strategyConfig.targetProfit}
                  onChange={(e) => setStrategyConfig(prev => ({ ...prev, targetProfit: e.target.value }))}
                  placeholder="Enter target profit"
                  className={styles.modalInput}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Stop Loss (%)</label>
                <input
                  type="number"
                  value={strategyConfig.stopLoss}
                  onChange={(e) => setStrategyConfig(prev => ({ ...prev, stopLoss: e.target.value }))}
                  placeholder="Enter stop loss"
                  className={styles.modalInput}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButtonSecondary}
                onClick={() => setShowStrategyModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButtonPrimary}
                onClick={handleCreateStrategy}
              >
                Create Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
