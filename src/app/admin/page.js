'use client';

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import { 
  getAdminDashboardData, 
  approveDeposit, 
  rejectDeposit, 
  approveWithdrawal, 
  rejectWithdrawal,
  updateUserActivity,
  exportData
} from '../../lib/api-user-management';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'deposits', 'withdrawals'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  });
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

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
      loadAdminData();
    }
  }, [isAuthenticated]);

  const loadAdminData = () => {
    try {
      const data = getAdminDashboardData();
      setUsers(data.users);
      setDeposits(data.deposits);
      setWithdrawals(data.withdrawals);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

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

  const formatAmount = (amount, token) => {
    if (token === 'BTC') {
      return `${parseFloat(amount).toFixed(8)} BTC`;
    } else if (token === 'ETH') {
      return `${parseFloat(amount).toFixed(4)} ETH`;
    } else {
      return `${parseFloat(amount).toFixed(2)} ${token}`;
    }
  };

  const handleApproveDeposit = async (depositId) => {
    setLoading(true);
    try {
      const result = approveDeposit(depositId, adminNotes);
      if (result) {
        alert('Deposit approved successfully!');
        loadAdminData(); // Refresh data
        setAdminNotes('');
      } else {
        alert('Failed to approve deposit');
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      alert('Error approving deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDeposit = async (depositId) => {
    setLoading(true);
    try {
      const result = rejectDeposit(depositId, adminNotes);
      if (result) {
        alert('Deposit rejected successfully!');
        loadAdminData(); // Refresh data
        setAdminNotes('');
      } else {
        alert('Failed to reject deposit');
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      alert('Error rejecting deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    setLoading(true);
    try {
      const result = approveWithdrawal(withdrawalId, null, adminNotes);
      if (result) {
        alert('Withdrawal approved successfully!');
        loadAdminData(); // Refresh data
        setAdminNotes('');
      } else {
        alert('Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Error approving withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    setLoading(true);
    try {
      const result = rejectWithdrawal(withdrawalId, adminNotes);
      if (result) {
        alert('Withdrawal rejected successfully!');
        loadAdminData(); // Refresh data
        setAdminNotes('');
      } else {
        alert('Failed to reject withdrawal');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Error rejecting withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `walletbase-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const handleClearData = () => {
    alert('Data clearing is not available with MongoDB backend. Data is persistent and secure.');
  };

  const handleRefreshData = () => {
    loadAdminData();
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
          <button onClick={handleRefreshData} className={styles.refreshButton} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={handleExportData} className={styles.exportButton}>
            📊 Export Data
          </button>
          <button onClick={handleClearData} className={styles.clearButton}>
            🗑️ Clear Data
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Statistics Overview */}
      <section className={styles.statisticsSection}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.totalUsers}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatAmount(statistics.totalDeposits, 'USD')}</div>
          <div className={styles.statLabel}>Total Deposits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatAmount(statistics.totalWithdrawals, 'USD')}</div>
          <div className={styles.statLabel}>Total Withdrawals</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.pendingDeposits}</div>
          <div className={styles.statLabel}>Pending Deposits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.pendingWithdrawals}</div>
          <div className={styles.statLabel}>Pending Withdrawals</div>
        </div>
      </section>

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
          📥 Deposits ({deposits.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'withdrawals' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          📤 Withdrawals ({withdrawals.length})
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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={styles.tableRow}>
                        <td className={styles.userId}>{user.userId}</td>
                        <td className={styles.walletAddress}>{user.walletAddress}</td>
                        <td className={styles.joinDate}>{formatDate(user.joinDate)}</td>
                        <td className={styles.deposits}>{formatAmount(user.totalDeposits, 'USD')}</td>
                        <td className={styles.withdrawals}>{formatAmount(user.totalWithdrawals, 'USD')}</td>
                        <td className={styles.lastActivity}>{formatDate(user.lastActivity)}</td>
                        <td className={styles.status}>
                          <span className={`${styles.statusBadge} ${styles.active}`}>
                            {user.status}
                          </span>
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
              <p>Total deposits: {deposits.length} | Pending: {statistics.pendingDeposits}</p>
            </div>
            
            {/* Admin Notes Input */}
            <div className={styles.adminNotesSection}>
              <label>Admin Notes (for approval/rejection):</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes for approval/rejection..."
                className={styles.adminNotesInput}
                rows="3"
              />
            </div>

            <div className={styles.tableContainer}>
              {deposits.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📥</div>
                  <h3>No Deposit Requests</h3>
                  <p>No deposit requests at this time.</p>
                </div>
              ) : (
                <table className={styles.depositsTable}>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Token</th>
                      <th>Amount</th>
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
                        <td className={styles.amount}>{formatAmount(deposit.amount, deposit.token)}</td>
                        <td className={styles.txHash}>{deposit.transactionHash}</td>
                        <td className={styles.walletAddress}>{deposit.walletAddress}</td>
                        <td className={styles.date}>{formatDate(deposit.submissionDate)}</td>
                        <td>
                          <span className={`${styles.status} ${styles[deposit.status]}`}>
                            {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                          </span>
                        </td>
                        <td className={styles.actions}>
                          {deposit.status === 'pending' ? (
                            <>
                              <button 
                                className={styles.approveButton}
                                onClick={() => handleApproveDeposit(deposit.id)}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                className={styles.rejectButton}
                                onClick={() => handleRejectDeposit(deposit.id)}
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={styles.processedDate}>
                              {deposit.processedDate ? formatDate(deposit.processedDate) : 'N/A'}
                            </span>
                          )}
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
              <p>Total withdrawals: {withdrawals.length} | Pending: {statistics.pendingWithdrawals}</p>
            </div>
            
            {/* Admin Notes Input */}
            <div className={styles.adminNotesSection}>
              <label>Admin Notes (for approval/rejection):</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes for approval/rejection..."
                className={styles.adminNotesInput}
                rows="3"
              />
            </div>

            <div className={styles.tableContainer}>
              {withdrawals.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📤</div>
                  <h3>No Withdrawal Requests</h3>
                  <p>No withdrawal requests at this time.</p>
                </div>
              ) : (
                <table className={styles.withdrawalsTable}>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Token</th>
                      <th>Amount</th>
                      <th>Destination Address</th>
                      <th>Transfer Method</th>
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
                        <td className={styles.amount}>{formatAmount(withdrawal.amount, withdrawal.token)}</td>
                        <td className={styles.walletAddress}>{withdrawal.destinationAddress}</td>
                        <td className={styles.transferMethod}>{withdrawal.transferMethod}</td>
                        <td className={styles.date}>{formatDate(withdrawal.requestDate)}</td>
                        <td>
                          <span className={`${styles.status} ${styles[withdrawal.status]}`}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </span>
                        </td>
                        <td className={styles.actions}>
                          {withdrawal.status === 'pending' ? (
                            <>
                              <button 
                                className={styles.approveButton}
                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                className={styles.rejectButton}
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={styles.processedDate}>
                              {withdrawal.processedDate ? formatDate(withdrawal.processedDate) : 'N/A'}
                            </span>
                          )}
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
