create table meetings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  participants jsonb not null,
  messages jsonb not null,
  status text check (status in ('active', 'completed', 'archived')) not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index meetings_user_id_idx on meetings(user_id);
create index meetings_created_at_idx on meetings(created_at);

-- Add trigger for updated_at
create trigger set_updated_at
  before update on meetings
  for each row
  execute function set_updated_at(); 