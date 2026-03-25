
# NE Retail Hub | Regional Logistics Grid

A professional inventory management and branch reordering platform for the North East regional network.

## 🚀 Deployment Protocol

To publish this app to a public URL for your friends or partners:

1. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
2. **Initialize Firebase Hosting**:
   ```bash
   firebase login
   firebase init hosting
   ```
   *Select your project (`studio-6247286784-ddd17`) and follow the prompts.*

3. **Deploy to the Grid**:
   ```bash
   firebase deploy
   ```

## 🔐 Access Protocols

### Regional Administrators
- **Portal**: `/admin/login`
- **Identity Signature**: Any email containing `admin` (e.g., `admin@retail.com`).
- **Capabilities**: SKU provisioning, node authorization, global order tracking (Gmail, Phone, Address), and individual Packet PO downloads.

### Branch Managers
- **Portal**: `/register` (Compulsory Onboarding) or `/login`
- **Capabilities**: Real-time stock reordering, order history tracking, and localized biometric (fingerprint) entry.

---
Built with Next.js 15, Firebase, ShadCN UI, and Genkit AI.
