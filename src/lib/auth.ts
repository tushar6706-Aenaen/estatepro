import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type UserRole = "public" | "agent" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
};

export async function getCurrentUserWithProfile() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

export async function requireRole(role: UserRole | UserRole[]) {
  const requiredRoles = Array.isArray(role) ? role : [role];
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user || !profile || !requiredRoles.includes(profile.role)) {
    redirect("/auth/sign-in");
  }

  return { user, profile };
}

