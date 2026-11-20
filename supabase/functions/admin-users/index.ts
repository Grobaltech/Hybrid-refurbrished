import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const validUsername = (value: string) => /^[a-z0-9._-]{3,40}$/.test(value);
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return respond({ error: "The function is missing its Supabase server configuration." }, 500);
  }
  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Please sign in again. No access token was received." }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authorization.slice(7).trim();
  const { data: authResult, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authResult.user) {
    return respond({ error: "Your session is invalid or expired. Sign in again." }, 401);
  }

  const { data: caller, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, role, disabled")
    .eq("id", authResult.user.id)
    .maybeSingle();

  if (profileLookupError) {
    console.error("Caller profile lookup failed:", profileLookupError);
    return respond({ error: "Could not verify your account permissions." }, 500);
  }
  if (!caller || caller.disabled) {
    return respond({ error: "Your account is disabled or has no staff profile." }, 403);
  }
  if (caller.role !== "super_admin" && caller.role !== "admin") {
    return respond({ error: "Administrator permission required." }, 403);
  }

  try {
    const body = await req.json();
    const action = String(body?.action ?? "");

    // Only the System Super Admin can create the one Shop Director account.
    if (action === "create_shop_director") {
      if (caller.role !== "super_admin") {
        return respond({ error: "Only the System Super Admin can create the Shop Director." }, 403);
      }

      const username = String(body.username ?? "").trim().toLowerCase();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      if (!validUsername(username)) {
        return respond({ error: "Username must be 3–40 characters and use letters, numbers, dots, underscores or hyphens." }, 400);
      }
      if (!validEmail(email)) return respond({ error: "Enter a valid Shop Director email address." }, 400);
      if (email === String(authResult.user.email ?? "").toLowerCase()) {
        return respond({ error: "The Shop Director must use a different email from the System Super Admin." }, 400);
      }
      if (password.length < 10) {
        return respond({ error: "Password must contain at least 10 characters." }, 400);
      }

      const { data: existingDirector, error: directorCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      if (directorCheckError) {
        console.error("Shop Director check failed:", directorCheckError);
        return respond({ error: "Could not check whether a Shop Director already exists." }, 500);
      }
      if (existingDirector?.length) {
        return respond({ error: "A Shop Director account already exists. Only one Shop Director is allowed." }, 409);
      }

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, account_type: "shop_director" },
      });

      if (createError || !created.user) {
        return respond({ error: createError?.message ?? "Could not create the Shop Director login." }, 400);
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: created.user.id,
        username,
        role: "admin",
        email,
        disabled: false,
      });

      if (insertError) {
        await supabase.auth.admin.deleteUser(created.user.id);
        console.error("Shop Director profile insert failed:", insertError);
        return respond({ error: insertError.message }, 400);
      }

      return respond({ ok: true, id: created.user.id, role: "admin", message: "Shop Director account created." }, 201);
    }

    // Every other action belongs to the Shop Director, never the System Super Admin.
    if (caller.role !== "admin") {
      return respond({ error: "This staff-management action is available only to the Shop Director." }, 403);
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, phone, role, disabled, created_at")
        .neq("role", "super_admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return respond({ users: data ?? [] });
    }

    if (action === "create") {
      const username = String(body.username ?? "").trim().toLowerCase();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? "cashier");

      if (!validUsername(username)) return respond({ error: "Username must be 3–40 characters and use letters, numbers, dots, underscores or hyphens." }, 400);
      if (!validEmail(email)) return respond({ error: "Enter a valid staff email address." }, 400);
      if (password.length < 10) return respond({ error: "Password must contain at least 10 characters." }, 400);
      if (!["manager", "cashier"].includes(role)) {
        return respond({ error: "The Shop Director can create Manager or Cashier accounts only." }, 400);
      }

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (createError || !created.user) {
        return respond({ error: createError?.message ?? "Could not create the staff login." }, 400);
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: created.user.id,
        username,
        role,
        phone: body.phone ? String(body.phone).trim() : null,
        email,
        disabled: false,
      });
      if (insertError) {
        await supabase.auth.admin.deleteUser(created.user.id);
        return respond({ error: insertError.message }, 400);
      }
      return respond({ ok: true, id: created.user.id, message: "Staff account created." }, 201);
    }

    const userId = String(body.user_id ?? "");
    if (!validUuid(userId)) return respond({ error: "A valid user ID is required." }, 400);

    const { data: target, error: targetError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) return respond({ error: "Staff account not found." }, 404);
    if (target.role === "super_admin" || target.role === "admin") {
      return respond({ error: "The Shop Director cannot change or manage a System Super Admin or another Shop Director." }, 403);
    }

    if (action === "set_disabled") {
      const disabled = body.disabled === true;
      const { error } = await supabase.from("profiles").update({ disabled }).eq("id", userId);
      if (error) throw error;

      const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: disabled ? "876000h" : "none",
      });
      if (banError) throw banError;
      return respond({ ok: true });
    }

    if (action === "set_role") {
      const role = String(body.role ?? "");
      if (!["manager", "cashier"].includes(role)) {
        return respond({ error: "Staff roles can only be Manager or Cashier." }, 400);
      }
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
      return respond({ ok: true });
    }

    if (action === "reset_password") {
      const password = String(body.password ?? "");
      if (password.length < 10) return respond({ error: "Password must contain at least 10 characters." }, 400);
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return respond({ ok: true });
    }

    if (action === "get_access") {
      const [capsResult, pagesResult] = await Promise.all([
        supabase.from("user_caps").select("cap, allowed").eq("user_id", userId),
        supabase.from("user_page_access").select("page, allowed").eq("user_id", userId),
      ]);
      if (capsResult.error) throw capsResult.error;
      if (pagesResult.error) throw pagesResult.error;
      return respond({
        caps: (capsResult.data ?? []).filter((item) => item.allowed).map((item) => item.cap),
        pages: Object.fromEntries((pagesResult.data ?? []).map((item) => [item.page, item.allowed])),
      });
    }

    if (action === "set_access") {
      const caps = Array.isArray(body.caps) ? [...new Set(body.caps.map(String).filter(Boolean))] : [];
      const pages = body.pages && typeof body.pages === "object" && !Array.isArray(body.pages) ? body.pages : {};

      const { error: deleteCapsError } = await supabase.from("user_caps").delete().eq("user_id", userId);
      if (deleteCapsError) throw deleteCapsError;
      if (caps.length) {
        const { error } = await supabase.from("user_caps").insert(caps.map((cap) => ({
          user_id: userId,
          cap,
          allowed: true,
        })));
        if (error) throw error;
      }

      const { error: deletePagesError } = await supabase.from("user_page_access").delete().eq("user_id", userId);
      if (deletePagesError) throw deletePagesError;
      const pageEntries = Object.entries(pages)
        .filter(([page, allowed]) => /^[a-z0-9_-]{1,80}$/i.test(page) && typeof allowed === "boolean")
        .map(([page, allowed]) => ({ user_id: userId, page, allowed }));
      if (pageEntries.length) {
        const { error } = await supabase.from("user_page_access").insert(pageEntries);
        if (error) throw error;
      }
      return respond({ ok: true });
    }

    return respond({ error: "Unknown admin action." }, 400);
  } catch (error) {
    console.error("admin-users error:", error);
    return respond({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
