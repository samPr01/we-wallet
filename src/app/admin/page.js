'use client';

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import { getUsersData, getDepositsData, getWithdrawalsData } from '../lib/user-management.js';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'deposits', 'withdrawals'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load admin data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Load real data from localStorage
      const usersData = getUsersData();
      const depositsData = getDepositsData();
      const withdrawalsData = getWithdrawalsData();
      
      setUsers(usersData);
      setDeposits(depositsData);
      setWithdrawals(withdrawalsData);
      
      console.log('Admin panel loaded data:', {
        users: usersData.length,
        deposits: depositsData.length,
        withdrawals: withdrawalsData.length
      });
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'nndp007@+-') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  const refreshData = () => {
    if (isAuthenticated) {
      const usersData = getUsersData();
      const depositsData = getDepositsData();
      const withdrawalsData = getWithdrawalsData();
      
      setUsers(usersData);
      setDeposits(depositsData);
      setWithdrawals(withdrawalsData);
      
      console.log('Admin panel data refreshed:', {
        users: usersData.length,
        deposits: depositsData.length,
        withdrawals: withdrawalsData.length
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Admin login screen
  if (!isAuthenticated) {
    return (
      <main className={styles.container}>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
              <h1>🔐 Admin Panel</h1>
              <p>Enter password to access admin dashboard</p>
            </div>
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className={styles.passwordInput}
                  required
                />
              </div>
              <button type="submit" className={styles.loginButton}>
                Login
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Admin dashboard
  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>🔐 Admin Dashboard</h1>
          <p>Welcome! {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} at {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={refreshData} className={styles.refreshButton}>
            🔄 Refresh
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'deposits' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          📥 Deposits
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'withdrawals' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          📤 Withdrawals
        </button>
      </nav>

      {/* Content Area */}
      <div className={styles.content}>
        {activeTab === 'users' && (
          <section className={styles.usersSection}>
            <div className={styles.sectionHeader}>
              <h2>Registered Users</h2>
              <p>Total users: {users.length}</p>
            </div>
            <div className={styles.tableContainer}>
              {users.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <h3>No Users Registered</h3>
                  <p>No users have registered yet. Users will appear here when they connect their wallets.</p>
                </div>
              ) : (
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Wallet Address</th>
                      <th>Join Date</th>
                      <th>Total Deposits</th>
                      <th>Total Withdrawals</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId} className={styles.tableRow}>
                        <td className={styles.userId}>{user.userId}</td>
                        <td className={styles.walletAddress}>{user.walletAddress}</td>
                        <td className={styles.joinDate}>{formatDate(user.joinDate)}</td>
                        <td className={styles.deposits}>{user.totalDeposits}</td>
                        <td className={styles.withdrawals}>{user.totalWithdrawals}</td>
                        <td className={styles.lastActivity}>{formatDate(user.lastActivity)}</td>
                        <td className={styles.actions}>
                          <button className={styles.viewButton}>View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === 'deposits' && (
          <section className={styles.depositsSection}>
            <div className={styles.sectionHeader}>
              <h2>Deposit Requests</h2>
              <p>Pending proof submissions</p>
            </div>
            <div className={styles.tableContainer}>
              {deposits.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📥</div>
                  <h3>No Deposit Requests</h3>
                  <p>No pending deposit proof submissions at this time.</p>
                </div>
              ) : (
                <table className={styles.depositsTable}>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Token</th>
                      <th>Transaction Hash</th>
                      <th>Wallet Address</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className={styles.tableRow}>
                        <td className={styles.userId}>{deposit.userId}</td>
                        <td className={styles.token}>{deposit.token}</td>
                        <td className={styles.txHash}>{deposit.transactionHash}</td>
                        <td className={styles.walletAddress}>{deposit.walletAddress}</td>
                        <td className={styles.date}>{formatDate(deposit.submissionDate)}</td>
                        <td>
                          <span className={`${styles.status} ${styles.pending}`}>
                            Pending Review
                          </span>
                        </td>
                        <td className={styles.actions}>
                          <button className={styles.approveButton}>Approve</button>
                          <button className={styles.rejectButton}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === 'withdrawals' && (
          <section className={styles.withdrawalsSection}>
            <div className={styles.sectionHeader}>
              <h2>Withdrawal Requests</h2>
              <p>Pending withdrawal approvals</p>
            </div>
            <div className={styles.tableContainer}>
              {withdrawals.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📤</div>
                  <h3>No Withdrawal Requests</h3>
                  <p>No pending withdrawal requests at this time.</p>
                </div>
              ) : (
                <table className={styles.withdrawalsTable}>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Token</th>
                      <th>Amount</th>
                      <th>Destination Address</th>
                      <th>Request Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className={styles.tableRow}>
                        <td className={styles.userId}>{withdrawal.userId}</td>
                        <td className={styles.token}>{withdrawal.token}</td>
                        <td className={styles.amount}>{withdrawal.amount}</td>
                        <td className={styles.walletAddress}>{withdrawal.destinationAddress}</td>
                        <td className={styles.date}>{formatDate(withdrawal.requestDate)}</td>
                        <td>
                          <span className={`${styles.status} ${styles.pending}`}>
                            Pending Approval
                          </span>
                        </td>
                        <td className={styles.actions}>
                          <button className={styles.approveButton}>Approve</button>
                          <button className={styles.rejectButton}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
