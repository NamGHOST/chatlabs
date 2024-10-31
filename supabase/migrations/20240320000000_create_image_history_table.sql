create table public.image_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  timestamp bigint not null,
  prompt text not null,
  params jsonb not null,
  storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.image_history enable row level security;

create policy "Users can insert their own images"
  on public.image_history for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own images"
  on public.image_history for select
  using (auth.uid() = user_id);

create policy "Users can delete their own images"
  on public.image_history for delete
  using (auth.uid() = user_id);

-- Add indexes for better query performance
create index idx_image_history_user_id on public.image_history(user_id);
create index idx_image_history_timestamp on public.image_history(timestamp desc);

-- Add after creating the table
CREATE UNIQUE INDEX idx_unique_user_image 
ON public.image_history(user_id, timestamp);