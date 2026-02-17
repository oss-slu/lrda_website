# Email Verification Setup

## Overview

Email verification has been configured for new account signups using better-auth's built-in email verification feature.

## Flow

```
Sign Up → Verification Email Sent → User Clicks Link → verify-email Page → Login
```

### Detailed Steps:

1. **User Signs Up** (`/signup`)
   - User creates account with email and password
   - `signup()` function called via `authStore`
   - Verification email is automatically sent by better-auth
   - User is redirected to `/confirm` page

2. **Confirmation Page** (`/confirm`)
   - Shows user their email address
   - Explains verification steps
   - Instructs user to check their email
   - Has link to go to login page
   - In development: server console shows verification URL

3. **User Clicks Verification Link**
   - Email contains link like: `http://localhost:3000/verify-email?token=xxx`
   - Opens the verify-email page with token in URL

4. **Verify Email Page** (`/verify-email`)
   - Reads token from URL search params
   - Calls `authClient.verifyEmail(token)`
   - On success: shows success message and redirects to `/login` after 2 seconds
   - On error: shows error message with option to try again

5. **Login**
   - User can now log in with their verified email

## Files Modified

### API Setup

- **`apps/api/src/auth.ts`**
  - Added `emailVerification` config block
  - Configured `sendVerificationEmail` callback
  - In development, logs verification URL to console
  - In production, replace with real email service (SendGrid, Resend, etc.)

### Frontend - Auth Client

- **`packages/web/app/lib/auth/client.ts`**
  - Added `verifyEmail(token)` function
  - Wraps better-auth's `verifyEmail` method

### Frontend - Pages

- **`packages/web/app/verify-email/page.tsx`** (Refactored)
  - Now follows reset-password pattern
  - Reads token from URL search params
  - Displays loading/success/error states
  - Uses shadcn/ui components (Card, Button, Label)
  - Automatically redirects to login on success

- **`packages/web/app/confirm/page.tsx`** (Updated)
  - Simplified to show verification instructions
  - Shows the email address verification was sent to
  - Displays next steps and development mode instructions
  - Link to login page

- **`packages/web/app/signup/page.tsx`** (Updated)
  - Changed success toast message to mention email check
  - Redirects to `/confirm` page after account creation

## Testing in Development

### Local Testing Steps:

1. Start the server with `pnpm dev` (both API and web)
2. Go to `/signup` and create a new account
3. You'll see the `/confirm` page
4. Check the **server console** for the verification URL line:
   ```
   ✓ Verification email sent to user@example.com
   Verification URL: http://localhost:3000/verify-email?token=xxx
   ```
5. Copy that URL into your browser (or click it if console supports it)
6. You should see the verify-email page with a "Verify email" button
7. Click the button to verify
8. You'll be redirected to login after 2 seconds
9. Now you can log in with the verified email

## Production Setup

To use real email sending in production:

1. **Choose an Email Service**: Resend, SendGrid, Mailgun, AWS SES, etc.

2. **Update `apps/api/src/auth.ts`**:

   ```typescript
   emailVerification: {
     sendVerificationEmail: async (data) => {
       // Example with Resend
       await resend.emails.send({
         from: 'noreply@yourdomain.com',
         to: data.user.email,
         subject: 'Verify your email',
         html: `<a href="${data.url}">Click here to verify your email</a>`,
       });
     },
   },
   ```

3. **Update Environment Variables**:
   - Add API keys for your email service to `.env.local`

## Error Handling

- **Invalid Token**: User sees "Invalid or missing verification token."
- **Expired Token**: User sees "Email verification failed. Token may be expired."
- **Network Error**: User sees "Email verification failed. Token may be expired."

All errors allow user to go back or try again.

## Related Features

- **Password Reset**: Similar flow in `/reset-password` for comparison
- **Forgot Password**: Users can request password reset via `/forgot-password`
- **Session Management**: Uses better-auth's session handling

## Future Enhancements

1. Add "Resend Email" button to verification page
2. Add email verification requirement enforcement (block login if unverified)
3. Add resend verification email endpoint
4. Add verification timeout/expiration tracking
5. Add rate limiting for verification attempts
