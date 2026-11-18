import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { footerNavigation } from '../../data/navigation';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');

  const getSocialIcon = (label: string) => {
    switch (label) {
      case 'Facebook':
        return <Facebook className="h-5 w-5" aria-hidden="true" />;
      case 'Twitter':
        return <Twitter className="h-5 w-5" aria-hidden="true" />;
      case 'Instagram':
        return <Instagram className="h-5 w-5" aria-hidden="true" />;
      case 'YouTube':
        return <Youtube className="h-5 w-5" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img
                src="/better-siquijor.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 mr-3 shrink-0"
              />

              <div>
                <div className="font-bold">{t('site_name')}</div>
                <div className="text-xs text-gray-400">
                  Siquijor Province · Community portal
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              An independent, volunteer-run guide to Siquijor’s services and
              public information. Not an official government website.
            </p>
            <div className="flex flex-wrap gap-4">
              {footerNavigation.socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={`BetterSiquijor on ${link.label}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(link.label)}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          {footerNavigation.mainSections.map(section => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap gap-6">
              <a
                href="https://github.com/BetterSiquijor/BetterSiquijor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Contribute at GitHub
              </a>
              <Link
                to="/sitemap"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Sitemap
              </Link>
              <Link
                to="/accessibility"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
