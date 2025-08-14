'use client';

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'deposits', 'withdrawals'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock user data - in real app, this would come from a database
  useEffect(() => {
    if (isAuthenticated) {
      // Simulate fetching user data
      const mockUsers = [
        {
          userId: 'ABC12',
          walletAddress: '0x1234...5678',
          joinDate: '2024-01-15',
          totalDeposits: 2,
          totalWithdrawals: 1,
          lastActivity: '2024-01-15 14:30:00'
        },
        {
          userId: 'XYZ34',
          walletAddress: '0xabcd...efgh',
          joinDate: '2024-01-14',
          totalDeposits: 1,
          totalWithdrawals: 0,
          lastActivity: '2024-01-15 13:45:00'
        }
      ];
      setUsers(mockUsers);
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
                  <tr className={styles.tableRow}>
                    <td className={styles.userId}>ABC12</td>
                    <td className={styles.token}>BTC</td>
                    <td className={styles.txHash}>...5678</td>
                    <td className={styles.walletAddress}>0x1234...5678</td>
                    <td className={styles.date}>{formatDate('2024-01-15 14:30:00')}</td>
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
                </tbody>
              </table>
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
              <table className={styles.withdrawalsTable}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Token</th>
                    <th>Amount</th>
                    <th>Wallet Address</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.tableRow}>
                    <td className={styles.userId}>XYZ34</td>
                    <td className={styles.token}>ETH</td>
                    <td className={styles.amount}>0.5 ETH</td>
                    <td className={styles.walletAddress}>0xabcd...efgh</td>
                    <td className={styles.date}>{formatDate('2024-01-15 13:45:00')}</td>
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
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
