-- =====================================================
-- FIX WALLETS TABLE - Ensure blockchain constraint matches code
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'wallets'::regclass AND conname = 'wallets_blockchain_check';

-- Drop the old constraint if it exists
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_blockchain_check;

-- Add the correct constraint with all supported blockchains
ALTER TABLE wallets ADD CONSTRAINT wallets_blockchain_check 
    CHECK (blockchain IN ('ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'wallets'::regclass AND conname = 'wallets_blockchain_check';

-- Check if there are any existing wallets with invalid blockchain values
SELECT DISTINCT blockchain 
FROM wallets 
WHERE blockchain NOT IN ('ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base');
