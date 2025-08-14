// Receiving Addresses for Deposits
export const RECEIVING_ADDRESSES = {
  BTC: process.env.NEXT_PUBLIC_BTC_RECEIVING_ADDRESS,
  USDT: process.env.NEXT_PUBLIC_USDT_RECEIVING_ADDRESS,
  ETH: process.env.NEXT_PUBLIC_ETH_RECEIVING_ADDRESS
};

// WalletConnect Configuration
export const WALLETCONNECT_CONFIG = {
  PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID
};

// API Endpoints
export const API_ENDPOINTS = {
  COINGECKO: process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  BLOCKCYPHER: process.env.NEXT_PUBLIC_BLOCKCYPHER_API_URL || 'https://api.blockcypher.com/v1'
};
