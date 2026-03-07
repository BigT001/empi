import { CreditCard, Landmark, ShieldCheck, AlertCircle } from "lucide-react";

interface OrderCardHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isApproved?: boolean;
  paymentMethod?: string;
  paymentVerified?: boolean;
  isCustomOrder?: boolean;
}

export function OrderCardHeader({
  firstName,
  lastName,
  email,
  phone,
  isApproved = false,
  paymentMethod,
  paymentVerified,
  isCustomOrder = false
}: OrderCardHeaderProps) {
  const isManual = paymentMethod === 'manual';
  const isOnline = paymentMethod === 'paystack';

  return (
    <div className={`bg-gradient-to-r ${isApproved ? 'from-emerald-700 to-green-600' : isManual ? 'from-amber-600 to-orange-600' : 'from-blue-700 to-indigo-600'} p-5 text-white flex justify-between items-start shadow-inner`}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-black text-xl tracking-tight">{firstName} {lastName}</h3>

          {/* Payment Method Badge */}
          {isManual ? (
            <span className="flex items-center gap-1.5 bg-white/20 text-[10px] px-2.5 py-1 rounded-md font-black border border-white/30 backdrop-blur-md shadow-sm">
              <Landmark className="h-3 w-3" />
              MANUAL BANK TRANSFER
            </span>
          ) : isOnline ? (
            <span className="flex items-center gap-1.5 bg-sky-400/30 text-[10px] px-2.5 py-1 rounded-md font-black border border-white/30 backdrop-blur-md shadow-sm">
              <CreditCard className="h-3 w-3" />
              ONLINE PAYMENT (PAYSTACK)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-rose-400/30 text-[10px] px-2.5 py-1 rounded-md font-black border border-white/30 backdrop-blur-md shadow-sm">
              <AlertCircle className="h-3 w-3" />
              UNKNOWN METHOD
            </span>
          )}

          {/* Custom Order Badge */}
          {isCustomOrder && (
            <span className="bg-purple-500/40 text-[9px] px-2 py-1 rounded-md font-black border border-purple-300/30 uppercase tracking-tighter">
              Custom Project
            </span>
          )}
        </div>

        <div className="space-y-0.5 opacity-90">
          <p className="text-sm font-medium truncate flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
            {email}
          </p>
          {phone && (
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
              {phone}
            </p>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0 bg-black/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm self-center">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Payment Status</p>
        <div className="flex items-center justify-end gap-2">
          {isApproved ? (
            <ShieldCheck className="h-5 w-5 text-lime-300" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${isManual ? 'bg-amber-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`}></div>
          )}
          <p className="text-lg font-black text-white uppercase italic leading-none">
            {isApproved ? 'Verified' : isManual ? (paymentVerified ? 'Recieved' : 'Pending') : 'Unpaid'}
          </p>
        </div>
      </div>
    </div>
  );
}
