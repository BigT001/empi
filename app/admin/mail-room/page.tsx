'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/app/context/AdminContext';
import {
  Mail,
  Inbox,
  Plus,
  Trash2,
  Shield,
  Settings,
  Check,
  User,
  Search,
  RefreshCw,
  AlertCircle,
  Send,
  PlusCircle,
  Tag,
  Clock,
  CheckCircle,
  HelpCircle,
  Users,
  X,
  Lock
} from 'lucide-react';
import Link from 'next/link';

interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: string;
}

interface EmailService {
  _id: string;
  email: string;
  name: string;
  provider: 'simulated' | 'imap_smtp';
  settings?: any;
  allowedRoles: string[];
  allowedAdmins: string[];
  isActive: boolean;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  assignedTo: AdminUser | null;
  lastMessageAt: string;
  tags: string[];
  createdAt: string;
}

interface Message {
  _id: string;
  ticketId: string;
  direction: 'inbound' | 'outbound';
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  content: string;
  createdAt: string;
}

export default function MailRoomPage() {
  const { admin: currentAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'inbox' | 'connections' | 'permissions'>('inbox');
  
  // Data lists
  const [services, setServices] = useState<EmailService[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, { total: number; open: number; pending: number }>>({});
  
  // Selection / Filter states
  const [selectedFolder, setSelectedFolder] = useState<string>('all'); // 'all' or service email
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [replyContent, setReplyContent] = useState('');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    content: '',
    department: '',
  });
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    email: '',
    provider: 'simulated' as 'simulated' | 'imap_smtp',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    username: '',
    password: '',
  });

  const [editingPermissionsService, setEditingPermissionsService] = useState<EmailService | null>(null);
  const [allowedRolesTemp, setAllowedRolesTemp] = useState<string[]>([]);
  const [allowedAdminsTemp, setAllowedAdminsTemp] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of active conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Initial data loading
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch tickets when filters or folder changes
  useEffect(() => {
    fetchTickets();
  }, [selectedFolder, searchQuery, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch services first
      const res = await fetch('/api/admin/mail-room/services');
      if (!res.ok) throw new Error('Failed to fetch mail services');
      const data = await res.json();
      
      setServices(data.services || []);
      setAdmins(data.admins || []);
      
      await fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      let url = `/api/admin/mail-room/tickets?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`;
      if (selectedFolder !== 'all') {
        url += `&department=${encodeURIComponent(selectedFolder)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      
      setTickets(data.tickets || []);
      setDepartmentCounts(data.departmentCounts || {});
    } catch (err: any) {
      console.error(err);
    }
  };

  // Clear all demo data
  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to delete all tickets and messages? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/mail-room/tickets', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear data');
      
      setSuccess('All tickets and messages have been deleted.');
      setSelectedTicket(null);
      setMessages([]);
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  // Compose new email
  const handleComposeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.recipientEmail || !composeForm.subject || !composeForm.content) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/mail-room/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send email');
      }

      setSuccess('Email sent successfully!');
      setComposeForm({
        recipientEmail: '',
        recipientName: '',
        subject: '',
        content: '',
        department: '',
      });
      setShowComposeModal(false);
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // Select a conversation and fetch details
  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket);
      setTicketDetailLoading(true);
      setMessages([]);
      
      const res = await fetch(`/api/admin/mail-room/tickets/${ticket._id}`);
      if (!res.ok) throw new Error('Failed to load ticket details');
      const data = await res.json();
      
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation details');
    } finally {
      setTicketDetailLoading(false);
    }
  };

  // Reply to ticket
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    try {
      setReplyLoading(true);
      const res = await fetch(`/api/admin/mail-room/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });

      if (!res.ok) throw new Error('Failed to send reply');
      const newMsg = await res.json();
      
      setMessages((prev) => [...prev, newMsg]);
      setReplyContent('');
      
      // Update ticket locally
      if (selectedTicket.status === 'open') {
        const updated = { ...selectedTicket, status: 'pending' as const };
        setSelectedTicket(updated);
        setTickets(tickets.map(t => t._id === selectedTicket._id ? updated : t));
      }
      
      fetchTickets(); // Refresh lists
    } catch (err: any) {
      setError(err.message || 'Error replying to ticket');
    } finally {
      setReplyLoading(false);
    }
  };

  // Update ticket attributes (status, priority, assignment)
  const handleUpdateTicketAttribute = async (updates: { status?: string; priority?: string; assignedTo?: string | null }) => {
    if (!selectedTicket) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/mail-room/tickets/${selectedTicket._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update ticket details');
      const updatedTicket = await res.json();
      
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t._id === selectedTicket._id ? updatedTicket : t));
      fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Add new service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        name: newServiceForm.name,
        email: newServiceForm.email,
        provider: newServiceForm.provider,
        settings: newServiceForm.provider === 'imap_smtp' ? {
          imapHost: newServiceForm.imapHost,
          imapPort: Number(newServiceForm.imapPort),
          imapSecure: newServiceForm.imapSecure,
          smtpHost: newServiceForm.smtpHost,
          smtpPort: Number(newServiceForm.smtpPort),
          smtpSecure: newServiceForm.smtpSecure,
          username: newServiceForm.username,
          password: newServiceForm.password,
        } : null
      };

      const res = await fetch('/api/admin/mail-room/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register service');
      }

      setShowAddServiceModal(false);
      setNewServiceForm({
        name: '',
        email: '',
        provider: 'simulated',
        imapHost: '',
        imapPort: 993,
        imapSecure: true,
        smtpHost: '',
        smtpPort: 465,
        smtpSecure: true,
        username: '',
        password: '',
      });

      setSuccess('Email service added successfully! Demo tickets generated.');
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email connection? This will delete all tickets and messages associated with it.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/mail-room/services?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      
      setSuccess('Email service deleted successfully.');
      if (selectedTicket && services.find(s => s._id === id)?.email === selectedTicket.department) {
        setSelectedTicket(null);
      }
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete service');
      setLoading(false);
    }
  };

  // Set up service permissions editor
  const handleEditPermissionsClick = (service: EmailService) => {
    setEditingPermissionsService(service);
    setAllowedRolesTemp(service.allowedRoles || []);
    setAllowedAdminsTemp(service.allowedAdmins || []);
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsService) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/mail-room/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPermissionsService._id,
          allowedRoles: allowedRolesTemp,
          allowedAdmins: allowedAdminsTemp,
        }),
      });

      if (!res.ok) throw new Error('Failed to save permissions');
      
      setSuccess('Permissions updated successfully!');
      setEditingPermissionsService(null);
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
      setLoading(false);
    }
  };

  const handleToggleRolePermission = (role: string) => {
    if (allowedRolesTemp.includes(role)) {
      setAllowedRolesTemp(allowedRolesTemp.filter(r => r !== role));
    } else {
      setAllowedRolesTemp([...allowedRolesTemp, role]);
    }
  };

  const handleToggleAdminPermission = (adminId: string) => {
    if (allowedAdminsTemp.includes(adminId)) {
      setAllowedAdminsTemp(allowedAdminsTemp.filter(id => id !== adminId));
    } else {
      setAllowedAdminsTemp([...allowedAdminsTemp, adminId]);
    }
  };

  // Helper: get open count badge for a mailbox email
  const getOpenCount = (email: string) => {
    return departmentCounts[email]?.open || 0;
  };

  // Helper: get total count badge for a mailbox email
  const getTotalCount = (email: string) => {
    return departmentCounts[email]?.total || 0;
  };

  // Cumulative open count for 'All'
  const getAllOpenCount = () => {
    return Object.values(departmentCounts).reduce((sum, item) => sum + item.open, 0);
  };

  const isSuperOrAdmin = currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin';

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* Minimal Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-lime-600" />
          <h1 className="text-lg font-bold text-gray-900">Mail Room</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Compose Button */}
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
          >
            <Plus className="h-4 w-4" />
            Compose
          </button>

          {/* Tabs */}
          <div className="bg-gray-100 p-0.5 rounded-lg flex gap-0.5 border border-gray-200">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'inbox'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'connections'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connections
            </button>
            {isSuperOrAdmin && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'permissions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Permissions
              </button>
            )}
          </div>

          <button
            onClick={fetchInitialData}
            title="Refresh"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages / Banner Alerts - Compact */}
      {error && (
        <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 shadow-sm text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3 shadow-sm text-sm">
          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-700 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden">
        
        {/* INBOX TAB */}
        {activeTab === 'inbox' && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
            
            {/* 1. Folders Pane (Departments) */}
            <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col min-h-0 overflow-hidden shrink-0">
              <div className="p-4 flex flex-col gap-2 min-h-0 overflow-hidden flex-1">
                <span className="text-xs font-bold text-gray-400 uppercase px-3 tracking-wider">Mailboxes</span>
              
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    selectedFolder === 'all'
                      ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-md shadow-lime-100'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="h-4 w-4" />
                    <span>All Messages</span>
                  </div>
                  {getAllOpenCount() > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedFolder === 'all' ? 'bg-white text-lime-700' : 'bg-red-500 text-white'}`}>
                      {getAllOpenCount()}
                    </span>
                  )}
                </button>

                <hr className="my-2 border-gray-200" />

                {/* Scrollable services list */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="space-y-2 px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-xs text-gray-500 px-3 py-4 text-center">
                      No email accounts registered. Add connection in Settings.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {services.map((service) => {
                        const open = getOpenCount(service.email);
                        const isSelected = selectedFolder === service.email;
                        return (
                          <button
                            key={service._id}
                            onClick={() => setSelectedFolder(service.email)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                              isSelected
                                ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-md shadow-lime-100'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{service.name}</span>
                            </div>
                            {open > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${isSelected ? 'bg-white text-lime-700' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                {open}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Clear all data button if there are tickets */}
              {!loading && tickets.length > 0 && (
                <div className="p-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={handleClearAllData}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs py-1.5 px-3 rounded-lg font-bold transition border border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 inline mr-1.5" />
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* 2. Tickets List Pane */}
            <div className="w-full md:w-80 border-r border-gray-200 flex flex-col min-h-0 overflow-hidden shrink-0">
              {/* Search header - Minimal */}
              <div className="p-3 bg-white border-b border-gray-200 flex flex-col gap-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-lime-500 transition"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tickets list */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-4 space-y-2 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))
                ) : tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No messages here</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing filters or search query.</p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const isSelected = selectedTicket?._id === ticket._id;
                    
                    // Status badge colors
                    const statusColors: Record<string, string> = {
                      open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      pending: 'bg-amber-50 text-amber-800 border-amber-200',
                      resolved: 'bg-blue-50 text-blue-800 border-blue-200',
                      closed: 'bg-gray-100 text-gray-800 border-gray-200',
                    };

                    // Priority dot colors
                    const priorityDots: Record<string, string> = {
                      low: 'bg-gray-400',
                      medium: 'bg-blue-500',
                      high: 'bg-amber-500',
                      urgent: 'bg-red-500 animate-pulse',
                    };

                    // Get initial from customer name
                    const initial = ticket.customerName ? ticket.customerName.charAt(0).toUpperCase() : '?';

                    return (
                      <div
                        key={ticket._id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition border-l-4 ${
                          isSelected
                            ? 'bg-lime-50/40 border-lime-500 shadow-sm'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(ticket.lastMessageAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 truncate mb-1">
                          {ticket.subject}
                        </h3>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate max-w-[60%]">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                              {initial}
                            </span>
                            <span className="truncate">{ticket.customerName || 'Anonymous'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Priority Indicator */}
                            <span
                              title={`Priority: ${ticket.priority}`}
                              className={`w-2 h-2 rounded-full ${priorityDots[ticket.priority]}`}
                            />
                            {/* Status badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${statusColors[ticket.status]}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        {ticket.assignedTo && (
                          <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Assigned to: <span className="font-semibold text-gray-700">{ticket.assignedTo.fullName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Conversation Thread Pane */}
            <div className="flex-1 flex flex-col bg-gray-50/30 min-h-0 overflow-hidden">
              {!selectedTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20">
                  <div className="w-16 h-16 rounded-3xl bg-lime-50 text-lime-600 flex items-center justify-center shadow-inner mb-4">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No Conversation Selected</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    Select a support ticket from the list to view the message history, update status, assign agents, and send replies.
                  </p>
                </div>
              ) : (
                <>
                  {/* Thread Header - Minimal & Clean */}
                  <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between gap-4 shadow-sm z-10 flex-shrink-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-lime-600 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                          {selectedTicket.ticketNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedTicket.customerName} • {selectedTicket.customerEmail}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-gray-900 truncate">{selectedTicket.subject}</h2>
                    </div>

                    {/* Quick Actions - Right side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <select
                        disabled={actionLoading}
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketAttribute({ status: e.target.value })}
                        className="px-2.5 py-1.5 border border-gray-200 bg-white rounded text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-lime-500"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>

                      <select
                        disabled={actionLoading}
                        value={selectedTicket.assignedTo?._id || ''}
                        onChange={(e) => handleUpdateTicketAttribute({ assignedTo: e.target.value || null })}
                        className="px-2.5 py-1.5 border border-gray-200 bg-white rounded text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-lime-500"
                      >
                        <option value="">Assign</option>
                        {admins.map(adm => (
                          <option key={adm._id} value={adm._id}>{adm.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                    {ticketDetailLoading ? (
                      <div className="space-y-4">
                        <div className="flex gap-2 max-w-[70%] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                          <div className="w-full space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="flex gap-2 max-w-[70%] bg-lime-50/50 p-3 rounded-2xl border border-lime-100 shadow-sm animate-pulse">
                            <div className="w-64 space-y-2">
                              <div className="h-4 bg-lime-100/50 rounded w-1/4"></div>
                              <div className="h-3 bg-lime-100/50 rounded w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isInbound = msg.direction === 'inbound';
                        return (
                          <div key={msg._id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                            <div
                              className={`max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                                isInbound
                                  ? 'bg-white text-gray-800 border-gray-200/80 rounded-tl-none'
                                  : 'bg-lime-50 border-lime-200/80 text-gray-900 rounded-tr-none'
                              }`}
                            >
                              {/* Metadata */}
                              <div className="flex items-center justify-between gap-8 mb-2 border-b border-gray-200/50 pb-1 text-[10px] text-gray-400 font-bold uppercase">
                                <span className={isInbound ? 'text-blue-600' : 'text-lime-700'}>
                                  {msg.senderName} ({msg.senderEmail})
                                </span>
                                <span>
                                  {new Date(msg.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              
                              {/* Content */}
                              <div className="text-sm whitespace-pre-line leading-relaxed">
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Composer - Minimal */}
                  <div className="p-4 bg-white border-t border-gray-200 z-10 flex-shrink-0">
                    <form onSubmit={handleSendReply} className="flex flex-col gap-3">
                      <textarea
                        rows={3}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-lime-500 transition resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replyLoading || !replyContent.trim()}
                          className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white font-semibold py-2 px-5 rounded-lg transition cursor-pointer text-sm"
                        >
                          <Send className="h-4 w-4" />
                          {replyLoading ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CONNECTIONS TAB */}
        {activeTab === 'connections' && (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Email Services List</h2>
              
              {isSuperOrAdmin && (
                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-lime-100"
                >
                  <Plus className="h-4 w-4" />
                  Connect Email Address
                </button>
              )}
            </div>

            {/* Grid display */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl h-40"></div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
                <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Connections Registered</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Add your email connection details to pull messages into the inbox folders and send responses.
                </p>
                {isSuperOrAdmin && (
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-6 rounded-xl transition shadow"
                  >
                    Connect Your First Email
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service._id} className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="bg-lime-50 text-lime-600 p-2.5 rounded-xl border border-lime-100">
                          <Mail className="h-5 w-5" />
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                          service.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {service.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-extrabold text-gray-900 mb-0.5">{service.name}</h3>
                      <p className="text-sm font-semibold text-gray-500 mb-3">{service.email}</p>
                      
                      <div className="space-y-1 bg-gray-50 p-3 rounded-xl text-xs text-gray-600 mb-4 border border-gray-100">
                        <div className="flex justify-between">
                          <span>Connection:</span>
                          <span className="font-bold text-gray-800 capitalize">{service.provider.replace('_', '/')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Threads:</span>
                          <span className="font-bold text-gray-800">{getTotalCount(service.email)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Open Issues:</span>
                          <span className="font-bold text-red-600">{getOpenCount(service.email)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          {service.allowedRoles.length > 0 || service.allowedAdmins.length > 0
                            ? 'Restricted Access'
                            : 'Public to Admins'}
                        </span>
                      </div>

                      {isSuperOrAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                            title="Delete mailbox"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INBOX PERMISSIONS TAB */}
        {activeTab === 'permissions' && isSuperOrAdmin && (
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Inbox Permissions Settings</h2>
              <p className="text-sm text-gray-600">Restrict which admin roles or specific user accounts can view and manage support inboxes.</p>
            </div>

            {editingPermissionsService ? (
              /* Permissions Editor View */
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-2xl">
                <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Configure Permissions: {editingPermissionsService.name}
                    </h3>
                    <p className="text-xs text-gray-500">{editingPermissionsService.email}</p>
                  </div>
                  <button
                    onClick={() => setEditingPermissionsService(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Role configuration */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Shield className="h-4 w-4 text-lime-600" />
                      Restrict by Admin Role
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Select which user roles can access this mailbox. Leave empty to allow access for all roles.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['super_admin', 'admin', 'finance_admin', 'logistics_admin'].map((role) => {
                        const isChecked = allowedRolesTemp.includes(role);
                        const displayNames: Record<string, string> = {
                          super_admin: 'Super Admin',
                          admin: 'General Admin',
                          finance_admin: 'Finance Team Admin',
                          logistics_admin: 'Logistics Team Admin',
                        };
                        return (
                          <label
                            key={role}
                            className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl cursor-pointer text-xs font-semibold select-none transition ${
                              isChecked
                                ? 'bg-lime-50/50 border-lime-500 text-lime-800'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRolePermission(role)}
                              className="accent-lime-600 h-4 w-4"
                            />
                            <span>{displayNames[role] || role}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual Admin configuration */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <User className="h-4 w-4 text-lime-600" />
                      Restrict to Specific Users
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Explicitly grant mailbox access to specific administrators.
                    </p>
                    {admins.length === 0 ? (
                      <p className="text-xs text-gray-400">No other admin accounts found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {admins.map((adm) => {
                          const isChecked = allowedAdminsTemp.includes(adm._id);
                          return (
                            <label
                              key={adm._id}
                              className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl cursor-pointer text-xs font-semibold select-none transition ${
                                isChecked
                                  ? 'bg-lime-50/50 border-lime-500 text-lime-800'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleAdminPermission(adm._id)}
                                className="accent-lime-600 h-4 w-4"
                              />
                              <div className="truncate">
                                <p className="truncate text-gray-800 font-bold">{adm.fullName}</p>
                                <p className="truncate text-[10px] text-gray-400 font-medium">{adm.email}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Save buttons */}
                  <div className="flex gap-3 border-t border-gray-100 pt-4">
                    <button
                      onClick={handleSavePermissions}
                      disabled={loading}
                      className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-md shadow-lime-100 cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingPermissionsService(null)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid list of inbox access configs */
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Department / Inbox</th>
                        <th className="px-6 py-4">Role Restrictions</th>
                        <th className="px-6 py-4">Explicit Admins</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {services.map((service) => (
                        <tr key={service._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            {service.allowedRoles.length === 0 ? (
                              <span className="text-xs text-gray-500 font-semibold italic">No role restrictions (Public to all roles)</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {service.allowedRoles.map((role) => (
                                  <span key={role} className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full uppercase">
                                    {role.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {service.allowedAdmins.length === 0 ? (
                              <span className="text-gray-400 italic">No specific admin overrides</span>
                            ) : (
                              <span className="font-bold text-gray-700">
                                {service.allowedAdmins.length} assigned user(s)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleEditPermissionsClick(service)}
                              className="text-xs bg-lime-50 text-lime-700 hover:bg-lime-100 border border-lime-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                            >
                              Edit Rules
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONNECT NEW SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Connect Email Address</h3>
                <p className="text-xs text-gray-500">Configure a new incoming/outgoing support mailbox</p>
              </div>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Display Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sales Team, Costume Inquiries"
                    value={newServiceForm.name}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-lime-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. sales@empicostumes.com"
                    value={newServiceForm.email}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-lime-500 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Email Service Provider</label>
                <select
                  value={newServiceForm.provider}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, provider: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-lime-500 text-gray-800"
                >
                  <option value="simulated">Simulated Mock Service (Instant Demo Mode)</option>
                  <option value="imap_smtp">SMTP / IMAP Secure Mail Server</option>
                </select>
              </div>

              {newServiceForm.provider === 'imap_smtp' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mail Server Credentials</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">IMAP Host</label>
                      <input
                        type="text"
                        placeholder="imap.mailserver.com"
                        value={newServiceForm.imapHost}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, imapHost: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">IMAP Port</label>
                      <input
                        type="number"
                        value={newServiceForm.imapPort}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, imapPort: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        placeholder="smtp.mailserver.com"
                        value={newServiceForm.smtpHost}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, smtpHost: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={newServiceForm.smtpPort}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, smtpPort: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">Username</label>
                      <input
                        type="text"
                        value={newServiceForm.username}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, username: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">Password</label>
                      <input
                        type="password"
                        value={newServiceForm.password}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, password: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-xl transition shadow cursor-pointer"
                >
                  {loading ? 'Registering...' : 'Register Connection'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPOSE MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-lime-100 p-2.5 rounded-lg">
                  <Mail className="h-5 w-5 text-lime-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Compose Email</h2>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleComposeEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={composeForm.recipientEmail}
                  onChange={(e) => setComposeForm({ ...composeForm, recipientEmail: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recipient Name</label>
                <input
                  type="text"
                  value={composeForm.recipientName}
                  onChange={(e) => setComposeForm({ ...composeForm, recipientName: e.target.value })}
                  placeholder="Customer name"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                <select
                  value={composeForm.department}
                  onChange={(e) => setComposeForm({ ...composeForm, department: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-lime-500"
                >
                  <option value="">Select a department</option>
                  {services.map((service) => (
                    <option key={service._id} value={service.email}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Email subject"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                <textarea
                  required
                  rows={6}
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-lime-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
