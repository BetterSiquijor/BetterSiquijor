import type { NavigationItem } from '../types';
import { serviceCategories, governmentCategories } from './yamlLoader';

export const mainNavigation: NavigationItem[] = [
  { label: 'Data', href: '/data' },
  { label: 'Hotlines', href: '/hotlines' },
  { label: 'Barangays', href: '/barangays' },
  {
    label: 'Services',
    href: '/services',
    children: serviceCategories.categories.map(category => ({
      label: category.category,
      href: `/services/${category.slug}`,
    })),
  },
  {
    label: 'Government',
    href: '/government',
    children: governmentCategories.categories.map(category => ({
      label: category.category,
      href: `/government/${category.slug}`,
    })),
  },
];

export const footerNavigation: {
  mainSections: { title: string; links: { label: string; href: string }[] }[];
  socialLinks: { label: string; href: string }[];
} = {
  mainSections: [
    {
      title: 'About',
      links: [
        { label: 'About BetterSiquijor', href: '/about' },
        { label: 'Local records', href: '/data' },
        { label: 'Sources & Methodology', href: '/government/sources' },
        { label: 'Accessibility', href: '/accessibility' },
        { label: 'Privacy', href: '/privacy' },
        {
          label: 'Suggest a Correction',
          href: '/government/sources/corrections',
        },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All Services', href: '/services' },
        ...serviceCategories.categories.map(category => ({
          label: category.category,
          href: `/services/${category.slug}`,
        })),
      ],
    },
    {
      title: 'Government',
      links: governmentCategories.categories.map(category => ({
        label: category.category,
        href: `/government/${category.slug}`,
      })),
    },
  ],
  socialLinks: [
    { label: 'Facebook', href: 'https://facebook.com/bettersiquijor' },
  ],
};
