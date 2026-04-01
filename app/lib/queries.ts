import { useQuery } from '@tanstack/react-query';
import { House } from '@/types/house';
import { Room } from '@/types/room';

export const useHouses = () => {
  return useQuery<House[]>({
    queryKey: ['/houses'],
  });
};

export const useHouse = (id: number) => {
  return useQuery<House>({
    queryKey: [`/houses/${id}`],
    enabled: !!id,
  });
};

export const useRooms = () => {
  return useQuery<Room[]>({
    queryKey: ['/rooms'],
  });
};

export const useRoom = (id: number) => {
  return useQuery<Room>({
    queryKey: [`/rooms/${id}`],
    enabled: !!id,
  });
};

// Billing queries

export interface CreditBalance {
  subscription_credits: number;
  purchased_credits: number;
  rollover_credits: number;
  total: number;
  lifetime_credits_purchased: number;
  lifetime_credits_used: number;
}

export interface SubscriptionPlan {
  id: number;
  tier: 'free' | 'pro' | 'business';
  name: string;
  price_zar: number;
  monthly_credits: number;
  max_properties: number;
  max_rooms_per_property: number;
  max_items: number;
  max_credit_rollover: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
}

export interface CreditPack {
  id: number;
  name: string;
  credits: number;
  price_zar: number;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface UsageLogItem {
  id: number;
  action_type: string;
  credits_used: number;
  credit_source: string;
  balance_after: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface CreditTransactionItem {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface UsageSummary {
  total_credits_used: number;
  total_actions: number;
  by_action_type: {
    action_type: string;
    count: number;
    credits: number;
  }[];
}

export const useCreditBalance = () => {
  return useQuery<CreditBalance>({
    queryKey: ['/billing/credits'],
  });
};

export const useSubscription = () => {
  return useQuery<{ subscription: UserSubscription | null; plan: SubscriptionPlan | null }>({
    queryKey: ['/billing/subscription'],
  });
};

export const usePlans = () => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['/billing/plans'],
  });
};

export const useCreditPacks = () => {
  return useQuery<CreditPack[]>({
    queryKey: ['/billing/packs'],
  });
};

export const useUsageHistory = (page: number = 1) => {
  return useQuery<{ items: UsageLogItem[]; total: number }>({
    queryKey: ['/billing/usage', { page, limit: 20 }],
  });
};

export const useUsageSummary = () => {
  return useQuery<UsageSummary>({
    queryKey: ['/billing/usage/summary'],
  });
};

export const useCreditTransactions = (page: number = 1) => {
  return useQuery<{ items: CreditTransactionItem[]; total: number }>({
    queryKey: ['/billing/credits/transactions', { page, limit: 20 }],
  });
};
