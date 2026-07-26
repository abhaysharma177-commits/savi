import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates an auth user that is confirmed immediately, using the service key.
 * This sidesteps email-confirmation (and its free-tier email rate limit) so
 * sign-up is instant. The client then signs in with the same credentials.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = (await req.json()) as {
      email?: string;
      password?: string;
      role?: string;
    };

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "A valid email and a password of at least 6 characters are required." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: "Accounts are not configured for this deployment." },
        { status: 500 }
      );
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role === "clinician" ? "clinician" : "patient" },
    });

    if (error) {
      const already = /registered|already/i.test(error.message);
      return NextResponse.json(
        {
          error: already
            ? "That email already has an account. Try signing in instead."
            : error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
