import {
  BookOpen,
  Building2,
  Compass,
  FileText,
  GraduationCap,
  Heart,
  IdCard,
  Map,
  MapPin,
  Palmtree,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export default function CategoryIcon({
  name,
  className = 'h-6 w-6',
}: {
  name?: string;
  className?: string;
}) {
  switch (name) {
    case 'ShieldCheck':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'Heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'GraduationCap':
      return <GraduationCap className={className} aria-hidden="true" />;
    case 'Palmtree':
      return <Palmtree className={className} aria-hidden="true" />;
    case 'Building2':
      return <Building2 className={className} aria-hidden="true" />;
    case 'Map':
      return <Map className={className} aria-hidden="true" />;
    case 'MapPin':
      return <MapPin className={className} aria-hidden="true" />;
    case 'BookOpen':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'Stethoscope':
      return <Stethoscope className={className} aria-hidden="true" />;
    case 'IdCard':
      return <IdCard className={className} aria-hidden="true" />;
    case 'Compass':
      return <Compass className={className} aria-hidden="true" />;
    default:
      return <FileText className={className} aria-hidden="true" />;
  }
}
