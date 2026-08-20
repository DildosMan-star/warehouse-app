-- ============================================================================
-- Warehouse Management System — Supabase schema
-- วิธีใช้: เปิด Supabase Dashboard -> SQL Editor -> New query -> วางไฟล์นี้ทั้งหมด -> Run
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'manager', 'staff');
create type movement_type as enum ('in', 'out', 'transfer', 'adjustment');

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

-- โปรไฟล์ผู้ใช้ 1:1 กับ auth.users (สร้างอัตโนมัติผ่าน trigger ด้านล่าง)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role user_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- คลังสินค้า / สาขา
create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

-- ตำแหน่งจัดเก็บภายในคลัง เช่น โซน A, ชั้น 2, บิน B-04
create table locations (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid not null references warehouses (id) on delete cascade,
  code text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

-- สินค้า (SKU master)
create table products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  name text not null,
  unit text not null default 'ชิ้น',
  category text,
  description text,
  reorder_point integer not null default 0,
  created_at timestamptz not null default now()
);

-- จำนวนคงเหลือปัจจุบัน ต่อสินค้า ต่อตำแหน่ง (ถูกอัปเดตอัตโนมัติโดย trigger เท่านั้น)
create table stock (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  location_id uuid not null references locations (id) on delete cascade,
  quantity numeric not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, location_id)
);

-- ประวัติการเคลื่อนไหวสต็อกทั้งหมด (audit log) — insert เท่านั้น ห้ามแก้ไขย้อนหลัง
create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  type movement_type not null,
  product_id uuid not null references products (id),
  location_id uuid references locations (id), -- ใช้กับ in / out / adjustment
  from_location_id uuid references locations (id), -- ใช้กับ transfer
  to_location_id uuid references locations (id), -- ใช้กับ transfer
  quantity numeric not null check (quantity > 0),
  reference_no text,
  note text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_stock_product on stock (product_id);
create index idx_stock_location on stock (location_id);
create index idx_locations_warehouse on locations (warehouse_id);
create index idx_movements_product on stock_movements (product_id);
create index idx_movements_created_at on stock_movements (created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Trigger: สร้างโปรไฟล์อัตโนมัติเมื่อมีการสมัครสมาชิกใหม่
--    ผู้สมัครคนแรกของระบบจะได้สิทธิ์ admin อัตโนมัติ ที่เหลือได้สิทธิ์ staff
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from profiles) into is_first;

  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    case when is_first then 'admin'::user_role else 'staff'::user_role end
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Trigger: ปรับยอดคงเหลือในตาราง stock ทุกครั้งที่มีการบันทึก stock_movements
--    ทำงานเป็น security definer เพื่อให้เขียนตาราง stock ได้ แม้ผู้ใช้จะไม่มีสิทธิ์เขียนตรง ๆ
-- ----------------------------------------------------------------------------
create or replace function apply_stock_movement()
returns trigger as $$
begin
  if new.type = 'in' then
    insert into stock (product_id, location_id, quantity)
    values (new.product_id, new.location_id, new.quantity)
    on conflict (product_id, location_id)
    do update set quantity = stock.quantity + excluded.quantity, updated_at = now();

  elsif new.type = 'out' then
    update stock
    set quantity = quantity - new.quantity, updated_at = now()
    where product_id = new.product_id and location_id = new.location_id;

    if not found then
      raise exception 'ไม่พบสต็อกสินค้านี้ในตำแหน่งที่ระบุ จึงไม่สามารถเบิกออกได้';
    end if;

  elsif new.type = 'adjustment' then
    insert into stock (product_id, location_id, quantity)
    values (new.product_id, new.location_id, new.quantity)
    on conflict (product_id, location_id)
    do update set quantity = excluded.quantity, updated_at = now();

  elsif new.type = 'transfer' then
    if new.from_location_id is null or new.to_location_id is null then
      raise exception 'การโอนย้ายสต็อกต้องระบุตำแหน่งต้นทางและปลายทาง';
    end if;

    update stock
    set quantity = quantity - new.quantity, updated_at = now()
    where product_id = new.product_id and location_id = new.from_location_id;

    if not found then
      raise exception 'ไม่พบสต็อกสินค้านี้ในตำแหน่งต้นทาง';
    end if;

    insert into stock (product_id, location_id, quantity)
    values (new.product_id, new.to_location_id, new.quantity)
    on conflict (product_id, location_id)
    do update set quantity = stock.quantity + excluded.quantity, updated_at = now();
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_apply_stock_movement
after insert on stock_movements
for each row execute function apply_stock_movement();

