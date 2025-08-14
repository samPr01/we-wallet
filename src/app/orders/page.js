'use client';

import styles from '../styles/Orders.module.css';
import { connectWallet, disconnectWallet, getProvider, getSigner, restoreWalletFromCookies, setupWalletListeners, removeWalletListeners } from '../../lib/wallet';
import { fetchBTCBalance, getBTCAddressInfo, isValidBTCAddress } from '../../lib/bitcoin';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function OrdersPage() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [balances, setBalances] = useState({
    ETH: '0.0000',
    BTC: '0.00000000'
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'history', 'pending'
  const [orders, setOrders] = useState({
    active: [
      {
        id: 'ORD-001',
        type: 'buy',
        symbol: 'BTC',
        amount: '0.001',
        price: '121,496.76',
        total: '121.50',
        status: 'pending',
        date: '2024-01-15 14:30:00',
        txHash: '0x1234...5678'
      },
      {
        id: 'ORD-002',
        type: 'sell',
        symbol: 'ETH',
        amount: '0.5',
        price: '3,248.19',
        total: '1,624.10',
        status: 'executed',
        date: '2024-01-15 13:45:00',
        txHash: '0xabcd...efgh'
      }
    ],
    history: [
      {
        id: 'ORD-003',
        type: 'buy',
        symbol: 'SOL',
        amount: '10',
        price: '197.01',
        total: '1,970.10',
        status: 'completed',
        date: '2024-01-14 16:20:00',
        txHash: '0x9876...5432'
      },
      {
        id: 'ORD-004',
        type: 'sell',
        symbol: 'ADA',
        amount: '1000',
        price: '0.4094',
        total: '409.40',
        status: 'cancelled',
        date: '2024-01-13 11:15:00',
        txHash: '0x5678...1234'
      }
    ],
    pending: [
      {
        id: 'ORD-005',
        type: 'buy',
        symbol: 'BNB',
        amount: '2',
        price: '508.62',
        total: '1,017.24',
        status: 'pending',
        date: '2024-01-15 15:00:00',
        txHash: '0x1111...2222'
      }
    ]
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

  const handleCancelOrder = (orderId) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      setOrders(prev => ({
        ...prev,
        active: prev.active.filter(order => order.id !== orderId),
        pending: prev.pending.filter(order => order.id !== orderId)
      }));
      alert('Order cancelled successfully');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'executed':
        return styles.completed;
      case 'pending':
        return styles.pending;
      case 'cancelled':
        return styles.cancelled;
      default:
        return styles.pending;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'executed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '✗';
      default:
        return '⏳';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStats = () => {
    const allOrders = [...orders.active, ...orders.history, ...orders.pending];
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter(order => order.status === 'completed' || order.status === 'executed').length;
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
    const cancelledOrders = allOrders.filter(order => order.status === 'cancelled').length;
    
    return { totalOrders, completedOrders, pendingOrders, cancelledOrders };
  };

  const orderStats = getOrderStats();

  return (
    <main className={styles.container}>
      {/* Header Navigation */}
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>WalletBase</div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navLink}>Home</a>
            <a href="/market" className={styles.navLink}>Market</a>
            <a href="/orders" className={styles.navActive}>Orders</a>
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

      {/* Orders Overview */}
      <section className={styles.ordersOverview}>
        <div className={styles.overviewCard}>
          <h2>Orders Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Orders</span>
              <span className={styles.statValue}>{orderStats.totalOrders}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Completed</span>
              <span className={styles.statValue}>{orderStats.completedOrders}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Pending</span>
              <span className={styles.statValue}>{orderStats.pendingOrders}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Cancelled</span>
              <span className={styles.statValue}>{orderStats.cancelledOrders}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Tabs */}
      <section className={styles.ordersSection}>
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'active' ? styles.active : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders ({orders.active.length})
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({orders.pending.length})
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History ({orders.history.length})
          </button>
        </div>

        {/* Orders Table */}
        <div className={styles.ordersTable}>
          <div className={styles.tableHeader}>
            <h3>{activeTab === 'active' ? 'Active Orders' : activeTab === 'pending' ? 'Pending Orders' : 'Order History'}</h3>
            <div className={styles.tableControls}>
              <input 
                type="text" 
                placeholder="Search orders..." 
                className={styles.searchInput}
              />
              <select className={styles.filterSelect}>
                <option value="all">All Types</option>
                <option value="buy">Buy Orders</option>
                <option value="sell">Sell Orders</option>
              </select>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders[activeTab].map((order) => (
                  <tr key={order.id} className={styles.tableRow}>
                    <td className={styles.orderId}>{order.id}</td>
                    <td>
                      <span className={`${styles.orderType} ${order.type === 'buy' ? styles.buyType : styles.sellType}`}>
                        {order.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.symbol}>{order.symbol}</td>
                    <td className={styles.amount}>{order.amount}</td>
                    <td className={styles.price}>${order.price}</td>
                    <td className={styles.total}>${order.total}</td>
                    <td>
                      <span className={`${styles.status} ${getStatusColor(order.status)}`}>
                        <span className={styles.statusIcon}>{getStatusIcon(order.status)}</span>
                        {order.status}
                      </span>
                    </td>
                    <td className={styles.date}>{formatDate(order.date)}</td>
                    <td className={styles.actions}>
                      {(order.status === 'pending' || activeTab === 'pending') && (
                        <button 
                          className={styles.cancelButton}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      )}
                      <button className={styles.viewButton}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders[activeTab].length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No {activeTab} orders</h3>
              <p>You don't have any {activeTab} orders at the moment.</p>
              <a href="/market" className={styles.createOrderButton}>
                Create New Order
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className={styles.recentActivity}>
        <div className={styles.activityCard}>
          <h3>Recent Activity</h3>
          <div className={styles.activityList}>
            {orders.history.slice(0, 5).map((order) => (
              <div key={order.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {order.type === 'buy' ? '📈' : '📉'}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>
                    {order.type === 'buy' ? 'Bought' : 'Sold'} {order.amount} {order.symbol}
                  </div>
                  <div className={styles.activityDetails}>
                    ${order.total} • {formatDate(order.date)}
                  </div>
                </div>
                <div className={styles.activityStatus}>
                  <span className={`${styles.status} ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
