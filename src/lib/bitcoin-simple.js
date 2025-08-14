// Simplified Bitcoin implementation for production deployment
// This avoids WebAssembly issues while still providing core functionality

const API_BASE_URL = 'https://api.blockcypher.com/v1/btc/main';

// Get Bitcoin balance for an address
export const getBitcoinBalance = async (address) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addrs/${address}/balance`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.balance / 100000000; // Convert satoshis to BTC
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error);
    throw new Error('Failed to fetch Bitcoin balance');
  }
};

// Get UTXOs for a Bitcoin address
export const getUTXOs = async (address) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addrs/${address}?unspentOnly=true`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.txrefs || [];
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    throw new Error('Failed to fetch UTXOs');
  }
};

// Validate Bitcoin address format (basic validation)
export const isValidBitcoinAddress = (address) => {
  try {
    // Basic Bitcoin address validation
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Check for valid Bitcoin address prefixes
    const validPrefixes = ['1', '3', 'bc1'];
    const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    
    if (!hasValidPrefix) {
      return false;
    }
    
    // Check length (basic validation)
    if (address.length < 26 || address.length > 90) {
      return false;
    }
    
    // Check for valid characters
    const validChars = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return validChars.test(address);
  } catch (error) {
    return false;
  }
};

// Get transaction details
export const getTransactionDetails = async (txid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/txs/${txid}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      txid: data.hash,
      confirmations: data.confirmations,
      block_height: data.block_height,
      total: data.total / 100000000,
      fees: data.fees / 100000000,
      inputs: data.inputs,
      outputs: data.outputs
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw new Error('Failed to fetch transaction details');
  }
};

// Estimate transaction fee
export const estimateTransactionFee = (inputCount, outputCount) => {
  // Rough estimation: 1 input = 148 bytes, 1 output = 34 bytes
  const estimatedSize = (inputCount * 148) + (outputCount * 34) + 10;
  const feeRate = 10; // satoshis per byte (adjust based on network conditions)
  return estimatedSize * feeRate;
};

// Generate a mock Bitcoin address (for demonstration)
export const generateMockBitcoinAddress = () => {
  const prefixes = ['bc1', '1', '3'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let address = prefix;
  
  for (let i = 0; i < 30; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return address;
};
