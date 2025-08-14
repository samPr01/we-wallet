import { ethers } from 'ethers';
import { TOKEN_CONTRACTS } from './config.js';

// USDT ERC-20 ABI (minimal for transfers)
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// USDC ERC-20 ABI (same as USDT)
const USDC_ABI = USDT_ABI;

// Get USDT contract instance
export const getUSDTContract = (signer) => {
  return new ethers.Contract(TOKEN_CONTRACTS.USDT, USDT_ABI, signer);
};

// Get USDC contract instance
export const getUSDCContract = (signer) => {
  return new ethers.Contract(TOKEN_CONTRACTS.USDC, USDC_ABI, signer);
};

// Get USDT balance for an address
export const getUSDTBalance = async (address, provider) => {
  try {
    const contract = new ethers.Contract(TOKEN_CONTRACTS.USDT, USDT_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    throw new Error('Failed to fetch USDT balance');
  }
};

// Get USDC balance for an address
export const getUSDCBalance = async (address, provider) => {
  try {
    const contract = new ethers.Contract(TOKEN_CONTRACTS.USDC, USDC_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    throw new Error('Failed to fetch USDC balance');
  }
};

// Transfer USDT
export const transferUSDT = async (fromAddress, toAddress, amount, signer) => {
  try {
    const contract = getUSDTContract(signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log(`Transferring ${amount} USDT from ${fromAddress} to ${toAddress}`);
    
    // Estimate gas for the transaction
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountWei);
    
    // Execute the transfer
    const tx = await contract.transfer(toAddress, amountWei, {
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    console.log('USDT transfer transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      receipt,
      amount,
      from: fromAddress,
      to: toAddress
    };
  } catch (error) {
    console.error('Error transferring USDT:', error);
    throw new Error(`USDT transfer failed: ${error.message}`);
  }
};

// Transfer USDC
export const transferUSDC = async (fromAddress, toAddress, amount, signer) => {
  try {
    const contract = getUSDCContract(signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log(`Transferring ${amount} USDC from ${fromAddress} to ${toAddress}`);
    
    // Estimate gas for the transaction
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountWei);
    
    // Execute the transfer
    const tx = await contract.transfer(toAddress, amountWei, {
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    console.log('USDC transfer transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      receipt,
      amount,
      from: fromAddress,
      to: toAddress
    };
  } catch (error) {
    console.error('Error transferring USDC:', error);
    throw new Error(`USDC transfer failed: ${error.message}`);
  }
};

// Get token information
export const getTokenInfo = async (tokenAddress, provider) => {
  try {
    const contract = new ethers.Contract(tokenAddress, USDT_ABI, provider);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ]);
    
    return {
      name,
      symbol,
      decimals,
      address: tokenAddress
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw new Error('Failed to fetch token information');
  }
};

// Validate token address
export const isValidTokenAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Get token balance for any ERC-20 token
export const getTokenBalance = async (tokenAddress, userAddress, provider) => {
  try {
    const contract = new ethers.Contract(tokenAddress, USDT_ABI, provider);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw new Error('Failed to fetch token balance');
  }
};

// Transfer any ERC-20 token
export const transferToken = async (tokenAddress, fromAddress, toAddress, amount, signer) => {
  try {
    const contract = new ethers.Contract(tokenAddress, USDT_ABI, signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    // Estimate gas for the transaction
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountWei);
    
    // Execute the transfer
    const tx = await contract.transfer(toAddress, amountWei, {
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      receipt,
      amount,
      from: fromAddress,
      to: toAddress
    };
  } catch (error) {
    console.error('Error transferring token:', error);
    throw new Error(`Token transfer failed: ${error.message}`);
  }
};
