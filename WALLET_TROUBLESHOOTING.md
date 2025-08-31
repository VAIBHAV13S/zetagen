# Wallet Connection Troubleshooting Guide

If you're experiencing issues connecting your wallet to Zeta-Gen, follow this guide to resolve common problems.

## Prerequisites

1. **MetaMask Extension**: Make sure you have the MetaMask browser extension installed
   - [Download MetaMask](https://metamask.io/download/)
   - Ensure it's enabled in your browser

2. **Browser Compatibility**: Use a modern browser (Chrome, Firefox, Edge, Brave)

## Common Issues & Solutions

### 1. "MetaMask not found" Error

**Problem**: The app can't detect MetaMask extension

**Solutions**:
- Install MetaMask extension if not already installed
- Refresh the page after installation
- Make sure MetaMask is enabled in your browser
- Check if MetaMask is blocked by ad blockers or privacy extensions

### 2. "No accounts found" Error

**Problem**: MetaMask is installed but no accounts are available

**Solutions**:
- Unlock MetaMask by entering your password
- Make sure you have at least one account created
- Check if MetaMask is connected to the correct network

### 3. "Failed to switch to ZetaChain network" Error

**Problem**: Can't automatically switch to the required network

**Solutions**:
- Manually add ZetaChain testnet to MetaMask:
  - Network Name: `ZetaChain Athens Testnet`
  - RPC URL: `https://zetachain-athens-evm.blockpi.network/v1/rpc/public`
  - Chain ID: `7001`
  - Currency Symbol: `ZETA`
  - Block Explorer: `https://zetachain-athens-3.blockscout.com/`

### 4. "User rejected" Error

**Problem**: User cancelled the wallet connection

**Solutions**:
- Click "Connect Wallet" again
- Make sure to approve the connection in MetaMask popup
- Check if MetaMask popup is blocked by browser

### 5. Wallet Connection Not Persisting

**Problem**: Wallet disconnects after page refresh

**Solutions**:
- The app now automatically reconnects to previously connected wallets
- Make sure MetaMask remains unlocked
- Check browser console for any errors

## Using the Debug Tool

The landing page includes a diagnostic tool that can help identify specific issues:

1. Click "Run Diagnostics" button
2. Review the status indicators
3. Follow the troubleshooting suggestions provided

## Manual Network Configuration

If automatic network switching fails, manually add ZetaChain testnet:

1. Open MetaMask
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add network"
4. Enter the following details:
   - **Network Name**: ZetaChain Athens Testnet
   - **New RPC URL**: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
   - **Chain ID**: 7001
   - **Currency Symbol**: ZETA
   - **Block Explorer URL**: https://zetachain-athens-3.blockscout.com/

## Browser Console Debugging

Open your browser's developer console (F12) to see detailed connection logs:

- Look for messages starting with 🔍, ✅, ❌, 🔄
- These logs show the step-by-step connection process
- Share any error messages with support if issues persist

## Still Having Issues?

If you continue to experience problems:

1. Check the browser console for error messages
2. Try refreshing the page
3. Disconnect and reconnect your wallet in MetaMask
4. Clear browser cache and cookies
5. Try a different browser
6. Ensure MetaMask is updated to the latest version

## Support

For additional help, please:
- Check the console logs for specific error messages
- Use the debug tool on the landing page
- Ensure you're using the latest version of MetaMask
- Try connecting from a different device or browser
