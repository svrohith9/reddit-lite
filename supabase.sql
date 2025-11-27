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
