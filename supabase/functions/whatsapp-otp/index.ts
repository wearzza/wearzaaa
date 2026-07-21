import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OTPRecord {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
}

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/[^0-9+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("977")) p = p.slice(3);
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 10 && p.startsWith("9")) p = "977" + p;
  return p;
}

async function sendWhatsApp(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("CALLMEBOT_API_KEY");
  const whatsappNumber = Deno.env.get("WHATSAPP_NUMBER");

  if (!apiKey || !whatsappNumber) {
    console.warn("WhatsApp credentials not configured. OTP will be stored in DB for retrieval.");
    return { success: false, error: "WhatsApp not configured" };
  }

  const fullPhone = normalizePhone(phone);
  const message = `*Wearza Verification Code*\n\nYour OTP is: *${code}*\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.\n\n- Wearza Team`;

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${fullPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      const text = await response.text();
      console.error("CallMeBot error:", response.status, text);
      return { success: false, error: `WhatsApp API error: ${response.status}` };
    }

    const text = await response.text();
    if (text.toLowerCase().includes("error") || text.toLowerCase().includes("invalid")) {
      console.error("CallMeBot returned error:", text);
      return { success: false, error: "WhatsApp delivery failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, phone, code } = body;

    if (!action || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing action or phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== SEND OTP =====
    if (action === "send") {
      const normalizedPhone = phone.trim();
      if (!/^[0-9+\-\s]{7,15}$/.test(normalizedPhone)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limit: max 3 OTPs per phone in 10 minutes
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("otp_codes")
        .select("id")
        .eq("phone", normalizedPhone)
        .gte("created_at", tenMinAgo);

      if (recent && recent.length >= 3) {
        return new Response(
          JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invalidate previous unverified OTPs for this phone
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", normalizedPhone)
        .eq("verified", false);

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("otp_codes").insert({
        phone: normalizedPhone,
        code: otp,
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      });

      if (insertError) {
        console.error("DB insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Attempt WhatsApp delivery
      const sendResult = await sendWhatsApp(normalizedPhone, otp);

      // For development: return the OTP so the UI can display it if WhatsApp fails
      // In production with real WhatsApp credentials, this would be removed
      const whatsappConfigured = !!(Deno.env.get("CALLMEBOT_API_KEY") && Deno.env.get("WHATSAPP_NUMBER"));

      return new Response(
        JSON.stringify({
          success: true,
          message: whatsappConfigured
            ? "OTP sent to your WhatsApp number"
            : "OTP generated. WhatsApp not configured - showing OTP for testing.",
          delivered: sendResult.success,
          // Only include dev_otp when WhatsApp is NOT configured (for testing)
          ...(whatsappConfigured ? {} : { dev_otp: otp }),
          expires_in: OTP_EXPIRY_MINUTES * 60,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== VERIFY OTP =====
    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Missing OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedPhone = phone.trim();

      // Get the latest unverified OTP for this phone
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", normalizedPhone)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ error: "No valid OTP found. Please request a new code." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const record = otpRecord as OTPRecord;

      // Check expiry
      if (new Date(record.expires_at) < new Date()) {
        await supabase.from("otp_codes").delete().eq("id", record.id);
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new code." }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts
      if (record.attempts >= MAX_ATTEMPTS) {
        await supabase.from("otp_codes").delete().eq("id", record.id);
        return new Response(
          JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment attempts
      await supabase
        .from("otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      // Verify code
      if (record.code !== code.trim()) {
        return new Response(
          JSON.stringify({ error: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts - 1} attempts remaining.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabase
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", record.id);

      // Clean up old OTPs for this phone
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", normalizedPhone)
        .neq("id", record.id);

      return new Response(
        JSON.stringify({ success: true, verified: true, message: "Phone number verified successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
