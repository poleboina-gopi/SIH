# 🌐 Cloud Deployment Guide: Vercel, Render & MongoDB Atlas

Complete step-by-step guide to deploy the **Legal Metrology Compliance System**:
- **Frontend (SPA)**: [Vercel](https://vercel.com)
- **Backend (API)**: [Render](https://render.com)
- **Database (Cloud)**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📋 Architecture Overview

```mermaid
graph LR
    Inspector([Officer / User]) -->|HTTPS| Vercel[Vercel Frontend: React + Vite]
    Vercel -->|REST API Requests: VITE_API_BASE_URL| Render[Render Backend: Node.js Express API]
    Render -->|Mongoose Connection: MONGODB_URI| Atlas[(MongoDB Atlas Cloud DB)]
```

---

## 1️⃣ Step 1: Set up MongoDB Atlas (Free Cluster)

1. Sign in or create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Deployment** and choose the **M0 Free** shared cluster.
3. Select your preferred cloud provider and region (e.g., AWS / Mumbai or Singapore).
4. **Database Access (User Credentials)**:
   - Go to **Security** → **Database Access** → **Add New Database User**.
   - Choose **Password** authentication.
   - Username: `admin` (or your choice).
   - Password: Click *Autogenerate Secure Password* and **copy it down**.
   - Database User Privileges: `Read and write to any database`.
   - Click **Add User**.
5. **Network Access (IP Whitelist)**:
   - Go to **Security** → **Network Access** → **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) — *this is required so Render can connect*.
   - Click **Confirm**.
6. **Get Connection String**:
   - Go to **Database** → Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection string:
     ```text
     mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and append the database name `/legal_metrology`:
     ```text
     mongodb+srv://admin:MyPassword123@cluster0.abcde.mongodb.net/legal_metrology?retryWrites=true&w=majority
     ```
   - Keep this string ready for Render in Step 2.

> [!TIP]
> The backend will automatically seed initial default inspector accounts (`inspector@gov.in`), admin accounts (`admin@gov.in`), rules, and benchmark packaging samples on its very first connection to MongoDB Atlas!

---

## 2️⃣ Step 2: Deploy Backend to Render

1. Sign in to [Render](https://dashboard.render.com).
2. Click **New +** in the top right → Select **Web Service**.
3. Connect your GitHub account and select your repository: **`poleboina-gopi/SIH`**.
4. Configure the Web Service settings:
   - **Name**: `legal-metrology-api` (or any name you prefer)
   - **Region**: Closest to your users (e.g., *Singapore* or *Frankfurt*)
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ *(Make sure to set this to `server`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Environment Variables**:
   Under **Advanced** → **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `JWT_SECRET` | `legal_metrology_jwt_secret_production_2024` |
   | `MONGODB_URI` | *Your MongoDB Atlas connection string from Step 1* |

6. Click **Deploy Web Service**.
7. Wait 1-2 minutes for the build to finish. Once live, Render will provide your public URL:
   ```text
   https://legal-metrology-api.onrender.com
   ```
8. **Verify Backend Health**:
   Open in your browser:
   `https://legal-metrology-api.onrender.com/api/health`
   You should see:
   ```json
   {
     "status": "HEALTHY",
     "system": "Legal Metrology Compliance System API",
     "database": "MongoDB Atlas"
   }
   ```

---

## 3️⃣ Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Under **Import Git Repository**, select **`poleboina-gopi/SIH`**.
4. Configure the project settings:
   - **Project Name**: `legal-metrology-compliance`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select **`client`** ⚠️ *(Crucial step)*
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
5. **Environment Variables**:
   Expand the **Environment Variables** section and add:
   | Name | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://legal-metrology-api.onrender.com/api` *(replace with your actual Render URL from Step 2)* |

6. Click **Deploy**.
7. Vercel will build and deploy the React application in ~30 seconds.
8. Click on the generated domain (e.g., `https://legal-metrology-compliance.vercel.app`) to open the app!

---

## 4️⃣ Step 4: Verification & Testing

1. Open your Vercel deployment URL (or `http://localhost:5173` locally).
2. Sign in using the official credentials, or create your own protected officer account:
   - **Admin Account**:
     - **Login ID**: `admin@gov.in` OR Indian Mobile: `9811122233`
     - **Password**: `Admin@2026!`
   - **Inspector Account**:
     - **Login ID**: `inspector@gov.in` OR Indian Mobile: `9876543210`
     - **Password**: `Inspector@2026!`
   - **Create New Officer Account**:
     - Click **Create Account** to register with First Name, Last Name, Indian Mobile (`+91`), Official Email, and a Google-standard password.
3. On the Inspector Hub, select **"SuperClean Power Detergent 500gms"** from the 1-Click Benchmark Test Suite.
4. Click **"Execute Compliance Scan"** → **"Validate Statutory Compliance"**.
5. Verify the **Statutory Commodity Inspection Certificate** and **Form 1 Show Cause Notice** render with legal citations (Rule 6(1)(c), Rule 6(1)(e), Rule 6(1)(n)).
6. Switch to **Admin Intelligence** and observe that all data is stored live in your **MongoDB Atlas** database!

---

## 🔄 Re-Deploying Updates

Any future code changes pushed to `https://github.com/poleboina-gopi/SIH.git` will automatically trigger:
- **Render**: Automatically re-builds and updates the backend API.
- **Vercel**: Automatically re-builds and updates the frontend web app.
