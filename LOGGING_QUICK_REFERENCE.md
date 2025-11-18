# Quick Logging Reference

## Browser Console Commands

### Get All Logs
```javascript
window.appLogs.getLogs()
```

### Get Statistics
```javascript
window.appLogs.getStats()
```

### Get Errors Only
```javascript
window.appLogs.getLogs({ level: 'ERROR' })
```

### Get Last 10 Logs
```javascript
window.appLogs.getLogs({ limit: 10 })
```

### Get Last 5 Warnings
```javascript
window.appLogs.getLogs({ level: 'WARN', limit: 5 })
```

### Export Logs
```javascript
window.appLogs.exportLogs()
```

### Clear Logs
```javascript
window.appLogs.clearLogs()
```

---

## What Gets Logged

### On ProductPage Load
- ✅ Product fetching initiated
- ✅ Products loaded from API (count shown)
- ✅ Specific product found or not found
- ❌ Any errors during loading

### On Add to Cart
- ✅ Product name, ID, mode, quantity, price

### On Errors
- ❌ Full error message
- ❌ Error context/details
- ❌ Stack trace if available

---

## View Logs in DevTools
1. Press `F12` to open DevTools
2. Click "Console" tab
3. Type: `window.appLogs.getLogs()`
4. Press Enter

---

## Errors Fixed
✅ CartProvider error - FIXED (no longer using useCart hook)
✅ Image grid showing 5 images - FIXED (now in one row)
✅ Missing logging system - FIXED (complete logging system added)
