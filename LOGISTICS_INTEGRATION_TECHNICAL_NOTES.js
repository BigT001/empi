/**
 * LOGISTICS PAGE - USER DETAILS INTEGRATION
 * 
 * PROBLEM:
 * - Logistics cards only showed minimal order info (name, email, phone)
 * - Missing shipping address details needed for actual delivery
 * - No way to pull customer's complete profile information
 * 
 * SOLUTION:
 * 1. Created API endpoint to fetch buyer details by email/ID
 * 2. Modified logistics page to "enrich" orders with full user details
 * 3. Built specialized LogisticsOrderCard to display complete information
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API FLOW:
 * 
 *   GET /api/buyers/[id]?type=email
 *   ├─ Input: user@email.com (or MongoDB ID)
 *   └─ Returns: {
 *       _id: "...",
 *       email: "user@email.com",
 *       fullName: "John Doe",
 *       phone: "+234 123 456 7890",
 *       address: "123 Main Street",
 *       city: "Lagos",
 *       state: "Lagos State",
 *       postalCode: "100001"
 *     }
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * LOGISTICS PAGE WORKFLOW:
 * 
 *   useEffect() → Load sessionStorage 'logistics_orders'
 *       ↓
 *   enrichOrders(ordersArray) → For each order:
 *       ├─ Call fetchBuyerDetails(order.email)
 *       ├─ Wait for API response with complete buyer profile
 *       └─ Merge: { ...order, userDetails: { ...buyerData } }
 *       ↓
 *   State: enrichedOrders = [ { ...order, userDetails }, ... ]
 *       ↓
 *   Render: enrichedOrders.map(order => <LogisticsOrderCard order={order} />)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * LOGISTICS CARD STRUCTURE:
 * 
 *   ┌──────────────────────────────────────────────────┐
 *   │ ORDER #12345 | 2025-01-13 | Status: Ready ✓      │ ← Order Header
 *   ├──────────────────────────────────────────────────┤
 *   │ 📦 CUSTOMER DETAILS                              │
 *   │ ─────────────────────────────────────────────    │
 *   │ 👤 John Doe                                      │ ← From userDetails
 *   │ ✉️  john@email.com                                │ ← From userDetails
 *   │ 📞 +234 123 456 7890                             │ ← From userDetails
 *   ├──────────────────────────────────────────────────┤
 *   │ 🏠 DELIVERY ADDRESS                              │
 *   │ ─────────────────────────────────────────────    │
 *   │ 📍 123 Main Street, Lagos                        │ ← From userDetails
 *   │ 🏙️  Lagos                                        │ ← From userDetails
 *   │ 📍 Lagos State                                   │ ← From userDetails
 *   ├──────────────────────────────────────────────────┤
 *   │ 📋 ORDER DETAILS                                 │
 *   │ ─────────────────────────────────────────────    │
 *   │ Description: Custom red gown                     │ ← From order
 *   │ Quantity: 1                                      │ ← From order
 *   │ Price: ₦50,000                                   │ ← From order
 *   ├──────────────────────────────────────────────────┤
 *   │ [Design 1] [Design 2]                            │ ← Clickable images
 *   ├──────────────────────────────────────────────────┤
 *   │ [Mark Shipped ✓]  [Delete ✕]                     │ ← Action buttons
 *   └──────────────────────────────────────────────────┘
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * KEY IMPROVEMENTS:
 * 
 * ✅ Complete Address Information:
 *    - Full street address from buyer profile
 *    - City and state for location clarity
 *    - All needed for actual shipping/delivery
 * 
 * ✅ Linked to User Identity:
 *    - Uses email as primary unique identifier
 *    - Falls back to buyerId if email lookup fails
 *    - Maintains referential integrity
 * 
 * ✅ Parallel Processing:
 *    - Fetches all buyer details simultaneously using Promise.all()
 *    - Fast performance even with multiple orders
 * 
 * ✅ Graceful Degradation:
 *    - Shows "Not provided" for missing fields
 *    - Doesn't break if API fails temporarily
 *    - Always renders card, with or without enriched data
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * USAGE EXAMPLE:
 * 
 *   // In logistics page component:
 *   const enrichOrders = async (orders) => {
 *     return Promise.all(
 *       orders.map(async (order) => {
 *         const buyerDetails = await fetchBuyerDetails(
 *           order.email,    // ← Primary lookup
 *           order.buyerId   // ← Fallback
 *         );
 *         return {
 *           ...order,
 *           userDetails: buyerDetails // ← Merge buyer details
 *         };
 *       })
 *     );
 *   };
 *   
 *   // Rendering:
 *   {enrichedOrders.map(order => (
 *     <LogisticsOrderCard
 *       order={order}  // ← Contains userDetails property
 *       onMarkShipped={() => markAsShipped(order._id)}
 *       onDelete={() => deleteOrder(order._id)}
 *     />
 *   ))}
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */
