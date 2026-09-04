# 🚀 Complete Free Cloud Deployment Guide (Zero-Cost Hosting & Permanent Storage)

This guide walks you through hosting your **BillPro SaaS Quotation & Billing App** 100% **FREE** on the cloud with **permanent data persistence** across all devices.

---

## 📋 Recommended Free Hosting Stack (100% Free Forever)
| Component | Free Platform | Features |
| :--- | :--- | :--- |
| **Full-Stack Web App** | [Render.com](https://render.com) *(or Railway / Koyeb)* | Free Node.js Web Service + Automatic Git Deploys + Free SSL (`https://`) |
| **Cloud Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) | Free 512 MB M0 Cluster (Permanent storage for all Quotations & Customers) |
| **Email Delivery** *(Optional)* | Gmail App Password or Brevo | Free OTP & Quotation dispatch to customer inboxes |

---

## ⚡ Step 1: Create Free MongoDB Atlas Database (Takes 2 Minutes)

All quotations, invoices, customers, and business profiles are permanently stored in MongoDB Atlas Cloud.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account (or log in with Google).
2. Click **Create Deployment** → Select the **M0 FREE** tier (Shared).
3. Under **Security Quickstart**:
   - **Database User**: Enter a username (e.g. `billpro_admin`) and secure password (e.g. `BillProCloud2026!`). **Save these credentials!**
   - **Network Access**: Click **Add IP Access List** → Select **Allow Access from Anywhere (`0.0.0.0/0`)** so your cloud hosting provider can connect.
4. Click **Connect** → Choose **Drivers** (Node.js).
5. Copy your connection string. It will look like:
   ```env
   mongodb+srv://billpro_admin:BillProCloud2026!@cluster0.abcde.mongodb.net/qoutpro?retryWrites=true&w=majority
   ```
   *(Ensure you replace the password with your actual password and specify `/qoutpro` before the `?`)*.

---

## 🌐 Step 2: Push Code to Your GitHub Repository

If you haven't pushed your latest code to GitHub yet:

```bash
git add .
git commit -m "Deploy: cloud hosting configuration and error resolutions"
git push origin main
```

---

## 🚀 Step 3: Deploy on Render.com (Recommended Free Platform)

### Option A: 1-Click Blueprint (Fastest)
1. Log into [Render.com](https://render.com) using your GitHub account.
2. Click **New +** → **Blueprint**.
3. Select your repository (`Azhansaifi46/quotation`).
4. Render will read `render.yaml` automatically!
5. In the **Environment Variables** prompt, paste your `MONGODB_URI` from Step 1.
6. Click **Apply**. Render will automatically build the frontend, start the server, and give you a live URL!

---

### Option B: Manual Web Service Setup
1. On [Render.com Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect your GitHub repository (`quotation`).
3. Fill in the following settings:
   - **Name**: `billpro-quotation-app` (or your chosen name)
   - **Language / Runtime**: `Node`
   - **Region**: Closest to you (e.g. `Singapore` or `Frankfurt` or `Oregon`)
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan Type**: `Free`

4. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://billpro_admin:BillProCloud2026!@cluster0.abcde.mongodb.net/qoutpro?retryWrites=true&w=majority` |
   | `JWT_SECRET` | *(Enter any random 32+ character string or generate one)* |
   | `OTP_SECRET` | *(Enter any random string)* |
   | `APP_NAME` | `BillPro SaaS` |

5. *(Optional Email Configuration for Real Inbox Delivery)*:
   | Key | Value |
   | :--- | :--- |
   | `SMTP_USER` | `your-email@gmail.com` |
   | `SMTP_PASS` | `your-16-character-google-app-password` |

6. Click **Deploy Web Service**!

---

## 🚂 Alternative Option: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → select `quotation`.
3. Railway will detect the `Procfile` and Node.js setup automatically.
4. In project **Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `PORT`: `5000`
5. Click **Generate Domain** under Settings to get your public URL.

---

## 🌊 Alternative Option: Deploy on Koyeb

1. Go to [Koyeb.com](https://www.koyeb.com) and create a free account.
2. Click **Create App** → **GitHub**.
3. Select your repository.
4. Set **Build command**: `npm run build` and **Run command**: `npm start`.
5. Add your `MONGODB_URI` environment variable and deploy.

---

## 🛠️ Verification & Troubleshooting Checklist

- [x] **Zero Build Errors**: Root `npm run build` automatically runs `install:all` and Vite bundle optimization.
- [x] **Safe Cold Starts**: Database connection has a 10s connection timeout before fallback so MongoDB Atlas connects smoothly.
- [x] **NoSQL & Regex Injection Guard**: Search queries with special symbols `()[]+*` are safely escaped.
- [x] **Multi-Tenant Isolation**: Every user's quotations, invoices, and settings are strictly private and isolated.

### Common Questions:
1. **Why does the initial page load take ~30 seconds on Render?**
   - Free tier instances sleep after 15 minutes of inactivity. The first request wakes up the container; subsequent requests are instant.
2. **Will my data be lost when Render restarts?**
   - **No.** Because data is stored in MongoDB Atlas Cloud, it is 100% permanent and preserved forever across server restarts and devices.
