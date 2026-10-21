import nodemailer from 'nodemailer';

export interface SendCredentialsOptions {
  to: string;
  name: string;
  password: string;
  role?: string;
  loginUrl?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Checks if the SMTP environment variables are properly configured.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.SMTP_SERVICE
  );
}

/**
 * Creates and returns a Nodemailer transporter using environment variables.
 */
export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generates an aesthetic, responsive HTML template for account credentials.
 */
function buildCredentialsEmailHtml({
  name,
  email,
  password,
  role,
  loginUrl,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
  loginUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); overflow: hidden;">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);"></td>
          </tr>
          
          <!-- Content Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <div style="font-size: 20px; font-weight: 800; color: #60a5fa; letter-spacing: -0.5px; margin-bottom: 8px;">
                TASK TRACKER
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Welcome to the Team, ${name}! 👋
              </h1>
              <p style="margin: 12px 0 0 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                An administrator has created an account for you. Here are your portal access details and temporary login password:
              </p>
            </td>
          </tr>

          <!-- Credentials Box -->
          <tr>
            <td style="padding: 0 36px 20px 36px;">
              <table role="presentation" width="100%" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Login Email</span>
                    <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-top: 4px; word-break: break-all;">
                      ${email}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; border-top: 1px solid #1e293b; padding-top: 12px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Temporary Password</span>
                    <div style="font-size: 17px; font-weight: 700; color: #34d399; font-family: 'Courier New', Courier, monospace; letter-spacing: 1.5px; margin-top: 4px; background: rgba(52, 211, 153, 0.1); padding: 8px 12px; border-radius: 6px; display: inline-block;">
                      ${password}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #1e293b; padding-top: 12px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Account Role</span>
                    <div style="font-size: 14px; font-weight: 600; color: #cbd5e1; margin-top: 4px;">
                      ${role}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td align="center" style="padding: 10px 36px 30px 36px;">
              <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); text-align: center;">
                Log In to Your Account &rarr;
              </a>
              <div style="margin-top: 16px; font-size: 13px; color: #64748b;">
                Or copy and open this URL: <a href="${loginUrl}" style="color: #60a5fa; text-decoration: underline;">${loginUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              <table role="presentation" width="100%" style="background-color: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 8px; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 13px; color: #fde047; line-height: 1.5;">
                    ⚠️ <strong>Security Reminder:</strong> For your protection, you will be prompted to change this temporary password upon your initial login. Never share your password with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                This email was sent by the Task Tracker system on behalf of your administrator.<br>
                If you did not expect this invitation, please contact your administrator.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a welcome email containing user login credentials.
 */
export async function sendUserCredentialsEmail(options: SendCredentialsOptions): Promise<EmailResult> {
  const { to, name, password, role = 'USER' } = options;
  const loginUrl = options.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/login`;

  console.log(`[Email Service] Preparing credentials email for: ${to}`);

  if (!isSmtpConfigured()) {
    const warningMsg = 'SMTP credentials not configured in environment variables (SMTP_USER and SMTP_PASS). Email skipped.';
    console.warn(`[Email Service] ${warningMsg}`);
    return {
      success: false,
      error: warningMsg,
    };
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    const errMsg = 'Failed to create SMTP transporter.';
    console.error(`[Email Service] ${errMsg}`);
    return {
      success: false,
      error: errMsg,
    };
  }

  const from = process.env.SMTP_FROM || `"Task Tracker" <${process.env.SMTP_USER}>`;
  const subject = 'Your Task Tracker Account Login Credentials';

  const textBody = `
Hello ${name},

An account has been created for you in Task Tracker.

Your login credentials are:
- Login URL: ${loginUrl}
- Email: ${to}
- Temporary Password: ${password}
- Role: ${role}

Please log in and update your password immediately.

Best regards,
Task Tracker Team
  `.trim();

  const htmlBody = buildCredentialsEmailHtml({
    name,
    email: to,
    password,
    role,
    loginUrl,
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[Email Service] Credentials email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[Email Service] Error sending email to ${to}:`, error);
    return {
      success: false,
      error: error?.message || 'Failed to send credentials email',
    };
  }
}
