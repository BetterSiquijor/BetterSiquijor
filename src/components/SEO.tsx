import {Helmet} from 'react-helmet-async';
import {useLocation} from 'react-router';
interface SEOProps {title?:string;description?:string;keywords?:string;image?:string;url?:string;type?:string;siteName?:string;}
export default function SEO({title,description,keywords,url,type='website',siteName='BetterSiquijor'}:SEOProps){
  const {pathname}=useLocation();
  const origin='https://better-siquijor.frenzvalios.chatgpt.site';
  const fullTitle=title?`${title} | ${siteName}`:`${siteName} — Siquijor Province community portal`;
  const fullDescription=description||'An independent, volunteer-run guide to Siquijor Province: official service links, municipalities, provincial officials, and public records.';
  return <Helmet><title>{fullTitle}</title><meta name="description" content={fullDescription}/><meta name="keywords" content={keywords||'Siquijor, provincial information, public services, transparency'}/><meta property="og:title" content={fullTitle}/><meta property="og:description" content={fullDescription}/><meta property="og:type" content={type}/><meta property="og:url" content={url||origin+pathname}/><meta property="og:site_name" content={siteName}/><meta name="theme-color" content="#0066eb"/><link rel="canonical" href={url||origin+pathname}/><link rel="icon" type="image/svg+xml" href="/favicon.svg"/></Helmet>;
}
