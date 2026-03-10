import { Resend } from 'resend';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Logged in dev mode so developers can click the link */
  url?: string;
}

async function sendEmail(env: Env, { to, subject, text, url }: SendEmailParams): Promise<void> {
  const isDev = env.ENVIRONMENT !== 'production';

  if (isDev) {
    console.log('[email] (dev mode -- not sent)', JSON.stringify({ to, subject, url }));
    return;
  }

  if (!env.RESEND_API_KEY) {
    console.error('[email] Resend not initialized -- RESEND_API_KEY is missing', JSON.stringify({ to, subject }));
    throw new Error('Email service not configured: RESEND_API_KEY is missing');
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM || 'noreply@wheresreligion.org',
    to,
    subject,
    text,
  });

  if (error) {
    console.error('[email] Failed to send', JSON.stringify({ error, to, subject }));
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log('[email] Sent', JSON.stringify({ to, subject }));
}

// These wrappers are called by Better Auth callbacks which don't have access to env,
// so we store the env reference when the app initializes each request.
let _env: Env | null = null;

export function setEmailEnv(env: Env): void {
  _env = env;
}

function getEnv(): Env {
  if (!_env) throw new Error('Email env not initialized -- call setEmailEnv() first');
  return _env;
}

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  await sendEmail(getEnv(), {
    to,
    subject: "Verify your Where's Religion? account",
    url: verificationUrl,
    text: [
      "Welcome to Where's Religion!",
      '',
      'Please verify your email address by visiting the link below:',
      '',
      verificationUrl,
      '',
      'If you did not create an account, you can ignore this email.',
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail(getEnv(), {
    to,
    subject: "Reset your Where's Religion? password",
    url: resetUrl,
    text: [
      'A password reset was requested for your account.',
      '',
      'To reset your password, visit the link below:',
      '',
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
  });
}
