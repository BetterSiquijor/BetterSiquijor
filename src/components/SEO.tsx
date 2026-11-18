import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  image = '/og-image.png',
  url,
  type = 'website',
  siteName = 'BetterSiquijor',
}: SEOProps) {
  const { pathname } = useLocation();
  const origin = window.location.origin;
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} — Siquijor Province community portal`;
  const fullDescription =
    description ||
    'An independent, volunteer-run guide to Siquijor Province: service guides, municipalities, local officials, and provincial financial records.';
  const canonicalUrl = url || origin + pathname;
  const ogImage = /^https?:\/\//i.test(image)
    ? image
    : origin + (image.startsWith('/') ? image : '/' + image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta
        name="keywords"
        content={
          keywords ||
          'Siquijor, provincial information, public services, transparency'
        }
      />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="theme-color" content="#0066eb" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" type="image/svg+xml" href="/better-siquijor.svg" />
    </Helmet>
  );
}