-- check constraint บนตาราง stock (quantity >= 0) จะทำหน้าที่กันสต็อกติดลบ
-- ให้อัตโนมัติอีกชั้นหนึ่ง หากเบิกเกินจำนวนที่มี ธุรกรรมทั้งหมดจะถูก rollback

-- ----------------------------------------------------------------------------
-- 5. Helper function สำหรับอ่าน role ของผู้ใช้ปัจจุบัน (ใช้ใน RLS policy)
-- ----------------------------------------------------------------------------
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table warehouses enable row level security;
alter table locations enable row level security;
alter table products enable row level security;
alter table stock enable row level security;
alter table stock_movements enable row level security;

-- profiles: ดูของตัวเองได้เสมอ, admin ดูได้ทุกคน / แก้ไข role ได้เฉพาะ admin
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or get_my_role() = 'admin');

create policy "profiles_update_admin" on profiles for update
  using (get_my_role() = 'admin');

-- warehouses: authenticated ทุกคนอ่านได้ / เขียนได้เฉพาะ admin, manager
create policy "warehouses_select" on warehouses for select
  using (auth.role() = 'authenticated');
create policy "warehouses_write" on warehouses for all
  using (get_my_role() in ('admin', 'manager'))
  with check (get_my_role() in ('admin', 'manager'));

-- locations: เช่นเดียวกับ warehouses
create policy "locations_select" on locations for select
  using (auth.role() = 'authenticated');
create policy "locations_write" on locations for all
  using (get_my_role() in ('admin', 'manager'))
  with check (get_my_role() in ('admin', 'manager'));

-- products: อ่านได้ทุกคน / เขียนได้เฉพาะ admin, manager
create policy "products_select" on products for select
  using (auth.role() = 'authenticated');
create policy "products_write" on products for all
  using (get_my_role() in ('admin', 'manager'))
  with check (get_my_role() in ('admin', 'manager'));

-- stock: อ่านได้ทุกคน / ห้ามเขียนตรงทุกสิทธิ์ (ต้องผ่าน stock_movements เท่านั้น)
create policy "stock_select" on stock for select
  using (auth.role() = 'authenticated');

-- stock_movements: อ่านได้ทุกคน / บันทึกได้ทุกคนที่ login แล้ว / ลบได้เฉพาะ admin (แก้ไขบันทึกย้อนหลังไม่ได้)
create policy "movements_select" on stock_movements for select
  using (auth.role() = 'authenticated');
create policy "movements_insert" on stock_movements for insert
  with check (auth.role() = 'authenticated');
create policy "movements_delete_admin" on stock_movements for delete
  using (get_my_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 7. ข้อมูลตัวอย่าง (ลบส่วนนี้ทิ้งได้หากไม่ต้องการ)
-- ----------------------------------------------------------------------------
insert into warehouses (code, name, address) values
  ('WH-01', 'คลังสินค้าหลัก', 'นครปฐม'),
  ('WH-02', 'คลังสินค้าสาขา 2', 'กรุงเทพฯ');

insert into locations (warehouse_id, code, name)
select id, 'A-01', 'โซน A ชั้น 1' from warehouses where code = 'WH-01'
union all
select id, 'A-02', 'โซน A ชั้น 2' from warehouses where code = 'WH-01'
union all
select id, 'B-01', 'โซน B ชั้น 1' from warehouses where code = 'WH-02';

insert into products (sku, name, unit, category, reorder_point) values
  ('SKU-0001', 'กล่องกระดาษ A4', 'กล่อง', 'บรรจุภัณฑ์', 20),
  ('SKU-0002', 'เทปกาวใส 2 นิ้ว', 'ม้วน', 'บรรจุภัณฑ์', 50),
  ('SKU-0003', 'พาเลทไม้', 'แผ่น', 'อุปกรณ์คลัง', 10);
