-- Update policies for the generated_images bucket
DROP POLICY IF EXISTS "Allow insert access to authenticated users for generated images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update access to authenticated users for generated images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete access to authenticated users for generated images" ON storage.objects;

-- Create new user-specific policies
CREATE POLICY "Allow insert access to own generated images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'generated_images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow update access to own generated images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'generated_images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow delete access to own generated images"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'generated_images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );