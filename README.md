# WeWallet - Crypto Wallet Interface

A modern, secure crypto wallet interface that supports multiple wallet providers including MetaMask and WalletConnect.

## Features

- 🔗 **Multi-Wallet Support**: Connect with MetaMask, Trust Wallet, or any WalletConnect-compatible wallet
- 💰 **Live Crypto Prices**: Real-time price updates for Bitcoin, Ethereum, and BNB
- 🔒 **Non-Custodial**: You own your keys - no third-party custody
- 🚀 **No KYC Required**: 100% crypto-focused with no fiat integration
- 📱 **Mobile Friendly**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A crypto wallet (MetaMask, Trust Wallet, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wewallet
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## How to Connect Your Wallet

### Option 1: MetaMask (Recommended)
1. Install [MetaMask](https://metamask.io/) browser extension
2. Create or import a wallet
3. Click "Connect Wallet" on the homepage
4. Approve the connection in MetaMask popup

### Option 2: Mobile Wallets (Trust Wallet, etc.)
1. Install a WalletConnect-compatible wallet on your mobile device
2. Click "Connect Wallet" on the homepage
3. Scan the QR code with your mobile wallet
4. Approve the connection in your wallet app

## Supported Networks

- Ethereum Mainnet
- Binance Smart Chain (BSC)
- Polygon

## Development

### Project Structure
```
src/
├── app/           # Next.js app directory
├── components/    # React components
├── lib/          # Utility functions (wallet.js)
└── styles/       # CSS modules
```

### Key Files
- `src/app/page.js` - Main homepage with wallet connection
- `src/lib/wallet.js` - Wallet connection logic
- `src/styles/Landing.module.css` - Styling

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Wallet Connection Issues

1. **"No wallet detected"**: Install MetaMask or another wallet extension
2. **"User rejected connection"**: Make sure to approve the connection in your wallet
3. **"Connection failed"**: Check your internet connection and try again

### Common Issues

- **Metamask not appearing**: Make sure MetaMask is installed and unlocked
- **QR code not working**: Ensure your mobile wallet supports WalletConnect
- **Network errors**: Check if you're on a supported network (Ethereum Mainnet by default)

## Security

- This is a frontend-only application
- No private keys are stored or transmitted
- All wallet interactions happen locally in your browser
- Always verify transactions in your wallet before confirming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
