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
  const allowedRole = ["super_admin", "admin", "finance_admin"].includes(admin.role);
  // Payroll is restricted by role at the server boundary. Permissions returned
  // by /api/admin/me are merged at runtime and may not yet be stored on older
  // admin records, so checking only the stored array can incorrectly reject a
  // valid admin who can already see the payroll screen.
  return allowedRole ? admin : null;
}
