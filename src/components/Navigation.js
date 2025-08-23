'use client';

import { useUser } from '../contexts/UserContext';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { userId, walletAddress, clearUser } = useUser();

  const handleDisconnect = () => {
    clearUser();
    // You can add additional disconnect logic here if needed
  };

  return (
    <header className={styles.header}>
      <div className={styles.navLeft}>
        <div className={styles.logo}>WalletBase</div>
        <nav className={styles.nav}>
          <a href="/" className={styles.navLink}>Home</a>
          <a href="/market" className={styles.navLink}>Market</a>
          <a href="/orders" className={styles.navLink}>Orders</a>
          <a href="/ai-trading" className={styles.navLink}>$ Intelligent AI Trading</a>
          <a href="/settings" className={styles.navLink}>Settings</a>
        </nav>
      </div>
      
      <div className={styles.navRight}>
        {walletAddress && userId ? (
          <>
            <span className={styles.userId}>{userId}</span>
            <button onClick={handleDisconnect} className={styles.disconnectButton}>
              Disconnect
            </button>
          </>
        ) : (
          <span className={styles.noWallet}>No Wallet Connected</span>
        )}
      </div>
    </header>
  );
}
