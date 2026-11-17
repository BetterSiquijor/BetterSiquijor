import {
  Heart,
  GraduationCap,
  FileText,
  Palmtree,
  Building2,
  Map,
  MapPin,
  BookOpen,
  Stethoscope,
  IdCard,
  Compass,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
const icons: Record<string, LucideIcon> = {
  ShieldCheck,
  Heart,
  GraduationCap,
  FileText,
  Palmtree,
  Building2,
  Map,
  MapPin,
  BookOpen,
  Stethoscope,
  IdCard,
  Compass,
};
export const getCategoryIcon = (name?: string): LucideIcon =>
  icons[name || ''] || FileText;
