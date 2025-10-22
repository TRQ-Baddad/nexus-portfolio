-- =====================================================
-- Setup Avatar Storage Bucket
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create public storage bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatar uploads
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'public' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name) LIKE auth.uid()::text || '%')
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'public' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name) LIKE auth.uid()::text || '%')
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'public' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name) LIKE auth.uid()::text || '%')
);
