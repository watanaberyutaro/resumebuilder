-- Create storage buckets for resume photos
-- Run this migration to create the required storage buckets

-- Create resume-photos bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-photos', 'resume-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for resume-photos bucket

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resume-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resume-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resume-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all photos (since bucket is public)
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume-photos');
