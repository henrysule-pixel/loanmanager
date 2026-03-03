import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/supabase/server";

export async function requireUserId() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function requireRole(allowedRoles: Array<"admin" | "staff">) {
  const userId = await requireUserId();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("users").select("role").eq("clerk_user_id", userId).single();
  if (error) {
    throw new Error("Unable to verify user role");
  }
  const role = data?.role as "admin" | "staff" | undefined;
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Forbidden");
  }
  return role;
}
