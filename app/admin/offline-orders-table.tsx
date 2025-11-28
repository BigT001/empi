"use client";

import { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import OfflineOrderForm from "./offline-order-form";

interface OfflineOrder {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  subtotal: number;
  vat: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  isOffline: boolean;
}

interface OfflineOrdersTableProps {
  onOrderAdded?: () => void;
}

export default function OfflineOrdersTable({ onOrderAdded }: OfflineOrdersTableProps) {
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OfflineOrder | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ordersPerPage = 10;

  // Fetch offline orders
  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const skip = (currentPage - 1) * ordersPerPage;
      const params = new URLSearchParams({
        limit: ordersPerPage.toString(),
        skip: skip.toString(),
      });

      const response = await fetch(`/api/admin/offline-orders?${params}`);

      if (!response.ok) throw new Error("Failed to fetch offline orders");

      const data = await response.json();
      setOrders(data.data || []);
      setTotalOrders(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete offline order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/offline-orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete order");

      // Refresh orders
      setDeleteConfirm(null);
      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  // Filter orders based on search
  const filteredOrders = orders.filter((order) =>
    searchTerm.toLowerCase() === ""
      ? true
      : order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.firstName} ${order.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Payment method badge
  const getPaymentBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "bg-blue-100 text-blue-800";
      case "bank_transfer":
        return "bg-purple-100 text-purple-800";
      case "card":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition font-medium whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Offline Order
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !orders.length ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Loader className="h-8 w-8 animate-spin text-lime-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading offline orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No offline orders found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Click 'Add Offline Order' to create your first offline order"}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      VAT
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 text-sm">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {order.firstName} {order.lastName}
                          </p>
                          <p className="text-gray-500">{order.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="text-gray-900 font-medium">{order.phone || "—"}</p>
                        {order.city && (
                          <p className="text-gray-500 text-xs">
                            {order.city}
                            {order.state && `, ${order.state}`}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₦{order.subtotal.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-orange-600 font-medium">
                          ₦{order.vat.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-green-600">
                          ₦{order.total.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(
                            order.paymentMethod
                          )}`}
                        >
                          {order.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAddForm(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Edit Order"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(order._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * ordersPerPage + 1, totalOrders)} to{" "}
                {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <OfflineOrderForm
          onClose={() => {
            setShowAddForm(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setSelectedOrder(null);
            fetchOrders();
            onOrderAdded?.();
          }}
        />
      )}

      {/* View Details Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Order Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedOrder.orderNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">First Name</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedOrder.firstName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Last Name</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedOrder.lastName}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Email</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedOrder.email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedOrder.phone || "—"}</p>
              </div>

              {selectedOrder.city && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Location</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedOrder.city}
                    {selectedOrder.state && `, ${selectedOrder.state}`}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Amount</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ₦{selectedOrder.subtotal.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">VAT (7.5%)</p>
                    <p className="text-lg font-bold text-orange-600 mt-1">
                      ₦{selectedOrder.vat.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-600 uppercase">Total</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ₦{selectedOrder.total.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Payment</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(
                      selectedOrder.paymentMethod
                    )}`}
                  >
                    {selectedOrder.paymentMethod.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString("en-NG")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">Delete Order?</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete this offline order? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {deleting && <Loader className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Import missing icon
import { ShoppingCart, X } from "lucide-react";
