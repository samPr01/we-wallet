# Netlify Environment Variables Setup for WeWallet

## Required Environment Variables

Set these environment variables in your Netlify dashboard under **Site settings > Environment variables**:

### Core Configuration
```
NEXT_PUBLIC_PROJECT_ID=07b02acd712d354bbeacc0d5ef0642f7
```

### Deposit Addresses
```
NEXT_PUBLIC_BTC_DEPOSIT_ADDRESS=bc1qr63h7nzs0lhzumk2stg7fneymwceu2y7erd96l
NEXT_PUBLIC_USDT_DEPOSIT_ADDRESS=TQbchYKr8FbXCVPNTtDVdrfGYKiUnkJVnY
NEXT_PUBLIC_ETH_DEPOSIT_ADDRESS=0x2499aDe1b915E12819e8E38B1d9ed3493107E2B1
```

### Token Contract Addresses
```
NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C
NEXT_PUBLIC_WETH_CONTRACT_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

### Network Configuration
```
NEXT_PUBLIC_ETHEREUM_NETWORK=mainnet
NEXT_PUBLIC_BITCOIN_NETWORK=mainnet
```

### Debug Configuration (Optional)
```
NEXT_PUBLIC_ENABLE_LOGS=true
```

## How to Set Environment Variables on Netlify

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Go to Site settings > Environment variables**
4. **Add each variable** with the exact names and values above
5. **Deploy your site** - the variables will be available in production

## Troubleshooting Wallet Connection Issues

### Common Issues and Solutions:

1. **"No Web3 wallet detected"**
   - Ensure user has MetaMask or another wallet installed
   - Check if the site is served over HTTPS (required for wallet connections)

2. **"WalletConnect connection failed"**
   - Verify `NEXT_PUBLIC_PROJECT_ID` is set correctly
   - Check if the project ID is valid on WalletConnect Cloud

3. **"Environment variables not loading"**
   - Ensure all variables start with `NEXT_PUBLIC_`
   - Redeploy the site after adding environment variables
   - Check browser console for any errors

4. **"Domain not allowed"**
   - Add your domain to the allowed list in WalletConnect Cloud dashboard
   - Ensure the domain matches exactly (including www/non-www)

## Testing Environment Variables

You can test if environment variables are loaded by:

1. Opening browser console on your deployed site
2. Looking for debug logs starting with `[WeWallet Debug]`
3. Checking if all required variables are present

## Security Notes

- All variables starting with `NEXT_PUBLIC_` are exposed to the client
- Never include private keys or sensitive data in these variables
- The deposit addresses are public and safe to expose
