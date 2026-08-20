export type UserRole = "admin" | "manager" | "staff";
export type MovementType = "in" | "out" | "transfer" | "adjustment";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  code: string;
  name: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string | null;
  description: string | null;
  reorder_point: number;
  created_at: string;
}

export interface Stock {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  product_id: string;
  location_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  quantity: number;
  reference_no: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// รูปแบบ Database ขั้นต่ำสำหรับ @supabase/ssr — เพียงพอสำหรับการเช็คชนิดข้อมูลในโปรเจกต์นี้
// หากต้องการชนิดข้อมูลแบบละเอียดครบทุกฟังก์ชัน สามารถรันคำสั่ง
// `npx supabase gen types typescript` เพื่อ generate ไฟล์นี้ใหม่จากโปรเจกต์จริงได้
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      warehouses: {
        Row: Warehouse;
        Insert: Partial<Warehouse>;
        Update: Partial<Warehouse>;
        Relationships: [];
      };
      locations: {
        Row: Location;
        Insert: Partial<Location>;
        Update: Partial<Location>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
        Relationships: [];
      };
      stock: {
        Row: Stock;
        Insert: Partial<Stock>;
        Update: Partial<Stock>;
        Relationships: [];
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Partial<StockMovement>;
        Update: Partial<StockMovement>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      movement_type: MovementType;
    };
    CompositeTypes: Record<string, never>;
  };
}
