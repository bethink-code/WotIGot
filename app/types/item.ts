export interface ItemImage {
  id: number;
  item_id: number;
  url: string;
  thumbnail_url?: string | null;
  is_primary: boolean;
  location_lat?: number;
  location_long?: number;
  created_at?: string;
}

export interface Item {
  id: number;
  description?: string;
  brand: string;
  model: string;
  price?: number;
  price_type: 'AI' | 'user' | 'invoice';
  category?: string;
  serial_number?: string;
  image?: string;
  receipt_image?: string;
  room_id: number;
  house_id: number;
  amount: number;
  location_lat?: number;
  location_long?: number;
  created_at?: string;
  images?: ItemImage[];
}

export interface ItemsTotal {
  total_price: number;
  total_items: number;
}
