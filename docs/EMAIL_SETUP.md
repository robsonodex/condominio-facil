# Email System - Configuration & Testing Guide

## SMTP Configuration

### Required Environment Variables

Add these to your `.env.local` file (local development) and Vercel Dashboard (production):

```env
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASS=your_email_password_here
SMTP_FROM="Condomínio Fácil <noreply@meucondominiofacil.com>"
```

### Vercel Production Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Set scope to **Production, Preview, Development**
6. Click **Save**
7. Redeploy the application

## Testing Locally

### 1. Test Email API

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run:
node test-email-api.js
```

**Change the email** in `test-email-api.js` to your real email to verify delivery.

### 2. Test Registration Flow

1. Open browser: `http://localhost:3000/register`
2. Fill form with:
   - Name: "Your Name"
   - Email: "your-real-email@gmail.com"
   - Password: "Test123!"
3. Submit and check:
   - Console logs for "E-mail de boas-vindas enviado"
   - Your email inbox for welcome message
   - Supabase `email_logs` table for new entry

### 3. Verify Database Logs

Check `email_logs` table in Supabase:
```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

Expected columns:
- `tipo`: 'welcome'
- `destinatario`: your email
- `status`: 'enviado' (if SMTP configured) or 'pendente' (if not)
- `erro`: null (if success) or error message

## Email Templates

### Welcome Email (Enhanced)
- ✅ Modern HTML design with gradient header
- ✅ Clear CTA button
- ✅ Next steps guide
- ✅ Feature highlights
- ✅ Support information
- ✅ Mobile responsive

### Other Templates Available
- `trial_ending`: Sent X days before trial expires
- `invoice`: New invoice available
- `overdue`: Payment overdue warning
- `blocked`: Account blocked notification
- `payment_confirmed`: Payment received confirmation
- `support_*`: Support ticket emails
- `legal_acceptance_confirmed`: Legal docs accepted

## Manual Resend API

If email delivery fails, use the resend API:

```bash
POST /api/email/resend
Content-Type: application/json

{
  "userId": "user-uuid-from-supabase",
  "tipo": "welcome"
}
```

**Requirements:**
- Must be authenticated
- User must have role `superadmin` or `sindico`
- Síndico can only resend to users in their condo

## Troubleshooting

### Email not sending (status='pendente')

**Cause:** SMTP not configured  
**Fix:** Add SMTP_* variables to .env.local

### Email fails after 3 attempts

**Cause:** Invalid SMTP credentials or connection issues  
**Fix:**
1. Verify SMTP credentials are correct
2. Check if Hostinger email account is active
3. Try different SMTP port (587 instead of 465)
4. Check firewall/antivirus blocking outbound SMTP

### Emails sent but not received

**Cause:** Spam filter or wrong FROM address  
**Fix:**
1. Check spam/junk folder
2. Verify SMTP_FROM matches SMTP_USER domain
3. Add your domain to email whitelist

### Permission denied when sending

**Cause:** Auth required for non-welcome templates  
**Fix:** Include `internalCall: true` for internal API calls

## Production Checklist

Before deploying to production:

- [ ] SMTP variables configured in Vercel
- [ ] Test email sent successfully in local
- [ ] Database `email_logs` table exists
- [ ] Welcome email renders correctly in Gmail/Outlook
- [ ] All links in email work correctly
- [ ] Unsubscribe links functional (if applicable)

## Monitoring

### Check Email Delivery Rate

```sql
-- Success rate in last 24 hours
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Failed Emails

```sql
-- Recent failures
SELECT destinatario, tipo, erro, created_at
FROM email_logs
WHERE status = 'falhou'
ORDER BY created_at DESC
LIMIT 20;
```

## Next Steps

After email system is working:

1. Set up automated trial ending emails (pg_cron jobs)
2. Implement email preferences (user can opt-out)
3. Add email templates for more events
4. Monitor delivery rates and adjust as needed
