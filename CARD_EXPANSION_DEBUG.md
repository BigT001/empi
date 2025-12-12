# Card Expansion Issue - Debug Report

## Problem Statement
User reports: "When I expand one card, others automatically expand with it"

Each card should expand independently. When one card is expanded and another is clicked, the first should collapse and the second should expand.

## Expected Behavior
- Only ONE card should be expanded at any time
- When user clicks on an expanded card, it should collapse
- When user clicks on a collapsed card, any other expanded card should first collapse, then the clicked card should expand
- `expandedCustomOrder` state should store only ONE order._id (or null)

## Current Implementation
- State: `const [expandedCustomOrder, setExpandedCustomOrder] = useState<string | null>(null);`
- Logic: `const isExpanded = expandedCustomOrder === order._id;`
- Handler: `onClick={handleCardToggle}`
- Handler Code:
  ```tsx
  const handleCardToggle = () => {
    console.log('[Card Toggle] Current expanded:', expandedCustomOrder, 'Clicked order:', order._id, 'Currently expanded?:', isExpanded);
    if (isExpanded) {
      // Close this card
      setExpandedCustomOrder(null);
    } else {
      // Close any previously expanded card and open this one
      setExpandedCustomOrder(order._id);
    }
  };
  ```

## Test Steps
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Dashboard > Custom Orders tab
4. Click on first card header - should expand
   - Check console: should see `[Card Toggle] Opening card: [ID1]`
   - Card 1 should show expanded content
   - Cards 2 and 3 should remain collapsed
   
5. Click on second card header - should collapse card 1 and expand card 2
   - Check console: should see `[Card Toggle] Opening card: [ID2]`
   - Card 1 should be collapsed
   - Card 2 should be expanded
   - Card 3 should remain collapsed

6. Click on expanded card 2 header again - should collapse card 2
   - Check console: should see `[Card Toggle] Closing card: [ID2]`
   - Card 2 should be collapsed
   - Cards 1 and 3 should remain collapsed

## Possible Root Causes
1. **State Issue**: `expandedCustomOrder` is somehow storing multiple IDs (unlikely given type)
2. **Duplicate Order IDs**: Multiple orders in the array share the same `_id` (possible DB issue)
3. **Visual/CSS Issue**: Only one card is actually expanded, but CSS makes it look like multiple are
4. **Event Propagation Issue**: Click events are bubbling and triggering multiple handlers
5. **Rendering Issue**: The `isExpanded` calculation is incorrect for some cards

## Console Log Output to Check
When clicking cards, watch for these logs:
- `[Card Toggle] Current expanded: [ID] Clicked order: [ID] Currently expanded?: true|false`
- `[Card Toggle] Opening card: [ID]`
- `[Card Toggle] Closing card: [ID]`

Also watch regular expansion logs:
- `Expanded card: [orderNumber] ID: [ID] expandedCustomOrder state: [ID]`

## Next Steps
1. Monitor console logs when expanding/collapsing cards
2. Check if all order._id values are unique
3. Verify state updates are working correctly
4. Check for CSS overflow/z-index issues
