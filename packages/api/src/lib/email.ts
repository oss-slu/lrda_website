import { Resend } from 'resend';
import { env } from '../env';

const isDev = env.ENVIRONMENT === 'development';

const resend = !isDev && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * In dev mode, store the last email URL so e2e tests can retrieve
 * verification/reset tokens without parsing server logs.
 */
export let lastDevEmailUrl: string | null = null;

/** Dev-mode email URLs keyed by `${recipient}::${type}` for e2e retrieval by type. */
const devEmailUrls = new Map<string, string>();

export function getDevEmailUrl(to: string, type: string): string | null {
  return devEmailUrls.get(`${to}::${type}`) ?? null;
}

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Logged in dev mode so developers can click the link */
  url?: string;
  /** Email category, lets e2e tests fetch the right URL by recipient + type */
  type?: 'verification' | 'reset-password';
}

async function sendEmail({ to, subject, text, url, type }: SendEmailParams): Promise<void> {
  if (isDev) {
    console.log('[email] (dev mode -- not sent)', JSON.stringify({ to, subject, url }));
    if (url) {
      lastDevEmailUrl = url;
      if (type) devEmailUrls.set(`${to}::${type}`, url);
    }
    return;
  }

  if (!resend) {
    console.error(
      '[email] Resend not initialized -- RESEND_API_KEY is missing',
      JSON.stringify({ to, subject }),
    );
    throw new Error('Email service not configured: RESEND_API_KEY is missing');
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
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

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Verify your Where's Religion? account",
    url: verificationUrl,
    type: 'verification',
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
  await sendEmail({
    to,
    subject: "Reset your Where's Religion? password",
    url: resetUrl,
    type: 'reset-password',
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
