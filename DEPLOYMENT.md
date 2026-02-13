# Nouryaak Pool - Deployment Guide

## ✅ GitHub Repository

**Repository URL**: https://github.com/aymanTahri2131/nouryaak_pool.git

Your code has been successfully pushed to GitHub!

---

## 🚀 Netlify Deployment (Frontend)

### Step 1: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Select your repository: `aymanTahri2131/nouryaak_pool`

### Step 2: Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: (leave empty - root directory)

### Step 3: Set Environment Variables

Before deploying, add these environment variables in Netlify:

Go to **Site settings** → **Environment variables** → **Add a variable**

```
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

> **Note**: You'll get the Railway backend URL in the next section. You can deploy now and update these later.

### Step 4: Deploy

Click **"Deploy site"**

Netlify will:
- Build your frontend
- Deploy to a URL like `https://random-name-123456.netlify.app`
- You can customize this domain later

---

## 🚂 Railway Deployment (Backend)

### Step 1: Create Railway Account

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub (recommended)

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `aymanTahri2131/nouryaak_pool`

### Step 3: Configure Service

Railway will detect your `railway.json` configuration.

1. **Root Directory**: Set to `backend` (important!)
   - Go to **Settings** → **Root Directory** → Enter `backend`

2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`

### Step 4: Add MongoDB Database

You need a MongoDB database for production:

#### Option A: MongoDB Atlas (Recommended - Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Railway access
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/nouryaak-pool`)

#### Option B: Railway MongoDB Plugin

1. In your Railway project, click **"New"** → **"Database"** → **"Add MongoDB"**
2. Railway will provide a `MONGO_URL` environment variable

### Step 5: Add Redis (Optional but Recommended)

1. In your Railway project, click **"New"** → **"Database"** → **"Add Redis"**
2. Railway will provide a `REDIS_URL` environment variable

### Step 6: Set Environment Variables

Go to your backend service → **Variables** tab and add:

```bash
# Server
NODE_ENV=production
PORT=3001

# MongoDB (use your Atlas connection string or Railway MONGO_URL)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nouryaak-pool

# Redis (use Railway REDIS_URL if you added Redis)
REDIS_URL=redis://default:password@host:port

# JWT & Sessions (IMPORTANT: Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-TO-RANDOM-STRING
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-CHANGE-THIS-TO-RANDOM-STRING

# Aronium (disable for production)
ARONIUM_EXPORT_ENABLED=false

# Sync settings
SYNC_INTERVAL_MINUTES=5
AUTO_SYNC_ENABLED=false

# Frontend CORS (update after Netlify deployment)
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

> **⚠️ IMPORTANT**: Generate strong random strings for `JWT_SECRET` and `SESSION_SECRET`!

### Step 7: Deploy

Railway will automatically deploy your backend. You'll get a URL like:
`https://nouryaak-pool-production.up.railway.app`

---

## 🔗 Connect Frontend to Backend

### Update Netlify Environment Variables

1. Go to your Netlify site → **Site settings** → **Environment variables**
2. Update (or add) these variables with your Railway URL:

```
VITE_API_URL=https://your-railway-url.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-url.up.railway.app
```

3. **Trigger a new deploy** in Netlify to use the new environment variables

### Update Railway CORS

1. Go to Railway → Your backend service → **Variables**
2. Update `CORS_ORIGIN` with your Netlify URL:

```
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] **Frontend loads** at your Netlify URL
- [ ] **Backend health check** works: `https://your-railway-url.up.railway.app/api/health`
- [ ] **Login page** displays the Nouryaak Pool logo
- [ ] **Can login** with demo credentials (PIN: 0000)
- [ ] **Real-time updates** work (Socket.io connection)
- [ ] **Database** is accessible (check Railway logs)

---

## 🔧 Troubleshooting

### Frontend Issues

**Problem**: API calls fail
- Check `VITE_API_URL` is set correctly in Netlify
- Verify Railway backend is running
- Check browser console for CORS errors

**Problem**: Environment variables not working
- Redeploy the site after changing variables
- Clear browser cache

### Backend Issues

**Problem**: Database connection fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (should include 0.0.0.0/0)
- Check Railway logs for connection errors

**Problem**: CORS errors
- Verify `CORS_ORIGIN` matches your Netlify URL exactly
- Include `https://` in the URL
- Redeploy after changing CORS settings

**Problem**: Build fails
- Check Railway logs
- Verify `backend` is set as root directory
- Ensure all dependencies are in `package.json`

---

## 📝 Post-Deployment Tasks

1. **Custom Domain** (Optional)
   - Netlify: Site settings → Domain management
   - Railway: Settings → Domains

2. **Seed Database**
   - SSH into Railway or use Railway CLI
   - Run: `npm run seed`

3. **Monitor Logs**
   - Netlify: Deploys → Deploy log
   - Railway: Service → Logs tab

4. **Set up Analytics** (Optional)
   - Add analytics to track usage

---

## 🎉 Your Deployment URLs

Once deployed, you'll have:

- **Frontend**: `https://your-site.netlify.app`
- **Backend API**: `https://your-backend.up.railway.app/api`
- **GitHub**: https://github.com/aymanTahri2131/nouryaak_pool.git

---

## 🔐 Security Notes

- ✅ `.env` files are in `.gitignore` (not committed)
- ✅ Use strong secrets for JWT and sessions
- ✅ MongoDB Atlas has authentication enabled
- ⚠️ Consider adding rate limiting for production
- ⚠️ Review CORS settings for production use
