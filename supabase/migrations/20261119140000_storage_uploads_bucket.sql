-- Bucket público para UriProva, KYC e anexos (upload via presigned URL na edge).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uritech-uploads',
  'uritech-uploads',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;