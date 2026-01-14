import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, description } = body;

    if (!email || !name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Email notification to yashkamal.bhatia@slu.edu
    const notificationEmail = {
      to: 'yashkamal.bhatia@slu.edu',
      subject: 'New Instructor Signup Request',
      html: `
        <h2>New Instructor Signup Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `,
      text: `
        New Instructor Signup Request
        
        Name: ${name}
        Email: ${email}
        Description: ${description}
        Timestamp: ${new Date().toLocaleString()}
      `,
    };

    // Try to send email using configured service
    let emailSent = false;
    let errorMessage = '';

    // Option 1: Use Resend (recommended - easy setup at resend.com)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    // Debug logging for environment variables
    console.log('🔍 Environment check:');
    console.log('  RESEND_API_KEY:', RESEND_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('  RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Not set');
    console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');

    if (RESEND_API_KEY) {
      try {
        // Resend email configuration:
        // Option 1: Use Resend's test email (no verification needed) - onboarding@resend.dev
        // Option 2: Use your verified domain - <anything>@<your-domain-id>.resend.app
        // Option 3: Use a custom verified domain
        //
        // To verify a domain:
        // 1. Go to Resend Dashboard → Domains
        // 2. Add and verify your domain
        // 3. Use format: noreply@your-verified-domain.com
        //
        // Set RESEND_FROM_EMAIL in .env.local to override this
        // For testing: RESEND_FROM_EMAIL=onboarding@resend.dev
        // For production: RESEND_FROM_EMAIL=noreply@your-verified-domain.com
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        console.log('📧 Attempting to send email via Resend...');
        console.log('From:', fromEmail);
        console.log('To:', notificationEmail.to);

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: notificationEmail.to,
            subject: notificationEmail.subject,
            html: notificationEmail.html,
          }),
        });

        const responseData = await resendResponse.json();

        if (resendResponse.ok) {
          emailSent = true;
          console.log('✅ Email sent successfully via Resend');
          console.log('Response:', responseData);
        } else {
          errorMessage = responseData.message || JSON.stringify(responseData);
          console.error('❌ Resend API error:', responseData);
          // Log helpful error message
          if (
            responseData.message?.includes('domain') ||
            responseData.message?.includes('from') ||
            responseData.message?.includes('verified')
          ) {
            console.error('💡 Tip: Domain verification issue detected.');
            console.error(
              '   Option 1 (Testing): Use onboarding@resend.dev (no verification needed)',
            );
            console.error(
              '   Option 2 (Production): Verify your domain at https://resend.com/domains',
            );
            console.error('   Set RESEND_FROM_EMAIL in .env.local to override the default');
          }
        }
      } catch (resendError: any) {
        errorMessage = resendError.message || 'Unknown error';
        console.error('Error sending via Resend:', resendError);
      }
    }

    // Option 2: Use SendGrid (if Resend is not configured)
    if (!emailSent) {
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      if (SENDGRID_API_KEY) {
        try {
          const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: notificationEmail.to }] }],
              from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com' },
              subject: notificationEmail.subject,
              content: [
                { type: 'text/plain', value: notificationEmail.text },
                { type: 'text/html', value: notificationEmail.html },
              ],
            }),
          });

          if (sendgridResponse.ok) {
            emailSent = true;
          } else {
            const errorText = await sendgridResponse.text();
            errorMessage = errorText;
            console.error('SendGrid API error:', errorText);
          }
        } catch (sendgridError: any) {
          errorMessage = sendgridError.message || 'Unknown error';
          console.error('Error sending via SendGrid:', sendgridError);
        }
      }
    }

    // Log the notification (always log for debugging, even if email service is configured)
    console.log('Instructor signup notification:', {
      to: notificationEmail.to,
      subject: notificationEmail.subject,
      name,
      email,
      description,
      emailSent,
      errorMessage,
    });

    // If no email service is configured, log a warning
    if (!emailSent && !RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
      const warning =
        'No email service configured. Please set RESEND_API_KEY or SENDGRID_API_KEY environment variable.';
      console.warn(warning);
      return NextResponse.json(
        {
          success: false,
          message: warning,
          error: 'Email service not configured',
        },
        { status: 500 },
      );
    }

    if (emailSent) {
      return NextResponse.json(
        { success: true, message: 'Notification sent successfully' },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send notification',
          error: errorMessage || 'Unknown error',
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Error sending instructor notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
      },
      { status: 500 },
    );
  }
}
