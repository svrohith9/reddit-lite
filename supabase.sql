create extension if not exists "uuid-ossp";

create table if not exists sub_forums (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid,
  created_at timestamp with time zone default now()
);

create table if not exists posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text,
  user_id uuid,
  user_email text,
  subforum_id uuid references sub_forums(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table posts add column if not exists subforum_id uuid references sub_forums(id) on delete cascade;
alter table posts add column if not exists updated_at timestamp with time zone default now();

create table if not exists comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  body text not null,
  user_id uuid,
  user_email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists comment_history (
  id uuid default uuid_generate_v4() primary key,
  comment_id uuid not null,
  body text not null,
  action text not null, -- update or delete
  changed_at timestamp with time zone default now(),
  user_id uuid,
  user_email text
);

-- Enable RLS and add permissive policies for anon reads/inserts
alter table posts enable row level security;
alter table comments enable row level security;
alter table sub_forums enable row level security;
alter table comment_history enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where policyname = 'Public insert posts') then
    drop policy "Public insert posts" on posts;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Public insert comments') then
    drop policy "Public insert comments" on comments;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Public read posts') then
    drop policy "Public read posts" on posts;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated insert posts') then
    create policy "Authenticated insert posts" on posts for insert with check (auth.uid() = user_id and subforum_id is not null);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated update posts') then
    create policy "Authenticated update posts" on posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated delete posts') then
    create policy "Authenticated delete posts" on posts for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated read posts') then
    create policy "Authenticated read posts" on posts for select using (auth.role() = 'authenticated');
  end if;
  if exists (select 1 from pg_policies where policyname = 'Public read comments') then
    drop policy "Public read comments" on comments;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated insert comments') then
    create policy "Authenticated insert comments" on comments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated update comments') then
    create policy "Authenticated update comments" on comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated delete comments') then
    create policy "Authenticated delete comments" on comments for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated read comments') then
    create policy "Authenticated read comments" on comments for select using (auth.role() = 'authenticated');
  end if;
  if exists (select 1 from pg_policies where policyname = 'Public read subforums') then
    drop policy "Public read subforums" on sub_forums;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated read subforums') then
    create policy "Authenticated read subforums" on sub_forums for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated insert subforums') then
    create policy "Authenticated insert subforums" on sub_forums for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated read comment_history') then
    create policy "Authenticated read comment_history" on comment_history for select using (auth.role() = 'authenticated');
  end if;
end $$;

create index if not exists comments_post_id_idx on comments(post_id);
create index if not exists posts_subforum_id_idx on posts(subforum_id);

create or replace function set_updated_at_posts()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function set_updated_at_comments()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_comment_history()
returns trigger as $$
begin
  insert into comment_history (comment_id, body, action, user_id, user_email, changed_at)
  values (coalesce(old.id, new.id), coalesce(old.body, new.body), tg_op = 'DELETE'::text ? 'delete' : 'update', coalesce(old.user_id, new.user_id), coalesce(old.user_email, new.user_email), now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at before update on posts for each row execute function set_updated_at_posts();

drop trigger if exists trg_comments_updated_at on comments;
create trigger trg_comments_updated_at before update on comments for each row execute function set_updated_at_comments();

drop trigger if exists trg_comments_history on comments;
create trigger trg_comments_history before update or delete on comments
for each row execute function log_comment_history();
