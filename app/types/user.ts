export interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
  user_name: string;
  has_password: boolean;
  has_google: boolean;
}
