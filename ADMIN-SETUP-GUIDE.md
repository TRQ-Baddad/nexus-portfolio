# 🔧 Admin Dashboard Setup Guide

## Step 1: Run the Database Fix SQL

1. Open **Supabase Dashboard** → SQL Editor
2. Copy and paste the entire contents of `admin-dashboard-fix.sql`
3. **IMPORTANT**: Change the email in the last section to match your account:
   ```sql
   WHERE email = 'vfx.tariq@gmail.com'  -- Change this to your email!
   ```
4. Click **RUN**
5. Verify the output shows your user with `role = 'Administrator'`

---

## Step 2: Set Environment Variables in Supabase

Go to **Supabase Dashboard** → **Edge Functions** → **Settings**

Add this environment variable:
- **Name**: `GEMINI_API_KEY`
- **Value**: Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

Click **Save**

---

## Step 3: Clear Browser Cache & Login

1. **Clear browser cache** or use **Incognito/Private mode**
2. Go to your app URL
3. **Sign in** with your email/password
4. Navigate to `/admin` route

You should now see the admin dashboard! ✅

---

## Step 4: Verify Everything Works

Check these admin dashboard pages:
- ✅ **Dashboard** - Should load without errors
- ✅ **Users** - Should show your user account
- ✅ **Whales** - Should show sample whales (BTC, ETH icons)
- ✅ **Announcements** - Should show the welcome message
- ✅ **Transactions** - Will be empty (normal - they're from blockchain APIs)
- ✅ **Analytics** - Should show user statistics

---

## Troubleshooting

### "Invalid credentials or unauthorized access"
- Run the SQL fix again
- Make sure your email in the SQL matches exactly
- Clear browser cache and try again

### "Column 'articles' does not exist"
- The SQL fix creates views for table aliases
- Make sure you ran the ENTIRE SQL script
- Check Supabase logs for errors

### Edge Functions returning 500
- Set `GEMINI_API_KEY` in Supabase Edge Functions settings
- The functions will work once the API key is configured
- Until then, AI features will show errors (this is expected)

### "Permission denied" errors
- Your user role must be 'Administrator'
- Verify with: `SELECT role FROM users WHERE email = 'your-email';`
- Should return 'Administrator'

---

## What The Admin Dashboard Can Do

### User Management
- View all users
- Change user roles (Administrator, Customer, Support Agent, Content Editor)
- Change user plans (Free, Pro)
- Change user status (Active, Suspended, Inactive)
- Impersonate users (view their account)

### Whale Management
- View whale wallets
- Add new whale addresses
- Mark whales as featured
- Edit whale metadata

### Content Management
- Create articles (future feature)
- Manage announcements
- Control experiments (A/B tests)

### Support
- View support tickets
- Reply to customer inquiries
- Track ticket status

### Analytics
- User statistics
- System health monitoring
- Activity logs
- Transaction monitoring (from blockchain)

### Settings
- Configure app name
- Set theme colors
- Manage feature flags
- Configure automation rules

---

## Next Steps

1. **Test the portfolio app** - Add a wallet and see if it works
2. **Deploy to Vercel** - Push your code and deploy the frontend
3. **Set up your API keys**:
   - Moralis API key (for EVM chains)
   - Helius API key (for Solana)
   - Gemini API key (for AI features)

---

## Need Help?

If you're still seeing errors after following this guide:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console (F12 → Console tab)
3. Verify all SQL was executed successfully
4. Make sure your user role is 'Administrator'
