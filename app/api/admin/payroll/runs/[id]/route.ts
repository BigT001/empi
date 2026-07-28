import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import PayrollRun from "@/lib/models/PayrollRun";
import PayrollStaff from "@/lib/models/PayrollStaff";
import { requirePayrollAdmin } from "@/lib/payrollAuth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requirePayrollAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid payroll ID" }, { status: 400 });

  const body = await request.json();
  if (!["paid", "cancelled"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid payroll status" }, { status: 400 });
  }

  const run = await PayrollRun.findOne({ _id: id, status: "pending" });
  if (!run) return NextResponse.json({ error: "Pending payroll record not found" }, { status: 404 });

  run.status = body.status;
  if (body.status === "paid") {
    if (!body.paymentMethod) {
      return NextResponse.json({ error: "Select a payment method" }, { status: 400 });
    }
    run.paymentMethod = body.paymentMethod;
    run.paymentReference = body.paymentReference?.trim();
    run.paidAt = new Date();
    run.paidBy = admin._id;

    const staff = await PayrollStaff.findById(run.staff);
    if (staff) {
      const next = new Date(run.scheduledDate);
      next.setDate(next.getDate() + (staff.payFrequency === "weekly" ? 7 : staff.payFrequency === "biweekly" ? 14 : 30));
      staff.nextPayDate = next;
      await staff.save();
    }
  }
  await run.save();
  return NextResponse.json({ run, message: body.status === "paid" ? "Payment recorded" : "Payroll cancelled" });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requirePayrollAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid payroll ID" }, { status: 400 });
  }

  const run = await PayrollRun.findById(id);
  if (!run) return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
  if (run.status === "paid") {
    return NextResponse.json(
      { error: "Paid payroll cannot be deleted because it forms part of the payment audit trail" },
      { status: 409 }
    );
  }

  await run.deleteOne();
  return NextResponse.json({
    deletedId: id,
    message: `${run.staffName}'s ${run.periodLabel} payroll was deleted`,
  });
}
