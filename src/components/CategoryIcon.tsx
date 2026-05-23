import React from 'react';
import {
  Home,
  CreditCard,
  Utensils,
  Car,
  Sparkles,
  Activity,
  PiggyBank,
  Wallet,
  ShoppingBag,
  Zap,
  BookOpen,
  Heart,
  Wrench,
  Gamepad2,
  Gift,
  HelpCircle,
  TrendingUp,
  User,
  Coffee,
  Briefcase
} from 'lucide-react';

export const ICON_MAP = {
  Home,
  CreditCard,
  Utensils,
  Car,
  Sparkles,
  Activity,
  PiggyBank,
  Wallet,
  ShoppingBag,
  Zap,
  BookOpen,
  Heart,
  Wrench,
  Gamepad2,
  Gift,
  TrendingUp,
  User,
  Coffee,
  Briefcase,
  HelpCircle,
};

export type IconType = keyof typeof ICON_MAP;

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = '', size = 20 }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name as IconType] || HelpCircle;
  return <IconComponent className={className} size={size} />;
}
