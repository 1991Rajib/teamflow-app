import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface SendInvitationEmailArgs {
  email: string;
  role: string;
  workspaceName: string;
  inviterName: string;
  token: string;
  expiresInDays: number;
}

/**
 * Validates whether all required SMTP configurations exist.
 */
function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !portStr || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port: Number(portStr),
    user,
    pass,
    from,
  };
}

/**
 * Renders the HTML template for the workspace invitation email.
 */
function renderInvitationHtml(
  email: string,
  roleLabel: string,
  workspaceName: string,
  inviterName: string,
  inviteUrl: string,
  expiresInDays: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${workspaceName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px border #1f2937;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 30px;
      background: linear-gradient(to right, #60a5fa, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 10px 0;
    }
    .header p {
      font-size: 14px;
      color: #9ca3af;
      margin: 0;
      line-height: 1.5;
    }
    .detail-card {
      background-color: #1f2937;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 30px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #9ca3af;
      font-weight: 500;
    }
    .detail-value {
      color: #e5e7eb;
      font-weight: 600;
    }
    .btn-container {
      text-align: center;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(to right, #3b82f6, #6366f1);
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
      transition: all 0.2s;
    }
    .fallback-container {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      line-height: 1.6;
      word-break: break-all;
    }
    .fallback-link {
      color: #60a5fa;
      text-decoration: none;
    }
    .footer {
      border-t: 1px solid #1f2937;
      margin-top: 40px;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">TeamFlow</div>
      <div class="header">
        <h1>Workspace Invitation</h1>
        <p>You have been invited to join <strong>${workspaceName}</strong> on TeamFlow.</p>
      </div>
      
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Invited By:</span>
          <span class="detail-value">${inviterName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Role:</span>
          <span class="detail-value">${roleLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Invited Email:</span>
          <span class="detail-value">${email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expiration:</span>
          <span class="detail-value">${expiresInDays} Days</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${inviteUrl}" class="btn" target="_blank">Accept Invitation</a>
      </div>

      <div class="fallback-container">
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <a href="${inviteUrl}" class="fallback-link">${inviteUrl}</a>
      </div>

      <div class="footer">
        This is an automated invitation sent from TeamFlow.<br>
        If you did not expect this email, you can safely ignore it.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches a workspace invitation email.
 * Connects to Resend SMTP when configured; falls back to development mock logger otherwise.
 */
export async function sendInvitationEmail({
  email,
  role,
  workspaceName,
  inviterName,
  token,
  expiresInDays,
}: SendInvitationEmailArgs) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${token}`;
  const roleLabel = role === 'ADMIN' ? 'Workspace Admin' : 'Workspace Member';

  const smtp = getSmtpConfig();

  // If SMTP is NOT configured
  if (!smtp) {
    // In production, missing SMTP configuration is a critical error
    if (process.env.NODE_ENV === 'production') {
      const errorMsg = 'SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM) are missing in production.';
      console.error(`[Email Error] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // In development/test environment, fallback to console mock logger
    const emailSubject = `Invitation to join ${workspaceName} on TeamFlow`;
    const emailBody = `
==================================================
MOCK INVITATION EMAIL
==================================================
To: ${email}
Subject: ${emailSubject}
Workspace: ${workspaceName}
Invited By: ${inviterName}
Role: ${roleLabel}
Expiration: ${expiresInDays} days

Invitation URL:
${inviteUrl}
==================================================
`;

    // 1. Log directly to console
    console.log(emailBody);

    // 2. Append to a persistent log file in scratch directory
    try {
      const scratchDir = '/Users/codeclouds-rajib/.gemini/antigravity-ide/brain/6fc21c24-20e4-4965-abac-684491f3d8de/scratch';
      if (fs.existsSync(scratchDir)) {
        const logPath = path.join(scratchDir, 'invitation-emails.log');
        const timestamp = new Date().toISOString();
        const fileContent = `[${timestamp}]\n${emailBody}\n\n`;
        fs.appendFileSync(logPath, fileContent, 'utf8');
      }
    } catch (err) {
      console.error('[Email Mock] Failed to write to scratch email log file', err);
    }

    return;
  }

  // If SMTP IS configured, send the real email via Nodemailer
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465, // True for port 465, false for other ports (like 587)
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const htmlContent = renderInvitationHtml(
      email,
      roleLabel,
      workspaceName,
      inviterName,
      inviteUrl,
      expiresInDays
    );

    const info = await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: `Join ${workspaceName} on TeamFlow`,
      text: `You have been invited to join ${workspaceName} on TeamFlow.\n\nInvited By: ${inviterName}\nRole: ${roleLabel}\nExpires In: ${expiresInDays} days\n\nAccept Invitation: ${inviteUrl}`,
      html: htmlContent,
    });

    console.log(`[Email Sent] Invitation successfully delivered to ${email}. MessageId: ${info.messageId}`);
  } catch (error: any) {
    // Log the error server-side for debugging, but NEVER log SMTP credentials or passwords
    console.error('[SMTP Send Error] Failed to send real invitation email via SMTP.', {
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      errorMessage: error.message || 'Unknown error',
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      command: error.command,
      name: error.name,
    });

    // Throw a clean, user-friendly error to prevent database leaks or exposing server config
    throw new Error('Unable to send the invitation email. Please try again.');
  }
}
