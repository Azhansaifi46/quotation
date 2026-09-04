# Hosting on Render & Permanent Data Persistence Guide

This guide explains how to host your **Solar Quotation Maker** on Render so that **your data (Quotations, Customers, Products, Settings) remains permanently saved in the cloud forever** and is accessible from any device (phones, tablets, laptops, office PCs).

---

## ❓ Will Data Remain Saved on Your Device After Hosting on Render?

### **YES, 100% Permanently!**
When you host this application on Render and connect it to a **free MongoDB Atlas Cloud Database**:
1. **Permanent Cloud Storage**: All quotations you create, customer records, products, company settings, and UPI bank details are stored securely in MongoDB Atlas Cloud.
2. **Access From Any Device**: You can log into your Render URL (`https://your-app-name.onrender.com`) from your **mobile phone, tablet, or laptop**, and all your saved quotations and data will instantly be there.
3. **No Data Loss on Server Sleep/Restart**: Render's free tier sleeps when idle; when it wakes up, all your data remains completely safe in the cloud database.

---

## 🚀 Step 1: Get Free MongoDB Atlas Cloud Database (Takes 2 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create Deployment** and select the **FREE M0 Cluster** (Shared).
3. Under **Security Quickstart**:
   - Create a **Username** (e.g. `solaradmin`) and a **Password** (e.g. `SolarPass123!`). Save these!
   - Under **IP Access List**, select **Allow Access from Anywhere (`0.0.0.0/0`)** so Render can connect.
4. Click **Connect** > **Drivers** (Node.js).
5. Copy your connection string. It looks like:
   ```
   mongodb+srv://solaradmin:<password>@cluster0.abcde.mongodb.net/qoutpro?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and change database name to `/qoutpro`)*

---

## 🌐 Step 2: Push Code to GitHub

1. Initialize Git in the project folder if not already done:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Solar Quotation Maker"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## ⚡ Step 3: Deploy to Render (Single Web Service)

1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository.
4. Fill in the deployment details:
   - **Name**: `sun-bright-solar-quotation` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://solaradmin:YourPassword@cluster0.abcde.mongodb.net/qoutpro?retryWrites=true&w=majority`
   - **Key**: `NODE_ENV`
   - **Value**: `production`
6. Click **Deploy Web Service**!

---

## 🎉 Done!
Your live website will be available at:
`https://sun-bright-solar-quotation.onrender.com`

- You can open this link on **any mobile phone or computer**.
- Any quotation created will be **instantly saved to MongoDB Cloud** and remain permanently available everywhere.
