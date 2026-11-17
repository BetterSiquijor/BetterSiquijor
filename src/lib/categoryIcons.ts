import {Heart,GraduationCap,FileText,Palmtree,Building2,Map,MapPin,BookOpen,Stethoscope,IdCard,Compass, type LucideIcon} from 'lucide-react';
const icons:Record<string,LucideIcon>={Heart,GraduationCap,FileText,Palmtree,Building2,Map,MapPin,BookOpen,Stethoscope,IdCard,Compass};
export const getCategoryIcon=(name?:string):LucideIcon=>icons[name||'']||FileText;
