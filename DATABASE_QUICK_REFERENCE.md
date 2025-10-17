# 📊 Database Quick Reference

## 🗂️ All Tables (16 Total)

### Core Application Tables
```sql
users              -- User profiles, preferences, subscriptions
wallets            -- User's blockchain wallets  
portfolio_history  -- Historical portfolio values (for charts)
whales             -- Featured/custom whale wallets
token_watchlist    -- User's tracked tokens
announcements      -- System-wide announcements
```

### Support & Admin Tables
```sql
support_tickets    -- Customer support tickets
ticket_replies     -- Support conversation threads
roles              -- Admin role permissions
settings           -- Global application settings
system_events      -- System health monitoring logs
admin_logs         -- Audit trail for admin actions
```

### Future Feature Tables
```sql
whale_segments     -- Grouped whale portfolios
content_articles   -- CMS for blog/educational content
experiments        -- A/B testing and feature flags
automation_rules   -- Automated workflows
```

---

## 🔑 Quick Queries

### User Management
```sql
-- Get user profile
SELECT * FROM users WHERE id = auth.uid();

-- Update user preferences
UPDATE users 
SET preferences = jsonb_set(preferences, '{theme}', '"dark"')
WHERE id = auth.uid();

-- Upgrade to Pro
SELECT upgrade_user_plan();
```

### Wallet Operations
```sql
-- Get user's wallets
SELECT * FROM wallets WHERE user_id = auth.uid();

-- Add wallet
INSERT INTO wallets (user_id, address, blockchain, nickname)
VALUES (auth.uid(), '0x...', 'ethereum', 'My Wallet');

-- Delete wallet
DELETE FROM wallets WHERE id = ? AND user_id = auth.uid();
```

### Portfolio History
```sql
-- Get last 90 days of portfolio history
SELECT timestamp, value 
FROM portfolio_history 
WHERE user_id = auth.uid() 
  AND timestamp > NOW() - INTERVAL '90 days'
ORDER BY timestamp ASC;

-- Add new data point
INSERT INTO portfolio_history (user_id, value)
VALUES (auth.uid(), 10000.50);
```

### Whale Tracking
```sql
-- Get all featured whales
SELECT * FROM whales WHERE is_featured = true;

-- Get custom whales (admin only)
SELECT * FROM whales WHERE is_custom = true;

-- Add custom whale (admin only)
INSERT INTO whales (name, address, blockchain, description, is_custom)
VALUES ('New Whale', '0x...', 'ethereum', 'Description', true);
```

### Token Watchlist
```sql
-- Get user's watchlist
SELECT * FROM token_watchlist WHERE user_id = auth.uid();

-- Add to watchlist
INSERT INTO token_watchlist (user_id, coingecko_id, symbol)
VALUES (auth.uid(), 'bitcoin', 'BTC');

-- Remove from watchlist
DELETE FROM token_watchlist 
WHERE user_id = auth.uid() AND coingecko_id = 'bitcoin';
```

### Support Tickets
```sql
-- Get user's tickets
SELECT * FROM support_tickets 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;

-- Create ticket
INSERT INTO support_tickets (user_id, user_name, user_email, subject, message, priority)
VALUES (auth.uid(), 'John Doe', 'john@example.com', 'Issue', 'Description', 'Medium');

-- Update ticket status (support agents only)
UPDATE support_tickets 
SET status = 'In Progress' 
WHERE id = ?;
```

### Admin Queries
```sql
-- Get user statistics
SELECT * FROM get_user_statistics();

-- Get recent admin actions
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50;

-- Get system health
SELECT * FROM system_events 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Get all active users
SELECT id, email, name, plan, role 
FROM users 
WHERE status = 'Active' 
ORDER BY created_at DESC;
```

---

## 🔐 Row Level Security

### Who Can Access What?

