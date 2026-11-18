import { Resend } from "resend";

/**
 * Resend Email Service Client
 * Runs strictly on the server; RESEND_API_KEY must never be exposed to client bundles.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("placeholder") || apiKey === "mock") {
    return null;
  }
  return new Resend(apiKey);
}

// In development or when domain is unverified, Resend allows sending from onboarding@resend.dev
const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || "Methagu Kalanjiyam <onboarding@resend.dev>";

export interface EmailResult {
  success: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Sends a 6-digit Two-Step Verification OTP to an administrator.
 * Security: Plain, branded, single code in body, "ignore if not you" notice, no clickable login links.
 */
export async function sendAdminOtpEmail(params: {
  to: string;
  otpCode: string;
  expiresInMinutes?: number;
}): Promise<EmailResult> {
  const { to, otpCode, expiresInMinutes = 10 } = params;
  const resend = getResendClient();

  const subject = "🔒 Your Admin Verification Code — Methagu Kalanjiyam";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #faf9f6; color: #1c1917; border-radius: 12px; border: 1px solid #e7e5e4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 800; color: #0A6847; margin: 0; letter-spacing: -0.5px;">
          மேதகு களஞ்சியம் • METHAGU KALANJIYAM
        </h1>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #78716c; margin-top: 4px;">
          Security Administration Gate
        </p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e7e5e4; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <p style="font-size: 14px; color: #44403c; margin-top: 0;">
          A login attempt to the Archives Administration Console requires your two-step verification code:
        </p>

        <div style="margin: 24px 0; padding: 16px; background-color: #f5f5f4; border-radius: 8px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; font-family: monospace; color: #0A6847; border: 1px dashed #0A6847;">
          ${otpCode}
        </div>

        <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">
          This code will expire in <strong>${expiresInMinutes} minutes</strong> and can only be used once.
        </p>
      </div>

      <div style="margin-top: 24px; padding: 12px; font-size: 11px; color: #a8a29e; line-height: 1.5; text-align: center;">
        <p style="margin: 0;">
          ⚠️ <strong>Security Notice:</strong> If you did not initiate this login request, please ignore this email. Your password may be compromised; consider rotating your credentials immediately.
        </p>
        <p style="margin-top: 8px;">
          This is an automated system email. Do not reply to this message.
        </p>
      </div>
    </div>
  `;

  const text = `
METHAGU KALANJIYAM — Security Administration Gate

Your 6-digit Admin Verification Code is: ${otpCode}

This code will expire in ${expiresInMinutes} minutes and can only be used once.

Security Notice: If you did not initiate this login request, please ignore this email. Your password may be compromised.
  `.trim();

  if (!resend) {
    console.info(`[Email Simulation] Admin OTP sent to ${to}: [${otpCode}]`);
    return { success: true, simulated: true, id: `mock-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend sendAdminOtpEmail error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Resend exception in sendAdminOtpEmail:", err);
    return { success: false, error: err.message || "Failed to dispatch email" };
  }
}

/**
 * Sends an email verification link to a newly registered user.
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<EmailResult> {
  const { to, name, verifyUrl } = params;
  const resend = getResendClient();

  const subject = "களஞ்சிய வாசகர் கணக்கு சரிபார்ப்பு — Verify your email";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #faf9f6; color: #1c1917; border-radius: 12px; border: 1px solid #e7e5e4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 800; color: #0A6847; margin: 0;">
          மேதகு களஞ்சியம்
        </h1>
        <p style="font-size: 12px; color: #78716c; margin-top: 4px;">
          Rare Tamil Literature & Archives
        </p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e7e5e4; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <p style="font-size: 15px; color: #1c1917; margin-top: 0;">
          வணக்கம் ${name || "வாசகரே"},
        </p>
        <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
          மேதகு களஞ்சியத்தில் வாசகர் கணக்கு தொடங்கியதற்கு நன்றி. உங்கள் கணக்கை உறுதிசெய்து நூல்களை வாசிக்க மற்றும் பாதுகாப்பாக ஆர்டர் செய்ய கீழே உள்ள இணைப்பை சொடுக்கவும்:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyUrl}" style="background-color: #0A6847; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
            மின்னஞ்சலை உறுதிப்படுத்துக (Verify Email)
          </a>
        </div>

        <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin-bottom: 0;">
          இந்த இணைப்பு 24 மணி நேரம் மட்டுமே செயல்பாட்டில் இருக்கும். பட்டன் வேலை செய்யவில்லை என்றால், கீழே உள்ள இணைப்பை உலாவி முகவரியில் ஒட்டவும்:<br/>
          <span style="color: #0A6847; word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>

      <div style="margin-top: 20px; font-size: 11px; color: #a8a29e; text-align: center;">
        <p style="margin: 0;">
          நீங்கள் இந்த கணக்கை உருவாக்கவில்லை என்றால், இந்த மின்னஞ்சலை புறக்கணிக்கலாம்.
        </p>
      </div>
    </div>
  `;

  const text = `
மேதகு களஞ்சியம் — வாசகர் கணக்கு உறுதிப்படுத்தல்

வணக்கம் ${name || "வாசகரே"},

உங்கள் மின்னஞ்சலை உறுதிப்படுத்த பின்வரும் இணைப்பை திறக்கவும்:
${verifyUrl}

இந்த இணைப்பு 24 மணி நேரம் செல்லுபடியாகும்.
  `.trim();

  if (!resend) {
    console.info(`[Email Simulation] Verification email sent to ${to}: ${verifyUrl}`);
    return { success: true, simulated: true, id: `mock-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend sendVerificationEmail error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Resend exception in sendVerificationEmail:", err);
    return { success: false, error: err.message || "Failed to dispatch email" };
  }
}

/**
 * Sends a notification if an account already exists for the attempted email address.
 * Prevents account enumeration while keeping the user informed.
 */
export async function sendAlreadyRegisteredEmail(params: {
  to: string;
  loginUrl: string;
}): Promise<EmailResult> {
  const { to, loginUrl } = params;
  const resend = getResendClient();

  const subject = "களஞ்சிய வாசகர் கணக்கு அறிவிப்பு — Account Notice";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #faf9f6; color: #1c1917; border-radius: 12px; border: 1px solid #e7e5e4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 800; color: #0A6847; margin: 0;">
          மேதகு களஞ்சியம்
        </h1>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e7e5e4;">
        <p style="font-size: 14px; color: #44403c; line-height: 1.6; margin-top: 0;">
          இந்த மின்னஞ்சல் முகவரியில் (${to}) ஏற்கனவே ஒரு வாசகர் கணக்கு பதிவு செய்யப்பட்டுள்ளது.
        </p>
        <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
          நீங்கள் உங்கள் கணக்கில் உள்நுழைய விரும்பினால், கீழே உள்ள இணைப்பைப் பயன்படுத்தவும்:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #0A6847; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">
            உள்நுழைய (Sign In)
          </a>
        </div>
      </div>
    </div>
  `;

  const text = `
மேதகு களஞ்சியம் — வாசகர் கணக்கு அறிவிப்பு

இந்த மின்னஞ்சல் முகவரியில் (${to}) ஏற்கனவே ஒரு வாசகர் கணக்கு உள்ளது.
உள்நுழைய: ${loginUrl}
  `.trim();

  if (!resend) {
    console.info(`[Email Simulation] Already registered notice sent to ${to}`);
    return { success: true, simulated: true, id: `mock-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend sendAlreadyRegisteredEmail error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Resend exception in sendAlreadyRegisteredEmail:", err);
    return { success: false, error: err.message };
  }
}

