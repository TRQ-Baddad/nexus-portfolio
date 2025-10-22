# Supabase Database Deployment Guide

## 📋 Overview
This guide explains how to set up your Supabase database in the correct order.

---

## 🚀 Deployment Steps

### **Step 1: Deploy Main Schema** (Required)
**File:** `supabase/schema.sql`

This is the **complete database schema** with all tables, indexes, RLS policies, and functions.

```sql
-- Run this FIRST in Supabase SQL Editor
-- Time: ~5-10 seconds
```

**What it includes:**
- ✅ All core tables (users, wallets, whales, support_tickets, etc.)
- ✅ All indexes for performance
- ✅ RLS policies for security
- ✅ Database functions (RPC)
- ✅ Triggers for auto-updating timestamps
- ✅ Default roles and settings
- ✅ Storage bucket for avatars
- ✅ Sample featured whales

---

### **Step 2: Token Price Cache** (Required for CoinGecko proxy)
**File:** `supabase/migrations/create-token-price-cache.sql`

Creates a cache table for the `fetch-token-prices` Edge Function.

```sql
-- Run this AFTER schema.sql
-- Time: ~1-2 seconds
```

**What it includes:**
- ✅ `token_price_cache` table with RLS
- ✅ Indexes for fast queries
- ✅ Cleanup function (manual or cron)
- ✅ Security policies (public read, service write)

---

### **Step 3: Avatar Storage Policies** (Optional - if avatars not working)
**File:** `supabase/setup-avatar-storage.sql`

**Only run this if:**
- Avatar uploads are failing
- You need to reset storage policies
- Schema.sql storage policies have conflicts

```sql
-- Run this ONLY if needed
-- Time: ~1 second
```

**What it does:**
- ✅ Drops conflicting policies from schema.sql
- ✅ Creates fresh avatar storage policies
- ✅ Uses 'avatars' bucket with user-specific folders

---

### **Step 4: Admin Dashboard Setup** (If using admin dashboard)
**File:** `admin-dashboard-fix.sql`

**Before running:**
1. Replace `'your-email@example.com'` with YOUR email (line 183 & 188)
2. Make sure you've signed up in the app

```sql
-- Run this to enable admin access
-- Time: ~2-3 seconds
```

**What it includes:**
- ✅ View aliases (automations, articles, logs)
- ✅ Service keys setup
- ✅ Admin RPC functions
- ✅ Sets your account as Administrator

---

## ⚠️ Scripts You Can IGNORE

### ❌ `fix-wallets-constraint.sql`
**Status:** Already included in `schema.sql`  
**Reason:** The main schema has the correct blockchain constraints

### ❌ `admin-logs-column-fix.sql`
**Status:** Already handled  
**Reason:** The `target_user_id` column is properly managed

### ❌ `service-keys-complete-fix.sql`
**Status:** Merged into `admin-dashboard-fix.sql`  
**Reason:** Duplicate functionality - use `admin-dashboard-fix.sql` instead

---

## 🔑 Post-Deployment Checklist

### **1. Verify Tables Created**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables: users, wallets, whales, support_tickets, token_price_cache, etc.

---

### **2. Verify Your Admin Access**
```sql
SELECT id, email, role, plan, status 
FROM users 
WHERE email = 'your-email@example.com';
```

Expected: `role = 'Administrator'`, `plan = 'Pro'`

---

### **3. Verify Storage Bucket**
Go to: **Supabase Dashboard → Storage**

Expected: `avatars` bucket (public)

---

### **4. Test Avatar Upload**
1. Go to Admin Dashboard → Settings → My Account
2. Upload a profile picture
3. Should succeed without errors

---

### **5. Deploy Edge Functions**
```bash
cd d:\Apps\Nexus\nexus-portfolio

supabase functions deploy fetch-token-prices
supabase functions deploy generate-ai-insights
supabase functions deploy generate-morning-brief
supabase functions deploy generate-community-feed
```

---

## 🛠️ Common Issues & Fixes

### **Issue: Avatar upload fails**
**Fix:** Run `setup-avatar-storage.sql` to reset policies

### **Issue: Token prices not caching**
**Fix:** Verify `token_price_cache` table exists and has RLS policies

### **Issue: Admin dashboard shows "No permission"**
**Fix:** 
1. Check your `role` in users table
2. Re-run admin-dashboard-fix.sql with correct email
3. Clear browser cache and re-login

### **Issue: Duplicate policy errors**
**Fix:** The scripts use `DROP POLICY IF EXISTS` to handle conflicts automatically

---

## 📝 Summary

**Minimum Required:**
1. `schema.sql` (complete database)
2. `create-token-price-cache.sql` (for CoinGecko proxy)

**Optional:**
3. `setup-avatar-storage.sql` (if avatars fail)
4. `admin-dashboard-fix.sql` (for admin access)

**Total deployment time:** ~10-15 seconds

---

## ✅ Database is Ready!

After running these scripts:
- ✅ All tables created with proper indexes
- ✅ RLS enabled for security
- ✅ Admin access configured
- ✅ Storage buckets ready
- ✅ Cache tables operational

**Next:** Deploy Edge Functions and test the app! 🚀