| Table | Owner | Admin | Support | Public |
|-------|-------|-------|---------|--------|
| users | R/W own | R/W all | R all | - |
| wallets | R/W own | - | - | - |
| portfolio_history | R/W own | - | - | - |
| whales (featured) | R | R/W | R | R |
| whales (custom) | - | R/W | - | - |
| token_watchlist | R/W own | - | - | - |
| announcements (active) | R | R/W | R | R |
| support_tickets | R/W own | R/W | R/W | - |
| ticket_replies | R/W own | R/W | R/W | - |
| roles | R | R/W | R | - |
| settings | R | R/W | R | - |
| system_events | - | R | - | - |
| admin_logs | - | R | - | - |
| content_articles (published) | R | R/W | R | R |
| experiments | - | R/W | - | - |
| automation_rules | - | R/W | - | - |

**Legend**: R = Read, W = Write, - = No Access

---

## 🎯 Common Patterns

### Check User Plan
```sql
SELECT plan FROM users WHERE id = auth.uid();
-- Returns: 'Free' or 'Pro'
```

### Check User Role
```sql
SELECT role FROM users WHERE id = auth.uid();
-- Returns: 'Customer', 'Administrator', 'Content Editor', or 'Support Agent'
```

### Get User's Total Portfolio Value
```sql
SELECT value 
FROM portfolio_history 
WHERE user_id = auth.uid() 
ORDER BY timestamp DESC 
LIMIT 1;
```

### Count User's Wallets
```sql
SELECT COUNT(*) 
FROM wallets 
WHERE user_id = auth.uid();
```

### Get Unread Support Tickets (Admin)
```sql
SELECT COUNT(*) 
FROM support_tickets 
WHERE status IN ('Open', 'In Progress');
```

---

## 🛠️ RPC Functions

### upgrade_user_plan()
Upgrades current user to Pro plan.
```sql
SELECT upgrade_user_plan();
```

### refresh_whale_portfolio(whale_id UUID)
Refreshes whale portfolio data (admin only).
```sql
SELECT refresh_whale_portfolio('uuid-here');
```

### clean_old_portfolio_history()
Deletes portfolio history older than 90 days.
```sql
SELECT clean_old_portfolio_history();
```

### get_user_statistics()
Returns user statistics for admin dashboard.
```sql
SELECT * FROM get_user_statistics();
-- Returns: total_users, active_users, pro_users, free_users, suspended_users
```

---

## 📦 Storage Buckets

### avatars
User profile pictures
- **Public**: Yes (read only)
- **Upload**: Authenticated users only
- **Path**: `avatars/{user_id}/avatar.{ext}`

```javascript
// Upload avatar
await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, { upsert: true });

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

---

## ⚡ Performance Tips

1. **Use Indexes**: All common queries are indexed
2. **Limit Results**: Always use `LIMIT` for lists
3. **Filter Early**: Use `WHERE` before `ORDER BY`
4. **Select Specific Columns**: Avoid `SELECT *`
5. **Use Pagination**: Fetch data in chunks

```sql
-- ✅ Good
SELECT id, email, name 
FROM users 
WHERE status = 'Active' 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 0;

-- ❌ Bad
SELECT * FROM users ORDER BY created_at DESC;
```

---

## 🔍 Debugging

### Check if RLS is blocking a query
```sql
-- Temporarily disable RLS for testing (NOT IN PRODUCTION!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### View policies for a table
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Check current user
```sql
SELECT auth.uid(); -- Current authenticated user ID
SELECT auth.role(); -- Current user's role
```

---

## 🎨 Settings Reference

All settings are stored in the `settings` table as JSONB:

| Key | Default Value | Description |
|-----|---------------|-------------|
| appName | "Nexus" | Application name |
| themeColors | {...} | Brand colors (primary, secondary, etc.) |
| maintenanceMode | false | Enable maintenance mode |
| signupEnabled | true | Allow new user registrations |
| maxFreeWallets | 3 | Max wallets for free users |
| maxProWallets | 25 | Max wallets for pro users |
| schemaVersion | "1.0.0" | Database schema version |

### Update a setting (admin only)
```sql
UPDATE settings 
SET value = '"NewAppName"'::jsonb 
WHERE id = 'appName';
```

---

## 📊 Role Permissions

### Administrator
Full access to everything

### Content Editor
- User Management: view
- Content: view, create, edit, delete
- Announcements: view, create, edit
- Analytics: view

### Support Agent
- User Management: view
- Support: view, respond
- Transactions: view

---

**Quick Access**: Keep this file bookmarked for fast reference during development!
