import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/**
 * Hard segregation: the entire clinician area is for signed-in clinicians only.
 * Signed-out users are sent to the clinician sign-in; patients are sent back to
 * their own dashboard. Patients can never see the review console.
 */
export default async function ClinicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login?role=clinician");
  if (user.user_metadata?.role !== "clinician") redirect("/dashboard");
  return <>{children}</>;
}
