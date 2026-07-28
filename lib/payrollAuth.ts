import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function requirePayrollAdmin(request: NextRequest) {
  await connectDB();
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return null;

  const admin = await Admin.findOne({
    isActive: true,
    sessions: {
      $elemMatch: {
        token,
        expiresAt: { $gt: new Date() },
      },
    },
  }).select("_id role permissions fullName email");

  if (!admin) return null;
  const canManagePayroll =
    admin.role === "super_admin" ||
    admin.permissions?.includes("access_all_features") ||
    admin.permissions?.includes("manage_payroll");
  return canManagePayroll ? admin : null;
}
