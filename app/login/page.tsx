import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabaseServer";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const user = await getUser();
  if (user) {
    redirect(user.user_metadata?.role === "clinician" ? "/clinician" : "/dashboard");
  }
  const defaultRole = searchParams?.role === "clinician" ? "doctor" : "patient";
  return <AuthPanel mode="login" defaultRole={defaultRole} />;
}
