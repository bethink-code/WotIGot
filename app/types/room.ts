export interface Room {
  id: number;
  name: string;
  house_id: number;
  image?: string;
  location_lat?: number;
  location_long?: number;
  total_value?: number;
  total_items?: number;
}
