/**
 * Creates the default administrator account.
 * Run once after migrations are applied and env vars are set:
 *
 *   npx tsx supabase/seed-admin.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (never expose this in the browser).
 */
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@edufake.sk";
const ADMIN_PASSWORD = "EF12345690*@";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Administrator", role: "administrator" },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("Admin user already exists — skipping.");
      return;
    }
    throw error;
  }

  // The `handle_new_auth_user` trigger auto-creates the matching profiles row
  // with role 'guest' by default (metadata role isn't read by the trigger by
  // design, to avoid trusting client-supplied metadata) — promote it here.
  await supabase
    .from("profiles")
    .update({ role: "administrator" })
    .eq("id", data.user!.id);

  console.log(`Administrator created: ${ADMIN_EMAIL}`);
  console.log(
    "IMPORTANT: rotate this password immediately after first login — it is committed to your repo history."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
