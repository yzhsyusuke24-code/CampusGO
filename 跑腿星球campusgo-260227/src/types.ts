export interface UserPreferences {
  types?: string[];
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
}

export interface User {
  id: string;
  openid: string;
  nickname: string;
  avatar_url: string;
  rating_as_requester: number;
  rating_as_runner: number;
  preferences: UserPreferences;
  requester_order_count?: number;
  runner_order_count?: number;
  requester_review_count?: number;
  runner_review_count?: number;
}

export interface Order {
  id: string;
  requester_id: string;
  runner_id?: string;
  type: 'takeout' | 'express' | 'send' | 'errand' | 'other';
  description: string;
  pickup_location: string;
  delivery_location: string;
  price: number;
  requester_wechat: string;
  status: 'pending' | 'accepted' | 'completed_by_runner' | 'confirmed' | 'cancelled';
  time_requirement?: string;
  extra_needs?: string;
  created_at: string;
  requester_name?: string;
  requester_avatar?: string;
}

export type Role = 'requester' | 'runner';
