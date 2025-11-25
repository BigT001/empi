# Google Maps API Key Setup Guide

## Quick Summary
Your `.env.local` has been updated with the placeholder for Google Maps API. You need to:
1. Get a Google Maps API key from Google Cloud Console
2. Add it to your `.env.local`
3. Restart your dev server

---

## Step-by-Step Instructions

### 1. Get Your Google Maps API Key

#### Option A: Quick Setup (5 minutes)
1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Sign in with your Google account
3. **Create a new project** or select existing one
4. Search for **"Maps JavaScript API"** in the search bar
5. Click on it and press **Enable**
6. Go to **Credentials** (left sidebar)
7. Click **Create Credentials → API Key**
8. Copy the API key (it looks like: `AIzaSyD...something...`)

#### Option B: Using Google Maps Platform
1. Go to **Google Maps Platform**: https://mapsplatform.google.com/
2. Click **Get Started**
3. Select **Maps** and other products you need
4. Click **Continue**
5. Create a new project
6. Set up billing (requires credit card, but free tier covers lots of usage)
7. Copy your API key

### 2. Update `.env.local`

Open `.env.local` and update this line:

```bash
# BEFORE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# AFTER
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrst
```

Replace `AIzaSyD1234567890abcdefghijklmnopqrst` with your actual API key.

### 3. Restrict Your API Key (Recommended)

For security, restrict your API key:

1. In **Google Cloud Console → Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **HTTP referrers (web sites)**
4. Add your domain(s):
   - For local development: `http://localhost:3000/*`
   - For production: `https://yourdomain.com/*`

5. Under **API restrictions**, select **Restrict key** and choose:
   - ✅ Maps JavaScript API
   - (Optionally: Places API if using address autocomplete)

### 4. Enable Required APIs

In **Google Cloud Console**:

1. Go to **APIs & Services → Enabled APIs and services**
2. Ensure these are enabled:
   - ✅ **Maps JavaScript API** (required)
   - ✅ **Geocoding API** (for address lookup)
   - ✅ **Distance Matrix API** (if calculating distances)

Current implementation uses:
- Maps JavaScript API ✅

### 5. Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

Visit `http://localhost:3000/cart` - the delivery modal should now load without errors!

---

## Pricing & Billing

**Good News**: Google Maps API has a generous **free tier**:
- **$200/month free credit** (automatically applied)
- After that: ~$7 per 1000 map loads
- Most small projects stay within free tier

**Setup Billing**:
1. Go to Google Cloud Console
2. Click your project name (top)
3. Go to **Billing**
4. Create a billing account
5. Link it to your project

---

## Troubleshooting

### Error: "Google Maps API Key not configured"
- ✅ Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`
- ✅ Restart dev server (`npm run dev`)
- ✅ Hard refresh browser (Ctrl+Shift+R)

### Error: "Maps API call to unavailable url"
- Check API key is correct (copy-paste from console)
- Ensure Maps JavaScript API is enabled
- Check API restrictions if set

### Maps not displaying
- Open browser DevTools (F12)
- Check Console for errors
- Verify API key in Network tab

### Rate limiting errors
- Check billing is enabled
- Wait a few minutes (temporary limit resets)
- Consider upgrading billing plan

---

## What's Using Google Maps?

The delivery modal displays:
- 📍 State pickup locations (36 Nigerian states)
- 🗺️ Interactive map showing distance
- 📌 Markers for pickup and delivery points
- 📐 Distance calculation with delivery zones

All powered by Google Maps JavaScript API.

---

## Next Steps

1. ✅ Get API key from Google Cloud Console
2. ✅ Add to `.env.local`
3. ✅ Restart `npm run dev`
4. ✅ Test on `/cart` page
5. ✅ Enjoy the delivery modal! 🎉

---

## Support Files

Check these for more context:
- `DELIVERY_MODAL_COMPLETE_SUMMARY.md` - Full modal documentation
- `GOOGLE_MAPS_IMPLEMENTATION.md` - Technical implementation details
- `.env.example` - All environment variables needed
