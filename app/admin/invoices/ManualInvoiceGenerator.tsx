"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Package, Share2 } from "lucide-react";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { StoredInvoice } from "@/lib/invoiceStorage";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productId?: string;
  imageUrl?: string;
}

interface Product {
  _id: string;
  name: string;
  sellPrice: number;
  rentPrice?: number;
  imageUrl?: string;
}

const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

export function ManualInvoiceGenerator() {
  // Generate short invoice number
  const generateShortInvoiceNumber = () => {
    return `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  const [formData, setFormData] = useState({
    invoiceNumber: generateShortInvoiceNumber(),
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderNumber: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "NGN",
    taxRate: 7.5,
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (showProductPicker && products.length === 0) {
      loadProducts();
    }
  }, [showProductPicker]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      // Use lite mode for faster loading (only essentials for product picker)
      const response = await fetch("/api/products?lite=1");
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Loaded products:", data);
      const productList = Array.isArray(data) ? data : (data.data || data.products || []);
      setProducts(productList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load products";
      console.error("Failed to load products:", err);
      setProductsError(errorMsg);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const addProductToInvoice = (product: Product, quantity: number = 1) => {
    setItems([
      ...items,
      {
        id: `prod-${product._id}-${Math.random()}`,
        name: product.name,
        quantity,
        price: product.sellPrice,
        productId: product._id,
        imageUrl: product.imageUrl,
      },
    ]);
    setSelectedProductQuantity({});
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * (formData.taxRate / 100);
  const totalAmount = subtotal + taxAmount;
  const currency = CURRENCIES.find(c => c.code === formData.currency)!;

  const handleSaveInvoice = async () => {
    if (!formData.customerName.trim()) {
      alert("Customer name is required");
      return;
    }
    if (!formData.customerEmail.trim()) {
      alert("Customer email is required");
      return;
    }
    if (items.length === 0) {
      alert("Add at least one item to the invoice");
      return;
    }

    const invoice = {
      invoiceNumber: formData.invoiceNumber,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      orderNumber: formData.orderNumber || `MAN-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      dueDate: formData.dueDate,
      currency: formData.currency,
      currencySymbol: currency.symbol,
      taxRate: formData.taxRate,
      type: 'manual',
      status: 'sent',
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      taxAmount,
      shippingCost: 0,
      totalAmount,
    };

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });

      if (response.ok) {
        setSuccessMessage(`✅ Invoice ${formData.invoiceNumber} saved to database!`);
        
        // Reset form
        setFormData({
          invoiceNumber: `INV-${Date.now()}`,
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          orderNumber: "",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          currency: "NGN",
          taxRate: 7.5,
        });
        setItems([]);
        
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save invoice"}`);
      }
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Error saving invoice to database");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Manual Invoice</h2>
        <p className="text-sm text-gray-600 mt-1">Generate custom invoices to send to your clients</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order Number</label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    step="0.5"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Items</h3>
            <div className="space-y-4">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start border border-gray-200 rounded-lg p-3">
                      {item.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                            placeholder="Product name"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="w-20">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Qty</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                              min="1"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Price</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <p className="text-xs text-gray-600 mb-1">Total</p>
                            <p className="font-semibold text-gray-900">{currency.symbol}{(item.quantity * item.price).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-lime-500 text-gray-600 hover:text-lime-600 px-4 py-2 rounded-lg font-semibold transition mt-4"
              >
                <Plus className="h-5 w-5" />
                Add Item
              </button>
              <button
                onClick={() => setShowProductPicker(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg font-semibold transition mt-2"
              >
                <Package className="h-5 w-5" />
                Add from Products
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div>
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Invoice Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{currency.symbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                <span className="font-semibold">{currency.symbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-lime-600">{currency.symbol}{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-200">
              <p className="font-semibold mb-2">Invoice Information:</p>
              <p><strong>Invoice #:</strong> {formData.invoiceNumber}</p>
              <p><strong>Customer:</strong> {formData.customerName || "—"}</p>
              <p><strong>Items:</strong> {items.length}</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setPreview(true)}
                disabled={items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={handleSaveInvoice}
                disabled={items.length === 0 || !formData.customerName}
                className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8 max-h-[calc(100vh-100px)] flex flex-col">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Invoice Preview</h3>
              <button
                onClick={() => setPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Professional Invoice Preview */}
              <div dangerouslySetInnerHTML={{ 
                __html: generateProfessionalInvoiceHTML({
                  _id: '',
                  invoiceNumber: formData.invoiceNumber,
                  customerName: formData.customerName || 'Customer Name',
                  customerEmail: formData.customerEmail || 'customer@email.com',
                  customerPhone: formData.customerPhone || 'Phone',
                  orderNumber: formData.orderNumber || '',
                  items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  subtotal,
                  tax: taxAmount,
                  taxRate: formData.taxRate,
                  totalAmount,
                  currency: formData.currency,
                  currencySymbol: currency.symbol,
                  invoiceDate: new Date().toISOString(),
                  dueDate: formData.dueDate,
                  shippingCost: 0,
                  notes: 'Thank you for your business!',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as StoredInvoice)
              }} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Products from Inventory</h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {productsLoading ? (
              <div className="p-8 text-center text-gray-600">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <p className="mt-3">Loading products...</p>
              </div>
            ) : productsError ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{productsError}</p>
                <button
                  onClick={loadProducts}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No products found
              </div>
            ) : (
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex gap-4">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Price: <span className="font-bold text-lime-600">{currency.symbol}{product.sellPrice.toFixed(2)}</span>
                          </p>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={selectedProductQuantity[product._id] || 1}
                              onChange={(e) =>
                                setSelectedProductQuantity({
                                  ...selectedProductQuantity,
                                  [product._id]: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => {
                                const qty = selectedProductQuantity[product._id] || 1;
                                addProductToInvoice(product, qty);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold text-sm transition"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setShowProductPicker(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
