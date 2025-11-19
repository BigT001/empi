# Sentry Error Tracking Setup

## What is Sentry?

Sentry is an error tracking platform that captures real-time errors from your production app. This is especially useful for mobile uploads where we can't directly debug user devices.

## Why We Added Sentry

Mobile users were getting: **"Error: the string did not match the expected pattern"**

With Sentry, we can:
- ✅ See the exact error stack trace from the user's device
- ✅ Know what device type and browser they're using
- ✅ See which stage the upload failed (reading, compressing, uploading)
- ✅ Track file size, file type, and other context
- ✅ Get notifications when errors spike

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up (free account works great for this)
3. Create a new organization
4. Create a new project and select **Next.js** as the platform

### 2. Get Your DSN

After creating the project, you'll see your **DSN** (Data Source Name):
- It looks like: `https://abc123@sentry.io/987654`

### 3. Add DSN to Environment

Add to your `.env.local`:

```
NEXT_PUBLIC_SENTRY_DSN="https://your-key@sentry.io/your-project-id"
```

### 4. Verify Setup

When you run the app in production and errors occur, they'll automatically appear in your Sentry dashboard.

## What Gets Tracked

### Image Upload Errors

When users encounter errors during upload, Sentry captures:

```
Tag: component = "product-upload"
Tag: device_type = "ios" | "android" | "mobile" | "desktop"
Tag: stage = "reading" | "compressing" | "uploading" | "submission"

Context:
- File name
- File size (in bytes)
- File type (MIME type)
- User Agent
- Error message
- HTTP status (if API error)
```

### Example Error Report

When a mobile user gets an error:

```
Error: "string did not match the expected pattern"
Device: iOS
Stage: compressing
File: IMG_1234.JPG (5.2 MB)
File Type: (empty - common on mobile!)
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)
```

Now you can see **exactly** what went wrong!

## Production Only

By default, Sentry only tracks **production errors** (not local development).

To test errors in development:
```bash
NODE_ENV=production npm run dev
```

## Dashboard Features

In your Sentry dashboard, you can:

- 📊 **Issues** - See all unique errors grouped
- 📈 **Stats** - View error frequency over time
- 🔔 **Alerts** - Get notified when errors spike
- 📱 **Device Info** - Filter by iOS, Android, Desktop
- 🏷️ **Tags** - Filter by upload stage, error type
- 👥 **Users** - Track how many users are affected

## Interpreting Upload Errors

When a mobile upload fails:

1. Go to Sentry dashboard
2. Find the error in the "Issues" section
3. Click on it to see:
   - **Device type** - Is it iOS or Android?
   - **File info** - What file size/type?
   - **Stage** - Where did it fail?
   - **Stack trace** - The exact line of code

## Common Errors We Can Track

| Error | Cause | Fix |
|-------|-------|-----|
| "string did not match" | Empty MIME type | ✅ We default to JPEG |
| "Failed to load image" | Corrupted Base64 | ✅ We validate format |
| "Canvas context failed" | Out of memory | ✅ We reduce dimensions |
| "AbortError" | Network timeout | ✅ We set 30s timeout |

## Cost

- **Free tier**: 5,000 errors/month (plenty for most apps)
- **Paid tiers**: Start at $29/month for higher volume
- For this project, free tier is more than enough

## Disabling Sentry

If you don't want error tracking, simply don't set `NEXT_PUBLIC_SENTRY_DSN`.
The app will work fine without it (just no error tracking).

## Troubleshooting

### Errors not appearing in Sentry?

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly in `.env.local`
2. Verify DSN is for a **Next.js** project (not a generic project)
3. Make sure app is running in **production mode**
4. Check Sentry dashboard "Settings > Project > Integrations" are enabled

### Privacy Concerns?

- Sentry has a privacy-first option: don't send user data
- Update `.env.local` to use a privacy-focused DSN
- Or self-host Sentry on your own server

## Next Steps

1. Sign up at [sentry.io](https://sentry.io)
2. Create a Next.js project
3. Copy the DSN
4. Add to `.env.local` as `NEXT_PUBLIC_SENTRY_DSN`
5. Deploy to production
6. Wait for errors to arrive in Sentry dashboard
