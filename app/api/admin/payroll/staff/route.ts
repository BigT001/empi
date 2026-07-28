import { NextRequest, NextResponse } from "next/server";
import PayrollStaff from "@/lib/models/PayrollStaff";
import { requirePayrollAdmin } from "@/lib/payrollAuth";

export async function GET(request: NextRequest) {
  const admin = await requirePayrollAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const staff = await PayrollStaff.find().sort({ status: 1, fullName: 1 }).lean();
  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePayrollAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const required = [
      "employeeId", "fullName", "jobTitle", "department", "baseSalary", "nextPayDate",
      "accountNumber", "bankName", "accountName",
    ];
    if (required.some((field) => body[field] === undefined || body[field] === "")) {
      return NextResponse.json({ error: "Please complete all required fields" }, { status: 400 });
    }

    const baseSalary = Number(body.baseSalary);
    const allowance = Number(body.defaultAllowance || 0);
    const deduction = Number(body.defaultDeduction || 0);
    const payrollDefaults = ["defaultOvertime", "defaultAirtime", "defaultBonus", "defaultIncrease", "defaultTax", "defaultOwings", "defaultDismissalPayout"]
      .map((field) => Number(body[field] || 0));
    if (![baseSalary, allowance, deduction, ...payrollDefaults].every((amount) => Number.isFinite(amount) && amount >= 0)) {
      return NextResponse.json({ error: "Payroll amounts must be valid positive numbers" }, { status: 400 });
    }

    const nextPayDate = new Date(body.nextPayDate);
    if (Number.isNaN(nextPayDate.getTime())) {
      return NextResponse.json({ error: "Please choose a valid next pay date" }, { status: 400 });
    }

    const staff = await PayrollStaff.create({
      employeeId: String(body.employeeId).trim().toUpperCase(),
      fullName: String(body.fullName).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      phone: body.phone ? String(body.phone).trim() : undefined,
      jobTitle: String(body.jobTitle).trim(),
      department: String(body.department).trim(),
      employmentType: body.employmentType || "full_time",
      payFrequency: body.payFrequency || "monthly",
      baseSalary,
      defaultAllowance: allowance,
      defaultDeduction: deduction,
      defaultOvertime: payrollDefaults[0],
      defaultAirtime: payrollDefaults[1],
      defaultBonus: payrollDefaults[2],
      defaultIncrease: payrollDefaults[3],
      defaultTax: payrollDefaults[4],
      defaultOwings: payrollDefaults[5],
      defaultDismissalPayout: payrollDefaults[6],
      bankName: String(body.bankName).trim(),
      accountName: String(body.accountName).trim(),
      accountNumber: String(body.accountNumber).trim(),
      status: "active",
      nextPayDate,
      createdBy: admin._id,
    });
    const savedStaff = await PayrollStaff.findById(staff._id).lean();
    if (!savedStaff) {
      throw new Error("Staff record was not found after saving");
    }
    return NextResponse.json({ staff: savedStaff, message: "Staff member added and saved" }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "That employee ID is already in use" }, { status: 409 });
    }
    console.error("[Payroll Staff POST]", error);
    const message = error instanceof Error && error.name === "ValidationError"
      ? error.message
      : "Unable to save this staff member. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
