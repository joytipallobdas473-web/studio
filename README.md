
# NE Retail Hub | Regional Logistics Grid v2.8

A professional, high-density inventory management and branch reordering platform for the North East regional retail network.

## 🚀 Deployment Protocol

To publish this app to a public URL:

1. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
2. **Initialize Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```
3. **Deploy to the Grid**:
   ```bash
   firebase deploy
   ```

## 🔐 Core Features

### 🛠️ Regional Administrators
- **Command Console**: Real-time traffic monitoring and global SKU authorization.
- **Identity Capture**: Live camera protocol for visual SKU provisioning.
- **Packet PO Export**: Download individual order logs as CSV for physical tracking.
- **Credential Rotation**: Secure admin passkey updates via the Settings module.

### 🏪 Branch Managers
- **Localized Entry**: Biometric (fingerprint) or standard identity synchronization.
- **Reorder Logic**: Real-time stock catalog browsing and packet transmission.
- **Support Node**: Instant access to regional support at **9085067897**.

---
Built with Next.js 15, Firebase, ShadCN UI, and Genkit AI.
