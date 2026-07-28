"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote, Building2, CheckCircle2, ChevronDown, Clock3, CreditCard,
  Plus, Search, ShieldCheck, Sparkles, Trash2, UserPlus, Users, X,
} from "lucide-react";
import { PermissionGuard } from "@/app/components/PermissionGuard";

type Staff = {
  _id: string; employeeId: string; fullName: string; jobTitle: string; department: string;
  baseSalary: number; nextPayDate: string; payFrequency: string; status: "active" | "inactive";
  bankName?: string; accountName?: string; accountNumber?: string; email?: string; phone?: string;
  defaultOvertime?: number; defaultAirtime?: number; defaultBonus?: number;
  defaultIncrease?: number; defaultTax?: number; defaultOwings?: number;
  defaultDismissalPayout?: number;
};

type Run = {
  _id: string; staff: string; employeeId: string; staffName: string; jobTitle: string;
  periodLabel: string; scheduledDate: string; baseSalary: number; overtime: number;
  airtime: number; bonus: number; increase: number; tax: number; owings: number;
  dismissalPayout: number; netPay: number; status: "pending" | "paid" | "cancelled";
  paymentMethod?: string; paymentReference?: string;
};

type RowValues = Record<string, {
  overtime: number; airtime: number; bonus: number; increase: number;
  tax: number; owings: number; dismissalPayout: number;
}>;
type AdjustmentKey = keyof RowValues[string];

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);
const today = new Date().toISOString().slice(0, 10);
const currentPeriod = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(new Date());

