import { loadBitcoinLibraries, getBitcoinLibraries } from './bitcoin-loader.js';

// Bitcoin network configuration
let NETWORK = null; // Will be set after loading libraries
const API_BASE_URL = 'https://api.blockcypher.com/v1/btc/main';

// Initialize Bitcoin libraries
let bitcoin, ecc, bip32, bip39;

const initializeBitcoin = async () => {
  if (!bitcoin) {
    const libs = await loadBitcoinLibraries();
    bitcoin = libs.bitcoin;
    ecc = libs.ecc;
    bip32 = libs.bip32;
    bip39 = libs.bip39;
    
    // Set network after libraries are loaded
    if (bitcoin.networks) {
      NETWORK = bitcoin.networks.bitcoin; // Mainnet
    }
  }
  return { bitcoin, ecc, bip32, bip39, NETWORK };
};

// Generate a new Bitcoin address for deposits
export const generateBitcoinAddress = async () => {
  try {
    const { bitcoin, bip32, bip39, NETWORK } = await initializeBitcoin();
    
    // Generate a new mnemonic (in production, this would be stored securely)
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Derive the first address from the seed
    const root = bip32.fromSeed(seed, NETWORK);
    const path = `m/44'/0'/0'/0/0`; // BIP44 path for first address
    const child = root.derivePath(path);
    
    // Generate the address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: NETWORK
    });
    
    return {
      address,
      privateKey: child.toWIF(),
      mnemonic
    };
  } catch (error) {
    console.error('Error generating Bitcoin address:', error);
    throw new Error('Failed to generate Bitcoin address');
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

// Create and sign a Bitcoin transaction
export const createBitcoinTransaction = async (fromAddress, toAddress, amount, privateKey) => {
  try {
    // Get UTXOs for the source address
    const utxos = await getUTXOs(fromAddress);
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs found for the address');
    }
    
    // Calculate total available balance
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const amountSatoshi = Math.floor(amount * 100000000); // Convert BTC to satoshis
    
    if (amountSatoshi > totalBalance) {
      throw new Error('Insufficient balance');
    }
    
    // Create transaction
    const psbt = new bitcoin.Psbt({ network: NETWORK });
    
    // Add inputs
    let inputValue = 0;
    for (const utxo of utxos) {
      if (inputValue >= amountSatoshi) break;
      
      psbt.addInput({
        hash: utxo.tx_hash,
        index: utxo.tx_output_n,
        value: utxo.value,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(fromAddress, NETWORK),
          value: utxo.value
        }
      });
      
      inputValue += utxo.value;
    }
    
    // Add output
    psbt.addOutput({
      address: toAddress,
      value: amountSatoshi
    });
    
    // Add change output if needed
    const fee = 1000; // Estimated fee in satoshis
    const change = inputValue - amountSatoshi - fee;
    
    if (change > 546) { // Dust threshold
      psbt.addOutput({
        address: fromAddress,
        value: change
      });
    }
    
    // Sign the transaction
    const { ECPair } = await import('bitcoinjs-lib');
    const keyPair = ECPair.fromWIF(privateKey, NETWORK);
    psbt.signAllInputs(keyPair);
    
    // Finalize and extract transaction
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    
    return {
      hex: tx.toHex(),
      txid: tx.getId()
    };
  } catch (error) {
    console.error('Error creating Bitcoin transaction:', error);
    throw error;
  }
};

// Broadcast a Bitcoin transaction
export const broadcastBitcoinTransaction = async (txHex) => {
  try {
    const response = await fetch(`${API_BASE_URL}/txs/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx: txHex
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      txid: data.tx.hash,
      success: true
    };
  } catch (error) {
    console.error('Error broadcasting Bitcoin transaction:', error);
    throw new Error('Failed to broadcast transaction');
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

// Validate Bitcoin address
export const isValidBitcoinAddress = async (address) => {
  try {
    const { bitcoin, NETWORK } = await initializeBitcoin();
    bitcoin.address.toOutputScript(address, NETWORK);
    return true;
  } catch (error) {
    return false;
  }
};

// Estimate transaction fee
export const estimateTransactionFee = (inputCount, outputCount) => {
  // Rough estimation: 1 input = 148 bytes, 1 output = 34 bytes
  const estimatedSize = (inputCount * 148) + (outputCount * 34) + 10;
  const feeRate = 10; // satoshis per byte (adjust based on network conditions)
  return estimatedSize * feeRate;
};
