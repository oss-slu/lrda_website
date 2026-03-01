import { Resend } from 'resend';
import { env } from '../env';
import { logger } from './logger';

const isDev = env.NODE_ENV !== 'production';

const resend = !isDev && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Logged in dev mode so developers can click the link */
  url?: string;
}

async function sendEmail({ to, subject, text, url }: SendEmailParams): Promise<void> {
  if (isDev) {
    logger.info({ to, subject, url }, 'Email (dev mode -- not sent)');
    return;
  }

  if (!resend) {
    logger.error({ to, subject }, 'Resend not initialized -- RESEND_API_KEY is missing');
    throw new Error('Email service not configured: RESEND_API_KEY is missing');
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
  });

  if (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    throw new Error(`Failed to send email: ${error.message}`);
  }

  logger.info({ to, subject }, 'Email sent');
}

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  await sendEmail({
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
  await sendEmail({
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
