-- Add push_token column to profiles for Expo push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Only service role can read other users' push tokens
-- (RLS already restricts profile reads to the owner; this is a reminder note)
-- Service-role-only reads are enforced in the Edge Function using SUPABASE_SERVICE_ROLE_KEY
