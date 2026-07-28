import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import PayrollStaff from "@/lib/models/PayrollStaff";
import { requirePayrollAdmin } from "@/lib/payrollAuth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requirePayrollAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });

  const body = await request.json();
  const allowed = [
    "fullName", "email", "phone", "jobTitle", "department", "employmentType",
    "payFrequency", "baseSalary", "defaultAllowance", "defaultDeduction",
    "defaultOvertime", "defaultAirtime", "defaultBonus", "defaultIncrease",
    "defaultTax", "defaultOwings", "defaultDismissalPayout",
    "nextPayDate", "bankName", "accountName", "accountNumber", "status",
  ];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  const staff = await PayrollStaff.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  return NextResponse.json({ staff, message: "Staff record updated" });
}
