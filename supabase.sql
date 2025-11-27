create extension if not exists "uuid-ossp";

create table if not exists posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text,
  created_at timestamp with time zone default now()
);

create table if not exists comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS and add permissive policies for anon reads/inserts
alter table posts enable row level security;
alter table comments enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public read posts') then
    create policy "Public read posts" on posts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Public insert posts') then
    create policy "Public insert posts" on posts for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Public read comments') then
    create policy "Public read comments" on comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Public insert comments') then
    create policy "Public insert comments" on comments for insert with check (true);
  end if;
end $$;
