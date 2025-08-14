// WalletConnect Configuration
// You can get a free project ID from https://cloud.walletconnect.com/

import { WALLETCONNECT_CONFIG as CONFIG } from './config.js';

export const WALLETCONNECT_CONFIG = {
  // This is a demo project ID - replace with your own from https://cloud.walletconnect.com/
  projectId: CONFIG.PROJECT_ID,
  
  // Optional: Custom metadata for your app
  metadata: {
    name: 'WalletBase',
    description: 'Decentralized Trading Platform',
    url: 'https://wewallet.vercel.app',
    icons: ['https://wewallet.vercel.app/favicon.ico']
  },
  
  // Optional: Custom chains
  chains: [1], // Ethereum Mainnet
  
  // Optional: Custom RPC URLs
  rpcMap: {
    1: 'https://ethereum.publicnode.com'
  }
};

// Helper function to get WalletConnect configuration
export const getWalletConnectConfig = () => {
  return {
    projectId: WALLETCONNECT_CONFIG.projectId,
    metadata: WALLETCONNECT_CONFIG.metadata,
    chains: WALLETCONNECT_CONFIG.chains,
    rpcMap: WALLETCONNECT_CONFIG.rpcMap
  };
};
