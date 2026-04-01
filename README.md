
# NE Retail Hub | Regional Logistics Grid v3.0

A professional, high-density inventory management and branch reordering platform for the North East regional retail network. This platform features a dual-interface system for Regional Administrators and Branch Managers.

## 🚀 Deployment & Version Control

### 🐙 GitHub Upload Protocol
To push this project to a GitHub repository:
1. **Initialize Git**:
   ```bash
   git init
   ```
2. **Add Project Files**:
   ```bash
   git add .
   ```
3. **Commit Changes**:
   ```bash
   git commit -m "Initial Grid Deployment v3.0"
   ```
4. **Link to GitHub**:
   - Create a new repository on [GitHub](https://github.com/new).
   - Link the remote: `git remote add origin <your-repo-url>`
5. **Push to Main**:
   ```bash
   git push -u origin main
   ```

### ☁️ Firebase App Hosting
This application is optimized for **Firebase App Hosting**. Once your code is on GitHub, you can connect the repository in the Firebase Console for automated CI/CD deployments.

## 🔐 Core Features

### 🛠️ Regional Administrators (Command Console)
- **Neural Grid Stats**: Real-time traffic telemetry and node status monitoring.
- **AI Synthesis**: Genkit-powered inventory analyst providing strategic logistics recommendations and damage risk assessments.
- **Identity Whitelist**: Master Admin authority to provision or revoke access for regional controllers.
- **Global SKU Registry**: Visual identity capture (camera integration) for provisioning new products.
- **Traffic Logs**: Full CSV export capabilities for Packet PO tracking.

### 🏪 Branch Managers (Retail Portal)
- **Multi-Item Cart**: High-efficiency consolidated reordering system.
- **Granular Damage Reporting**: "One-by-one" unit control for reporting damaged stock from delivered packets.
- **Identity Handshake**: Biometric (simulated) and standard secure authorization nodes.
- **Log Registry**: Complete history of branch-specific telemetry and reorder packets.

---
Built with **Next.js 15**, **Firebase (Auth & Firestore)**, **ShadCN UI**, and **Genkit AI**.
