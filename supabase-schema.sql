-- Supabase schema for Real Estate MVP

-- Enums
create type public.user_role as enum ('public', 'agent', 'admin');
create type public.property_type as enum ('apartment', 'house', 'land', 'commercial');
create type public.property_status as enum ('pending', 'approved', 'rejected');
create type public.message_sender_role as enum ('user', 'agent');

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'public',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles RLS
create policy "Public profiles are viewable by authenticated users"
  on public.profiles
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  price numeric not null,
  property_type public.property_type not null,
  bedrooms integer,
  bathrooms integer,
  area_sqft integer,
  status public.property_status not null default 'pending',
  agent_id uuid not null references public.profiles (id) on delete cascade,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

-- Properties RLS
create policy "Public can view approved properties"
  on public.properties
  for select
  using (status = 'approved' or auth.role() in ('authenticated', 'service_role'));

create policy "Agents can insert their own properties"
  on public.properties
  for insert
  with check (agent_id = auth.uid());

create policy "Agents can update or delete their pending or rejected properties"
  on public.properties
  for update using (
    agent_id = auth.uid()
    and status in ('pending', 'rejected')
  )
  with check (
    agent_id = auth.uid()
    and status in ('pending', 'rejected')
  );

create policy "Admins can manage all properties"
  on public.properties
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Property images
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false
);

alter table public.property_images enable row level security;

create policy "Public can view images for approved properties"
  on public.property_images
  for select
  using (exists (
    select 1 from public.properties pr
    where pr.id = property_id
      and (pr.status = 'approved' or auth.role() in ('authenticated', 'service_role'))
  ));

create policy "Agents can manage images for their properties"
  on public.property_images
  for all
  using (exists (
    select 1 from public.properties pr
    where pr.id = property_id and pr.agent_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.properties pr
    where pr.id = property_id and pr.agent_id = auth.uid()
  ));

-- Inquiries
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

create policy "Anyone can create inquiries"
  on public.inquiries
  for insert
  with check (true);

create policy "Agents can view inquiries for their properties"
  on public.inquiries
  for select
  using (exists (
    select 1 from public.properties pr
    where pr.id = property_id and pr.agent_id = auth.uid()
  ));

create policy "Admins can view all inquiries"
  on public.inquiries
  for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Chats
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (property_id, agent_id, user_id)
);

alter table public.chats enable row level security;

create policy "Participants and admins can view chats"
  on public.chats
  for select
  using (
    user_id = auth.uid()
    or agent_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Users and agents can create their chats"
  on public.chats
  for insert
  with check (
    user_id = auth.uid()
    or agent_id = auth.uid()
  );

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role public.message_sender_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants and admins can view messages"
  on public.messages
  for select
  using (exists (
    select 1 from public.chats c
    where c.id = chat_id
      and (
        c.user_id = auth.uid()
        or c.agent_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
  ));

create policy "Participants can send messages to their chats"
  on public.messages
  for insert
  with check (exists (
    select 1 from public.chats c
    where c.id = chat_id
      and (
        c.user_id = auth.uid()
        or c.agent_id = auth.uid()
      )
  ));

