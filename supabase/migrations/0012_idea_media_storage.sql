-- Migration 0012: idea-media storage bucket
-- Bucket used by the rich text editor for inline image uploads
-- (see src/app/api/upload/route.ts).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'idea-media',
  'idea-media',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Images are served from a public bucket so they render in shared links.
DROP POLICY IF EXISTS "Public can read idea media" ON storage.objects;
CREATE POLICY "Public can read idea media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'idea-media');

-- Uploads are namespaced as <auth uid>/<file> so users only write their own folder.
DROP POLICY IF EXISTS "Users can upload idea media" ON storage.objects;
CREATE POLICY "Users can upload idea media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'idea-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own idea media" ON storage.objects;
CREATE POLICY "Users can delete own idea media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'idea-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
