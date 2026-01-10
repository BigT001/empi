interface OrderCardHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isApproved?: boolean;
}

export function OrderCardHeader({ firstName, lastName, email, phone, isApproved = false }: OrderCardHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${isApproved ? 'from-lime-600 to-green-600' : 'from-red-600 to-rose-600'} p-5 text-white flex justify-between items-start`}>
      <div>
        <h3 className="font-bold text-lg">{firstName} {lastName}</h3>
        <p className={`text-sm ${isApproved ? 'text-lime-100' : 'text-red-100'} truncate`}>{email}</p>
        {phone && <p className={`text-sm ${isApproved ? 'text-lime-100' : 'text-red-100'}`}>{phone}</p>}
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${isApproved ? 'text-lime-100' : 'text-red-100'}`}>Today</p>
        <p className="text-sm font-bold text-white">Jan 8, 2026</p>
      </div>
    </div>
  );
}
