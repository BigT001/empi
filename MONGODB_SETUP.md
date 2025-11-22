# 🔧 MongoDB Setup - Complete Guide

## Problem
You're getting a **500 error** when fetching products because the `MONGODB_URI` environment variable is not configured.

## Solution

### Step 1: Get Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Click on your **Cluster** (database)
4. Click the **"Connect"** button
5. Select **"Drivers"** → Choose **"Node.js"** → Version **5.9 or later**
6. Copy the connection string (it looks like):
   ```
   mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
   ```

### Step 2: Update Your Environment Files

Two files have been created for you:

#### Option A: Using `.env.local` (Recommended for Development)
```
# File: .env.local
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority
```

#### Option B: Using `.env` (Production)
```
# File: .env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority
```

### Step 3: Replace Placeholders

In your connection string, replace:
- **`YOUR_USERNAME`** - Your MongoDB user (e.g., `admin`)
- **`YOUR_PASSWORD`** - Your MongoDB password (URL-encoded if it has special characters)
- **`YOUR_CLUSTER`** - Your cluster name (e.g., `cluster0.abcd123`)
- **`YOUR_DATABASE`** - Your database name (e.g., `empi`)

**Example:**
```
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/empi?retryWrites=true&w=majority
```

### Step 4: Make Sure Your IP is Whitelisted

1. In MongoDB Atlas, go to **Network Access** → **IP Whitelist**
2. Verify your IP `105.115.5.103` is added ✅
3. Or add `0.0.0.0/0` for all IPs (less secure, only for development)

### Step 5: Restart Your Application

1. Stop your dev server (Ctrl+C)
2. Run: `npm run dev`
3. Test by going to http://localhost:3000

### Step 6: Verify Connection

Run this command to test:
```bash
node test-db-connection.js
```

You should see:
```
✅ Successfully connected to MongoDB!
✅ Database is accessible
📊 Available Collections:
   - products
   - users
   ...
```

## Troubleshooting

### Still Getting 500 Error?

1. **Check `.env.local` is saved correctly**
   ```powershell
   Get-Content .env.local
   ```

2. **Verify connection string format**
   - Should start with `mongodb+srv://`
   - Should contain `@` separating credentials from host
   - Should end with database name before `?`

3. **Test connection directly**
   ```bash
   node test-db-connection.js
   ```

4. **Check MongoDB Atlas**
   - IP is whitelisted (Network Access)
   - Database user has correct password
   - Database exists

5. **Clear Next.js cache and restart**
   ```bash
   rm -r .next
   npm run dev
   ```

### Common Errors

| Error | Fix |
|-------|-----|
| `MONGODB_URI is not set` | Add `MONGODB_URI` to `.env.local` |
| `authentication failed` | Check username/password in connection string |
| `IP is not whitelisted` | Add your IP to MongoDB Atlas Network Access |
| `connect ETIMEDOUT` | Check firewall, network connection, or IP whitelist |

## ⚠️ Security Note

- **Never commit** `.env.local` to Git
- **Never share** your connection string publicly
- For production, use environment variables from your hosting provider (Vercel, Railway, etc.)

## Files Modified

- ✅ Created `.env.local` - Local development environment variables
- ✅ Created `.env` - Template for environment variables
- ✅ Created `test-db-connection.js` - Database connection diagnostic tool

---

**Need more help?**
1. Check browser console for error messages
2. Run `node test-db-connection.js` for detailed diagnostics
3. Visit [MongoDB Documentation](https://docs.mongodb.com/) for more info