export default function PayrollPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [rows, setRows] = useState<RowValues>({});
  const [period, setPeriod] = useState(currentPeriod);
  const [payDate, setPayDate] = useState(today);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"payroll" | "staff" | "history">("payroll");
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [paying, setPaying] = useState<Run | null>(null);
  const [deletingRun, setDeletingRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const [staffRes, runsRes] = await Promise.all([
        fetch("/api/admin/payroll/staff", { cache: "no-store" }),
        fetch("/api/admin/payroll/runs", { cache: "no-store" }),
      ]);
      if (!staffRes.ok || !runsRes.ok) throw new Error("Could not load payroll");
      const [staffData, runsData] = await Promise.all([staffRes.json(), runsRes.json()]);
      setStaff(staffData.staff || []);
      setRuns(runsData.runs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payroll");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeStaff = useMemo(() => staff.filter((person) =>
    person.status === "active" &&
    `${person.fullName} ${person.employeeId} ${person.department}`.toLowerCase().includes(query.toLowerCase())
  ), [staff, query]);
  const pending = runs.filter((run) => run.status === "pending");
  const paid = runs.filter((run) => run.status === "paid");
  const paidTotal = paid.reduce((sum, run) => sum + run.netPay, 0);
  const pendingTotal = pending.reduce((sum, run) => sum + run.netPay, 0);

  const runFor = (id: string) => runs.find((run) =>
    String(run.staff) === id && run.periodLabel.trim().toLowerCase() === period.trim().toLowerCase()
  );
  const rowKey = (id: string) => `${period.trim().toLowerCase()}::${id}`;
  const valueFor = (id: string) => {
    const key = rowKey(id);
    if (rows[key]) return rows[key];
    const savedRun = runFor(id);
    if (savedRun) {
      return {
        overtime: savedRun.overtime || 0,
        airtime: savedRun.airtime || 0,
        bonus: savedRun.bonus || 0,
        increase: savedRun.increase || 0,
        tax: savedRun.tax || 0,
        owings: savedRun.owings || 0,
        dismissalPayout: savedRun.dismissalPayout || 0,
      };
    }
    const person = staff.find((item) => item._id === id);
    return {
      overtime: person?.defaultOvertime || 0,
      airtime: person?.defaultAirtime || 0,
      bonus: person?.defaultBonus || 0,
      increase: person?.defaultIncrease || 0,
      tax: person?.defaultTax || 0,
      owings: person?.defaultOwings || 0,
      dismissalPayout: person?.defaultDismissalPayout || 0,
    };
  };
  const takeHome = (person: Staff) => {
    const row = valueFor(person._id);
    return person.baseSalary + row.overtime + row.airtime + row.bonus + row.increase +
      row.dismissalPayout - row.tax - row.owings;
  };
  const updateRow = (id: string, key: AdjustmentKey, value: string) =>
    setRows((old) => {
      const periodKey = rowKey(id);
      return { ...old, [periodKey]: { ...valueFor(id), ...old[periodKey], [key]: Math.max(0, Number(value) || 0) } };
    });

  async function schedule(person: Staff) {
    setBusy(person._id); setError(""); setNotice("");
    const extras = valueFor(person._id);
    try {
      const response = await fetch("/api/admin/payroll/runs", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: person._id, periodLabel: period, scheduledDate: payDate, ...extras }),
      });
      const data = await response.json().catch(() => ({ error: "The server returned an invalid response" }));
      if (!response.ok) throw new Error(data.error || "Could not schedule payroll");
      if (!data.run?._id) throw new Error("The database did not confirm the payroll save");
      setNotice(data.created
        ? `${person.fullName}'s ${period} payroll was prepared and saved.`
        : `${person.fullName}'s ${period} earnings and adjustments were updated.`);
      setRows((current) => {
        const next = { ...current };
        delete next[rowKey(person._id)];
        return next;
      });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not schedule payroll"); }
    finally { setBusy(null); }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paying) return;
    const form = new FormData(event.currentTarget);
    setBusy(paying._id); setError("");
    const response = await fetch(`/api/admin/payroll/runs/${paying._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "paid", paymentMethod: form.get("paymentMethod"),
        paymentReference: form.get("paymentReference"),
      }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Could not record payment");
    else { setNotice("Payment recorded successfully."); setPaying(null); await load(); }
    setBusy(null);
  }

  async function deletePayroll() {
    if (!deletingRun) return;
    setBusy(deletingRun._id);
    setError("");
    try {
      const response = await fetch(`/api/admin/payroll/runs/${deletingRun._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({ error: "The server returned an invalid response" }));
      if (!response.ok) throw new Error(data.error || "Could not delete payroll");
      setRuns((current) => current.filter((run) => run._id !== deletingRun._id));
      setNotice(data.message || "Payroll deleted successfully.");
      setDeletingRun(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete payroll");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PermissionGuard requiredPermission="view_finance">
      <main className="min-h-full bg-[#f4f6f0]">
        <section className="relative overflow-hidden bg-[#142319] px-4 pb-16 pt-6 text-white sm:px-8 lg:px-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-lime-300/20 bg-lime-400/10 blur-2xl" />
          <div className="relative mx-auto max-w-[1600px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-lime-300">
                  <ShieldCheck className="h-4 w-4" /> Admin only · Payroll control
              </div>
              <button onClick={() => setShowStaffForm(true)} className="flex items-center gap-2 rounded-full bg-lime-400 px-5 py-3 text-sm font-black text-[#142319] shadow-lg shadow-lime-950/30 hover:bg-lime-300">
                <UserPlus className="h-4 w-4" /> Add staff
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric icon={<Users />} label="Active staff" value={String(staff.filter(s => s.status === "active").length)} />
              <Metric icon={<Clock3 />} label="Awaiting payment" value={money(pendingTotal)} />
              <Metric icon={<CheckCircle2 />} label="Total paid" value={money(paidTotal)} />
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-10 max-w-[1600px] px-4 pb-14 sm:px-8 lg:px-10">
          <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(20,35,25,.10)]">
            <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
              <div className="grid grid-cols-3 rounded-full bg-gray-100 p-1">
                {(["payroll", "staff", "history"] as const).map((item) => (
                  <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === item ? "bg-[#142319] text-white shadow" : "text-gray-500"}`}>{item}</button>
                ))}
              </div>
              {tab === "payroll" && (
                <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
                  <input value={period} onChange={e => setPeriod(e.target.value)} className="h-11 w-full !rounded-xl !border !border-gray-300 !bg-white px-3 text-sm font-semibold" aria-label="Pay period" />
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="h-11 w-full !rounded-xl !border !border-gray-300 !bg-white px-3 text-sm" aria-label="Pay date" />
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-500"><Search className="h-4 w-4 shrink-0" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff" className="min-w-0 flex-1 outline-none" /></label>
                </div>
              )}
            </div>

            {(notice || error) && <div className={`mx-5 mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-lime-50 text-lime-800"}`}>{error || notice}</div>}
            {loading ? <div className="p-16 text-center text-gray-400">Loading payroll…</div> :
              tab === "payroll" ? (
                <div className="space-y-3 p-3 sm:p-5">
                  {activeStaff.map(person => {
                    const isExpanded = Boolean(expandedStaff[person._id]);
                    return <article key={person._id} className={`overflow-hidden rounded-2xl border transition ${isExpanded ? "border-lime-300 bg-white shadow-lg shadow-lime-950/5" : "border-gray-200 bg-[#f8faf6]"}`}>
                      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(120px,.7fr)_minmax(140px,.8fr)_auto] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-100 font-black text-lime-800">{person.fullName.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>
                          <div className="min-w-0"><h3 className="truncate font-black text-gray-900">{person.fullName}</h3><p className="truncate text-xs text-gray-500">{person.employeeId} · {person.jobTitle} · {person.department}</p></div>
                        </div>
                        <SummaryValue label="Basic" value={money(person.baseSalary)} />
                        <SummaryValue label="PIAT / Take Home" value={money(takeHome(person))} accent />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setExpandedStaff(current => ({ ...current, [person._id]: !isExpanded }))} aria-expanded={isExpanded} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-xs font-black text-gray-700 hover:border-lime-400">
                            {isExpanded ? "Hide details" : "View details"}<ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {runFor(person._id) && runFor(person._id)?.status !== "paid" && <button onClick={() => setDeletingRun(runFor(person._id) || null)} aria-label={`Delete ${person.fullName}'s ${period} payroll`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /><span className="sm:hidden xl:inline">Delete</span></button>}
                          <button disabled={busy === person._id || runFor(person._id)?.status === "paid"} onClick={() => schedule(person)} className="h-11 rounded-xl bg-lime-500 px-4 text-xs font-black text-[#142319] hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50">{busy === person._id ? "Saving…" : runFor(person._id)?.status === "pending" ? "Save changes" : runFor(person._id)?.status === "paid" ? "Paid & locked" : "Prepare"}</button>
                        </div>
                      </div>
                      {isExpanded && <div className="border-t border-gray-200 bg-white p-4 sm:p-5">
                        <div className="mb-5 grid gap-3 sm:grid-cols-3">
                          <Detail icon={<CreditCard />} label="Account Number" value={person.accountNumber} />
                          <Detail icon={<Building2 />} label="Bank" value={person.bankName} />
                          <Detail icon={<Users />} label="Account Name" value={person.accountName} />
                        </div>
                        <div className="mb-3"><h4 className="text-sm font-black text-[#142319]">Earnings and adjustments</h4><p className="text-xs text-gray-500">Update this pay period only. Take Home recalculates immediately.</p></div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {([
                            ["overtime", "Overtime"], ["airtime", "Airtime"], ["bonus", "Bonus"],
                            ["increase", "Increase"], ["tax", "Tax"], ["owings", "Owings / Loans / IOU"],
                            ["dismissalPayout", "Dismissal / Payout"],
                          ] as const).map(([key, label]) => <PayrollInput key={key} label={label} value={valueFor(person._id)[key]} onChange={(value) => updateRow(person._id, key, value)} />)}
                        </div>
                        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#142319] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                          <div><p className="text-[10px] font-bold uppercase tracking-widest text-lime-300">Final PIAT / Take Home</p><p className="mt-1 text-2xl font-black">{money(takeHome(person))}</p></div>
                          <button disabled={busy === person._id || runFor(person._id)?.status === "paid"} onClick={() => schedule(person)} className="h-11 rounded-xl bg-lime-400 px-6 text-sm font-black text-[#142319] disabled:cursor-not-allowed disabled:opacity-50">{busy === person._id ? "Saving payroll…" : runFor(person._id)?.status === "pending" ? `Save ${period} changes` : runFor(person._id)?.status === "paid" ? `${period} paid & locked` : `Prepare ${period}`}</button>
                        </div>
                      </div>}
                    </article>;
                  })}
                  {!activeStaff.length && <Empty text="Add an active staff member to begin payroll." />}
                </div>
              ) : tab === "staff" ? (
                <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{staff.map(person => (
                  <article key={person._id} className="rounded-2xl border bg-[#fbfcfa] p-5">
                    <div className="flex justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 font-black text-lime-800">{person.fullName.split(" ").map(n => n[0]).slice(0,2).join("")}</div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold uppercase ${person.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{person.status}</span></div>
                    <h3 className="mt-4 font-black">{person.fullName}</h3><p className="text-sm text-gray-500">{person.jobTitle} · {person.department}</p>
                    <div className="mt-4 border-t pt-3 text-sm"><b>{money(person.baseSalary)}</b> / {person.payFrequency.replace("_", " ")}</div>
                    <p className="mt-2 text-xs text-gray-400">{person.bankName || "No bank added"} · {person.accountNumber || "No account number"}</p>
                    <button onClick={() => setEditingStaff(person)} className="mt-4 w-full rounded-xl border border-gray-300 bg-white py-2 text-xs font-black text-gray-700 hover:border-lime-500">Edit payroll details</button>
                  </article>
                ))}</div>
              ) : (
                <div className="space-y-3 p-4 sm:p-5">{runs.map(run => <article key={run._id} className="grid gap-4 rounded-2xl border bg-[#fbfcfa] p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-center">
                  <div><p className="font-black">{run.staffName}</p><p className="text-xs text-gray-400">{run.employeeId} · {run.jobTitle}</p></div>
                  <SummaryValue label="Period" value={run.periodLabel} />
                  <SummaryValue label="Pay date" value={new Date(run.scheduledDate).toLocaleDateString("en-NG")} />
                  <SummaryValue label="Take home" value={money(run.netPay)} />
                  <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end"><span className={`rounded-full px-2 py-1 text-xs font-bold ${run.status === "paid" ? "bg-green-100 text-green-700" : run.status === "cancelled" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>{run.status}</span>{run.status === "pending" ? <button onClick={() => setPaying(run)} className="rounded-lg bg-[#142319] px-3 py-2 text-xs font-bold text-white">Mark paid</button> : <span className="text-right text-xs text-gray-500">{run.paymentMethod || "—"}<br />{run.paymentReference}</span>}{run.status !== "paid" && <button onClick={() => setDeletingRun(run)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-bold text-red-700"><Trash2 className="h-3.5 w-3.5" />Delete</button>}</div>
                </article>)}{!runs.length && <Empty text="Prepared payroll records will appear here." />}</div>
              )}
          </div>
        </section>
        {(showStaffForm || editingStaff) && <StaffModal initialStaff={editingStaff || undefined} onClose={() => { setShowStaffForm(false); setEditingStaff(null); }} onSaved={(savedStaff) => {
          setStaff((current) => [...current.filter((item) => item._id !== savedStaff._id), savedStaff]);
          setShowStaffForm(false);
          setEditingStaff(null);
          setError("");
          setNotice(`${savedStaff.fullName}'s payroll details were saved.`);
          void load();
        }} />}
        {paying && <PaymentModal run={paying} busy={busy === paying._id} onClose={() => setPaying(null)} onSubmit={recordPayment} />}
        {deletingRun && <DeletePayrollModal run={deletingRun} busy={busy === deletingRun._id} onClose={() => setDeletingRun(null)} onConfirm={deletePayroll} />}
      </main>
    </PermissionGuard>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-[#142319] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div><p className="text-xs text-white/50">{label}</p><p className="text-xl font-black">{value}</p></div></div>;
}

function SummaryValue({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-xl px-3 py-2 ${accent ? "bg-lime-100" : "bg-white/70"}`}><p className={`text-[10px] font-bold uppercase tracking-wider ${accent ? "text-lime-800" : "text-gray-400"}`}>{label}</p><p className={`mt-0.5 truncate text-sm font-black ${accent ? "text-[#142319]" : "text-gray-800"}`}>{value}</p></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-[#f8faf6] p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lime-700 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className={`truncate text-sm font-bold ${value ? "text-gray-800" : "text-amber-700"}`}>{value || "Not provided"}</p></div></div>;
}

function PayrollInput({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="block text-xs font-bold text-gray-600">{label}<div className="mt-1.5 flex h-11 items-center rounded-xl border border-gray-300 bg-white px-3 shadow-sm focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-100"><span className="mr-1 text-gray-400">₦</span><input type="number" min="0" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="0" className="min-w-0 flex-1 !bg-white text-sm outline-none" /></div></label>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-14 text-center text-sm text-gray-400"><Sparkles className="mx-auto mb-3 h-7 w-7 text-lime-500" />{text}</div>;
}

function StaffModal({ onClose, onSaved, initialStaff }: { onClose: () => void; onSaved: (staff: Staff) => void; initialStaff?: Staff }) {
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setError("");

    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const requiredFields = [
      ["fullName", "Full name"], ["employeeId", "Employee ID"],
      ["jobTitle", "Job title"], ["department", "Department"],
      ["accountNumber", "Account Number"], ["bankName", "Bank"], ["accountName", "Account Name"],
      ["baseSalary", "Basic salary"], ["nextPayDate", "Next pay date"],
    ];
    const missing = requiredFields
      .filter(([name]) => !String(raw[name] || "").trim())
      .map(([, label]) => label);
    if (missing.length) {
      setError(`Please complete: ${missing.join(", ")}.`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(initialStaff ? `/api/admin/payroll/staff/${initialStaff._id}` : "/api/admin/payroll/staff", {
        method: initialStaff ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
      const data = await response.json().catch(() => ({ error: "The server returned an invalid response" }));
      if (!response.ok) throw new Error(data.error || `Could not save staff (${response.status})`);
      if (!data.staff?._id) throw new Error("The database did not confirm the saved staff record");
      onSaved(data.staff as Staff);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save staff. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return <div onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="fixed inset-0 z-[100] grid place-items-center bg-[#07120c]/75 p-3 backdrop-blur-md sm:p-6">
    <form noValidate onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/20 bg-[#f8faf6] shadow-[0_30px_100px_rgba(0,0,0,.45)]">
      <header className="sticky top-0 z-10 flex items-start justify-between overflow-hidden rounded-t-[30px] bg-[#142319] px-5 py-5 text-white sm:px-8">
        <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-lime-400/20 blur-2xl" />
        <div className="relative flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-[#142319]"><UserPlus className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-lime-300">{initialStaff ? "Update payroll profile" : "New payroll profile"}</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{initialStaff ? "Edit staff member" : "Add staff member"}</h2><p className="mt-1 text-xs text-white/55">Personal, bank and starting payroll information</p></div></div>
        <button type="button" aria-label="Close" onClick={onClose} className="relative rounded-full border border-white/15 p-2 text-white/70 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </header>
      <div className="p-5 sm:p-8">
        {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <FormSection title="Staff information" subtitle="Identity and role details">
          <Field name="fullName" label="Full name" placeholder="e.g. Ada Okafor" defaultValue={initialStaff?.fullName} required />
          <Field name="employeeId" label="Employee ID" placeholder="e.g. EMP-001" defaultValue={initialStaff?.employeeId} required />
          <Field name="jobTitle" label="Job title" placeholder="e.g. Costume designer" defaultValue={initialStaff?.jobTitle} required />
          <Field name="department" label="Department" placeholder="e.g. Production" defaultValue={initialStaff?.department} required />
          <Field name="email" label="Email" type="email" placeholder="name@company.com" defaultValue={initialStaff?.email} />
          <Field name="phone" label="Phone" placeholder="0800 000 0000" defaultValue={initialStaff?.phone} />
        </FormSection>
        <FormSection title="Bank details" subtitle="Account used for salary payments">
          <Field name="accountNumber" label="Account Number" placeholder="10-digit account number" defaultValue={initialStaff?.accountNumber} required />
          <Field name="bankName" label="Bank" placeholder="e.g. GTBank" defaultValue={initialStaff?.bankName} required />
          <Field name="accountName" label="Account Name" placeholder="Name registered on account" defaultValue={initialStaff?.accountName} required />
        </FormSection>
        <FormSection title="Payroll setup" subtitle="Starting amounts can still be adjusted on each payroll row">
          <Field name="baseSalary" label="Basic (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.baseSalary ?? "")} required />
          <Field name="defaultOvertime" label="Overtime (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultOvertime ?? "")} />
          <Field name="defaultAirtime" label="Airtime (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultAirtime ?? "")} />
          <Field name="defaultBonus" label="Bonus (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultBonus ?? "")} />
          <Field name="defaultIncrease" label="Increase (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultIncrease ?? "")} />
          <Field name="defaultTax" label="Tax (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultTax ?? "")} />
          <Field name="defaultOwings" label="Owings / Loans / IOU (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultOwings ?? "")} />
          <Field name="defaultDismissalPayout" label="Dismissal / Payout (₦)" type="number" placeholder="0" defaultValue={String(initialStaff?.defaultDismissalPayout ?? "")} />
          <label className="block text-sm font-bold text-[#25372b]">Pay frequency
            <select name="payFrequency" defaultValue={initialStaff?.payFrequency || "monthly"} className="mt-2 h-12 w-full !rounded-xl !border !border-gray-300 !bg-white px-3 !text-base font-normal shadow-sm focus:!border-lime-500 focus:!ring-2 focus:!ring-lime-200">
              <option value="monthly">Monthly</option><option value="biweekly">Biweekly</option><option value="weekly">Weekly</option>
            </select>
          </label>
          <Field name="nextPayDate" label="Next pay date" type="date" required defaultValue={initialStaff?.nextPayDate ? initialStaff.nextPayDate.slice(0, 10) : today} />
        </FormSection>
        <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
          <p className="text-sm font-black text-lime-900">PIAT / Take Home</p>
          <p className="mt-1 text-xs leading-relaxed text-lime-800/70">Calculated automatically on the payroll row: Basic + Overtime + Airtime + Bonus + Increase + Dismissal/Payout − Tax − Owings/Loans/IOU.</p>
        </div>
        {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><X className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-black text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-[#142319] px-7 font-black text-white shadow-lg hover:bg-[#203a29] disabled:cursor-wait disabled:opacity-60">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Plus className="h-4 w-4" />}{saving ? "Saving to database…" : initialStaff ? "Save changes" : "Add to payroll"}</button>
        </div>
      </div>
    </form>
  </div>;
}

function PaymentModal({ run, busy, onClose, onSubmit }: { run: Run; busy: boolean; onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><form onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[28px] border border-white/20 bg-white p-7 shadow-2xl">
    <div className="flex justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-100"><Banknote className="text-lime-700" /></div><button type="button" onClick={onClose}><X /></button></div>
    <h2 className="mt-5 text-2xl font-black">Confirm payment</h2><p className="mt-1 text-sm text-gray-500">Record {money(run.netPay)} paid to {run.staffName}.</p>
    <label className="mt-5 block text-sm font-bold">Payment method<select name="paymentMethod" required className="mt-2 h-12 w-full !rounded-xl !border !border-gray-300 !bg-white px-3 font-normal shadow-sm"><option>Bank transfer</option><option>Cash</option><option>Cheque</option></select></label>
    <Field name="paymentReference" label="Payment reference" placeholder="Transaction reference (optional)" />
    <div className="mt-6 flex gap-3"><button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border border-gray-300 bg-white font-black text-gray-700">Cancel</button><button disabled={busy} className="h-12 flex-[1.5] rounded-xl bg-lime-500 font-black text-[#142319]">{busy ? "Recording…" : "Confirm as paid"}</button></div>
  </form></div>;
}

function DeletePayrollModal({ run, busy, onClose, onConfirm }: { run: Run; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);
  return <div onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()} className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="delete-payroll-title" className="w-full max-w-md rounded-[28px] border border-white/20 bg-white p-7 shadow-2xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700"><Trash2 className="h-5 w-5" /></span>
      <h2 id="delete-payroll-title" className="mt-5 text-2xl font-black text-gray-900">Delete payroll?</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">This will permanently delete <strong>{run.staffName}&apos;s {run.periodLabel}</strong> payroll and its earnings adjustments. This action cannot be undone.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" disabled={busy} onClick={onClose} className="h-12 flex-1 rounded-xl border border-gray-300 bg-white font-black text-gray-700 disabled:opacity-50">Cancel</button>
        <button type="button" disabled={busy} onClick={onConfirm} className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-red-600 font-black text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">{busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Trash2 className="h-4 w-4" />}{busy ? "Deleting…" : "Delete payroll"}</button>
      </div>
    </div>
  </div>;
}

function FormSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="mb-7"><div className="mb-4 border-b border-gray-200 pb-3"><h3 className="font-black text-[#142319]">{title}</h3><p className="text-xs text-gray-500">{subtitle}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>;
}

function Field({ name, label, type = "text", required = false, defaultValue, placeholder }: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string; placeholder?: string }) {
  return <label className="block text-sm font-bold text-[#25372b]">{label}{required && <span className="ml-1 text-lime-600">*</span>}<input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} min={type === "number" ? "0" : undefined} className="mt-2 h-12 w-full !rounded-xl !border !border-gray-300 !bg-white px-3 !text-base font-normal shadow-sm outline-none placeholder:!text-gray-400 hover:!border-gray-400 focus:!border-lime-500 focus:!ring-2 focus:!ring-lime-200" /></label>;
}
