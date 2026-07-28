import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import PayrollRun from "@/lib/models/PayrollRun";
import PayrollStaff from "@/lib/models/PayrollStaff";
import { requirePayrollAdmin } from "@/lib/payrollAuth";

export async function GET(request: NextRequest) {
  const admin = await requirePayrollAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const runs = await PayrollRun.find().sort({ scheduledDate: -1, createdAt: -1 }).limit(250).lean();
  return NextResponse.json({ runs });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePayrollAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.staffId) || !body.periodLabel || !body.scheduledDate) {
      return NextResponse.json({ error: "Staff, pay period, and date are required" }, { status: 400 });
    }

    const staff = await PayrollStaff.findOne({ _id: body.staffId, status: "active" });
    if (!staff) return NextResponse.json({ error: "Active staff member not found" }, { status: 404 });

    const baseSalary = Number(body.baseSalary ?? staff.baseSalary);
    const overtime = Number(body.overtime || 0);
    const airtime = Number(body.airtime || 0);
    const bonus = Number(body.bonus || 0);
    const increase = Number(body.increase || 0);
    const tax = Number(body.tax || 0);
    const owings = Number(body.owings || 0);
    const dismissalPayout = Number(body.dismissalPayout || 0);
    const amounts = [baseSalary, overtime, airtime, bonus, increase, tax, owings, dismissalPayout];
    const netPay = baseSalary + overtime + airtime + bonus + increase + dismissalPayout - tax - owings;
    if (!amounts.every((amount) => Number.isFinite(amount) && amount >= 0) || netPay < 0) {
      return NextResponse.json({ error: "Invalid payroll amounts" }, { status: 400 });
    }

    const periodLabel = String(body.periodLabel).trim();
    const existingRun = await PayrollRun.findOne({ staff: staff._id, periodLabel });

    if (existingRun?.status === "paid") {
      return NextResponse.json(
        { error: "This payroll has already been paid and is locked for audit. Choose another pay period." },
        { status: 409 }
      );
    }

    if (existingRun) {
      existingRun.employeeId = staff.employeeId;
      existingRun.staffName = staff.fullName;
      existingRun.jobTitle = staff.jobTitle;
      existingRun.scheduledDate = body.scheduledDate;
      existingRun.baseSalary = baseSalary;
      existingRun.overtime = overtime;
      existingRun.airtime = airtime;
      existingRun.bonus = bonus;
      existingRun.increase = increase;
      existingRun.tax = tax;
      existingRun.owings = owings;
      existingRun.dismissalPayout = dismissalPayout;
      existingRun.netPay = netPay;
      existingRun.notes = body.notes;
      existingRun.status = "pending";
      await existingRun.save();
      return NextResponse.json(
        { run: existingRun, created: false, message: "Payroll adjustments updated" },
        { status: 200 }
      );
    }

    const run = await PayrollRun.create({
      staff: staff._id,
      employeeId: staff.employeeId,
      staffName: staff.fullName,
      jobTitle: staff.jobTitle,
      periodLabel,
      scheduledDate: body.scheduledDate,
      baseSalary,
      overtime,
      airtime,
      bonus,
      increase,
      tax,
      owings,
      dismissalPayout,
      netPay,
      notes: body.notes,
      createdBy: admin._id,
    });
    return NextResponse.json({ run, created: true, message: "Payroll prepared and saved" }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "This payroll changed in another session. Refresh and save again." }, { status: 409 });
    }
    console.error("[Payroll Run POST]", error);
    return NextResponse.json({ error: "Unable to schedule payroll" }, { status: 500 });
  }
}
