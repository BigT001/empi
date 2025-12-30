'use client';

import { BuyerProfile } from '../context/BuyerContext';
import { Edit3, LogOut, Save } from 'lucide-react';

interface ProfileTabProps {
  buyer: BuyerProfile | null;
  isEditingProfile: boolean;
  setIsEditingProfile: (value: boolean) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  isSaving: boolean;
  onSave: () => void;
  onLogout: () => void;
}

export function ProfileTab({
  buyer,
  isEditingProfile,
  setIsEditingProfile,
  editFormData,
  setEditFormData,
  isSaving,
  onSave,
  onLogout,
}: ProfileTabProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* ACCOUNT OWNER CARD */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-blue-100 text-xs md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2">
              👤 Account Owner
            </p>
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2 leading-tight break-words">
              {buyer?.fullName}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm md:text-base font-semibold break-all">{buyer?.email}</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-row items-center gap-2 md:gap-3 lg:gap-4 w-full lg:w-auto lg:flex-col xl:flex-row">
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center justify-center gap-1 md:gap-2 bg-white hover:bg-slate-100 text-slate-900 px-3 md:px-5 py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl font-bold transition shadow-lg hover:shadow-xl text-xs md:text-sm lg:text-base flex-1 lg:flex-none lg:whitespace-nowrap"
              >
                <Edit3 className="h-3 md:h-4 lg:h-5 w-3 md:w-4 lg:w-5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1 md:gap-2 text-white bg-red-600 hover:bg-red-700 font-bold transition-all duration-200 px-3 md:px-5 py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-xs md:text-sm lg:text-base flex-1 lg:flex-none lg:whitespace-nowrap"
            >
              <LogOut className="h-3 md:h-4 lg:h-5 w-3 md:w-4 lg:w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTACT INFORMATION CARD */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border-2 border-lime-100 bg-gradient-to-br from-white to-lime-50/20 p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent mb-6">
          Contact Information
        </h3>

        {isEditingProfile ? (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={editFormData.postalCode}
                  onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold transition disabled:opacity-50 text-sm md:text-base"
              >
                <Save className="h-4 md:h-5 w-4 md:w-5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex items-center justify-center gap-2 flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold transition text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-indigo-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
              <p className="text-xs md:text-sm font-bold text-indigo-700 uppercase mb-2 md:mb-3 tracking-wider">
                📞 Phone
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 break-all line-clamp-2">
                {buyer?.phone || '—'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-violet-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
              <p className="text-xs md:text-sm font-bold text-violet-700 uppercase mb-2 md:mb-3 tracking-wider">
                ✉️ Email
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 break-all line-clamp-2">{buyer?.email}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-emerald-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105 sm:col-span-2 lg:col-span-2">
              <p className="text-xs md:text-sm font-bold text-emerald-700 uppercase mb-2 md:mb-3 tracking-wider">
                📍 Address
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-2">{buyer?.address || '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-amber-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
              <p className="text-xs md:text-sm font-bold text-amber-700 uppercase mb-2 md:mb-3 tracking-wider">
                🏙️ City
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.city || '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-rose-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
              <p className="text-xs md:text-sm font-bold text-rose-700 uppercase mb-2 md:mb-3 tracking-wider">
                🗺️ State
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.state || '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-sky-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
              <p className="text-xs md:text-sm font-bold text-sky-700 uppercase mb-2 md:mb-3 tracking-wider">
                📮 Postal
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.postalCode || '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
