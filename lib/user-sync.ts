import { currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/supabase/server";

export async function syncClerkUserToDatabase() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const publicRole = user.publicMetadata?.role;
  const role = publicRole === "admin" ? "admin" : "staff";

  const supabase = createSupabaseServerClient();
  const payload = {
    clerk_user_id: user.id,
    email,
    full_name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null,
    role,
  };
  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select("id, clerk_user_id, email, full_name, role")
    .single();

  if (error) {
    throw new Error(`Failed to sync Clerk user: ${error.message}`);
  }

  return data as {
    id: string;
    clerk_user_id: string;
    email: string;
    full_name: string | null;
    role: "admin" | "staff";
  };
}
