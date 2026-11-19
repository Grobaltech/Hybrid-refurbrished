import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!url || !serviceKey || !authHeader) return respond({ error: "Server configuration or authentication missing." }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Your session is invalid. Sign in again." }, 401);

  const { data: caller, error: callerError } = await admin.from("profiles").select("id, role, disabled").eq("id", authData.user.id).maybeSingle();
  if (callerError || !caller || caller.disabled || caller.role !== "admin") return respond({ error: "Administrator permission required." }, 403);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data, error } = await admin.from("profiles").select("id, username, email, phone, role, disabled, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return respond({ users: data ?? [] });
    }

    if (action === "create") {
      const username = String(body.username ?? "").trim().toLowerCase();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? "cashier");
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) return respond({ error: "Username must be 3–40 characters and use letters, numbers, dots, underscores or hyphens." }, 400);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond({ error: "A valid email address is required for the staff login." }, 400);
      if (password.length < 10) return respond({ error: "Password must contain at least 10 characters." }, 400);
      if (!["admin", "manager", "cashier"].includes(role)) return respond({ error: "Invalid role." }, 400);
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { username },
      });
      if (createError || !created.user) return respond({ error: createError?.message ?? "Account creation failed." }, 400);
      const { error: profileError } = await admin.from("profiles").insert({
        id: created.user.id, username, role, phone: body.phone ?? null, email, disabled: false,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return respond({ error: profileError.message }, 400);
      }
      return respond({ ok: true, id: created.user.id }, 201);
    }

    const userId = String(body.user_id ?? "");
    if (!userId) return respond({ error: "User ID is required." }, 400);
    if (action === "set_disabled") {
      const disabled = Boolean(body.disabled);
      const { error } = await admin.from("profiles").update({ disabled }).eq("id", userId);
      if (error) throw error;
      const { error: authBanError } = await admin.auth.admin.updateUserById(userId, { ban_duration: disabled ? "876000h" : "none" });
      if (authBanError) throw authBanError;
      return respond({ ok: true });
    }
    if (action === "set_role") {
      const role = String(body.role ?? "");
      if (!["admin", "manager", "cashier"].includes(role)) return respond({ error: "Invalid role." }, 400);
      if (userId === authData.user.id && role !== "admin") return respond({ error: "You cannot remove your own administrator role." }, 400);
      const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
      return respond({ ok: true });
    }
    if (action === "reset_password") {
      const password = String(body.password ?? "");
      if (password.length < 10) return respond({ error: "Password must contain at least 10 characters." }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return respond({ ok: true });
    }
    if (action === "get_access") {
      const [capResult, pageResult] = await Promise.all([
        admin.from("user_caps").select("cap, allowed").eq("user_id", userId),
        admin.from("user_page_access").select("page, allowed").eq("user_id", userId),
      ]);
      if (capResult.error) throw capResult.error;
      if (pageResult.error) throw pageResult.error;
      return respond({
        caps: (capResult.data ?? []).filter((item) => item.allowed).map((item) => item.cap),
        pages: Object.fromEntries((pageResult.data ?? []).map((item) => [item.page, item.allowed])),
      });
    }
    if (action === "set_access") {
      const caps = Array.isArray(body.caps) ? body.caps.map(String).filter(Boolean) : [];
      const pages = body.pages && typeof body.pages === "object" && !Array.isArray(body.pages) ? body.pages : {};
      const { error: clearCapsError } = await admin.from("user_caps").delete().eq("user_id", userId);
      if (clearCapsError) throw clearCapsError;
      if (caps.length) {
        const { error } = await admin.from("user_caps").insert([...new Set(caps)].map((cap) => ({ user_id: userId, cap, allowed: true })));
        if (error) throw error;
      }
      const { error: clearPagesError } = await admin.from("user_page_access").delete().eq("user_id", userId);
      if (clearPagesError) throw clearPagesError;
      const entries = Object.entries(pages).filter(([page, allowed]) => /^[a-z0-9_-]{1,80}$/i.test(page) && typeof allowed === "boolean").map(([page, allowed]) => ({ user_id: userId, page, allowed }));
      if (entries.length) {
        const { error } = await admin.from("user_page_access").insert(entries);
        if (error) throw error;
      }
      return respond({ ok: true });
    }
    return respond({ error: "Unknown admin action." }, 400);
  } catch (error) {
    console.error("admin-users error", error);
    return respond({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
