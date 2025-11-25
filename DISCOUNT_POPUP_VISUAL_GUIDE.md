# 🎉 Discount Popup - Visual Guide

## How It Looks

### Desktop View
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ╔══════════════════════════════════════════════╗     │
│  ║  🎉 Special Bulk Discounts!              ✕  ║     │
│  ║  Order multiple sets and save big!         ║     │
│  ╚══════════════════════════════════════════════╝     │
│  │                                              │     │
│  │  ┌──────────────────────────────────────┐  │     │
│  │  │ 5%  │ 3-5 Sets                      │  │     │
│  │  │     │ 5% discount on your order    │  │     │
│  │  └──────────────────────────────────────┘  │     │
│  │                                              │     │
│  │  ┌──────────────────────────────────────┐  │     │
│  │  │ 7%  │ 6-9 Sets                      │  │     │
│  │  │     │ 7% discount on your order    │  │     │
│  │  └──────────────────────────────────────┘  │     │
│  │                                              │     │
│  │  ┌──────────────────────────────────────┐  │     │
│  │  │ 10% │ 10+ Sets  🏆                  │  │     │
│  │  │     │ 10% discount on your order   │  │     │
│  │  └──────────────────────────────────────┘  │     │
│  │                                              │     │
│  │ Stock your events with our premium         │     │
│  │ costumes at unbeatable prices!             │     │
│  │                                              │     │
│  │     [Maybe Later]  [Got It! 👍]           │     │
│  │                                              │     │
│  ╚══════════════════════════════════════════════╝     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌────────────────────┐
│                    │
│  ╔════════════╗   │
│  ║ 🎉 Special ║   │
│  ║ Discounts! ║   │
│  ║ Order & ✕  ║   │
│  ║ Save Big!  ║   │
│  ╚════════════╝   │
│  │              │ │
│  │ ┌──────────┐ │ │
│  │ │ 5% 3-5  │ │ │
│  │ │ Sets    │ │ │
│  │ └──────────┘ │ │
│  │              │ │
│  │ ┌──────────┐ │ │
│  │ │ 7% 6-9  │ │ │
│  │ │ Sets    │ │ │
│  │ └──────────┘ │ │
│  │              │ │
│  │ ┌──────────┐ │ │
│  │ │ 10% 10+ │ │ │
│  │ │ 🏆Sets  │ │ │
│  │ └──────────┘ │ │
│  │              │ │
│  │ [Later] [Got]│ │
│  │              │ │
│  ╚══════════════╝ │
│                    │
└────────────────────┘
```

## Color Scheme

### Header Gradient
```
┌─────────────────────────────┐
│ 🎉 Special Bulk Discounts! │
│ Order multiple sets & save! │
└─────────────────────────────┘
  ↓ ↓ ↓
 lime-500 → lime-600
```

### Discount Tier Colors
- **3-5 Sets**: Blue accent (blue-50 background, blue-500 badge)
- **6-9 Sets**: Purple accent (purple-50 background, purple-500 badge)
- **10+ Sets**: Green accent (green-50 background, green-500 badge, gold border highlight)

### Buttons
- **"Maybe Later"**: Gray button with border
- **"Got It! 👍"**: Lime green button (lime-600)

## Animation Details

### Entrance (On Load)
```
fade-in → 300ms duration
zoom-in-95 → 300ms duration
```

### Backdrop
```
Semi-transparent black overlay
backdrop-blur-sm for frosted glass effect
```

## When It Appears

### Flowchart
```
User visits website
         ↓
   [On Mount]
         ↓
Check localStorage:
- First visit? → YES → Show popup
- Time elapsed ≥ 7 min? → YES → Show popup
- Time elapsed < 7 min? → NO → Hide popup
         ↓
   [Popup Shown]
         ↓
User clicks close button
         ↓
Save timestamp to localStorage
     + Mark as closed
         ↓
Popup disappears
```

## Interactive Elements

### Close Button (Top-Right X)
- Hover effect: Gray background appears
- Click: Closes popup

### Backdrop Click
- Closes popup (same as close button)

### "Maybe Later" Button
- Closes popup
- Same behavior as close button
- Allows user to return in 7 minutes

### "Got It! 👍" Button
- Closes popup
- Same behavior as close button
- Acknowledges user has seen offer

## Features

### Smart Display Logic
✨ First visit → Always show
✨ Returns within 7 min → Don't show
✨ Returns after 7 min → Show again
✨ Uses browser localStorage (no server)

### Responsive Design
📱 Mobile: Full width with padding
📱 Tablet: Slightly larger
📱 Desktop: Max-width 28rem (448px)

### Accessibility
♿ Keyboard accessible (buttons are proper buttons)
♿ Close button uses X icon for clarity
♿ Clear, readable text hierarchy
♿ Good color contrast

## Technical Notes

### Storage Keys Used
```
localStorage.setItem("empi_discount_popup_closed", "true");
localStorage.setItem("empi_discount_popup_interval", timestamp);
```

### Dependencies
- React (useState, useEffect)
- lucide-react (X icon)
- Tailwind CSS (styling)

### Performance
- Lightweight component (minimal re-renders)
- No API calls
- No external images
- Fast load time

## Customization Quick Reference

### Change interval from 7 to 10 minutes
```tsx
<DiscountPopup intervalMinutes={10} />
```

### Change popup title
Edit line ~50 in DiscountPopup.tsx:
```tsx
<h2 className="text-2xl font-bold mb-2">🎉 Special Bulk Discounts!</h2>
```

### Change discount percentages
Edit lines ~65-90:
```tsx
// Change 5% to different percentage
// Change tier text
// Modify colors
```

### Change button text
Edit lines ~140-145:
```tsx
<button>Maybe Later</button>  {/* Edit */}
<button>Got It! 👍</button>    {/* Edit */}
```

---

**Created**: November 24, 2025
**Status**: ✅ Live & Production Ready
