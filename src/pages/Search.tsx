import {Link,useSearchParams} from 'react-router';
import {Search as SearchIcon} from 'lucide-react';
import SEO from '../components/SEO';
const documents=import.meta.glob('../../content/**/*.md',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
const entries=Object.entries(documents).map(([path,content])=>{
  const parts=path.replace('../../content/','').replace(/\.md$/,'').split('/');
  const type=parts.shift()!;
  const title=content.match(/^#\s+(.+)$/m)?.[1]||parts.at(-1)!;
  const description=content.replace(/^#.*$/gm,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*|>#]/g,'').trim().split('\n').filter(Boolean).slice(0,2).join(' ');
  const url=type==='pages'?'/'+parts.join('/'):'/'+type+'/'+parts.join('/');
  return {url,title,description,type,content};
});
export default function Search(){
  const [params,setParams]=useSearchParams();
  const query=(params.get('q')||'').slice(0,120);
  const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results=words.length?entries.filter(e=>words.every(w=>(e.title+' '+e.content).toLowerCase().includes(w))):[];
  return <main className="container mx-auto px-4 py-8 max-w-3xl">
    <SEO title="Search" description="Search Siquijor services and public information in this edition." />
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>
    <div className="relative mb-8"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" aria-hidden="true" /><label htmlFor="portal-search" className="sr-only">Search services and government information</label><input id="portal-search" type="search" value={query} onChange={e=>setParams(e.target.value?{q:e.target.value}:{},{replace:true})} maxLength={120} placeholder="Search services, departments, guides..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" /></div>
    <p className="text-sm text-gray-700 mb-6" role="status">{words.length?`${results.length} result${results.length===1?'':'s'} for “${query}”`:'Start typing to search this edition. Search runs locally in your browser.'}</p>
    {results.length>0?<div className="space-y-3">{results.map(hit=><Link key={hit.url} to={hit.url} className="block group"><div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"><span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-2">{hit.type==='services'?'Service':hit.type==='government'?'Government':'Project information'}</span><h2 className="text-base font-semibold text-gray-900 group-hover:text-primary-700">{hit.title}</h2><p className="text-sm text-gray-700 mt-1 line-clamp-2">{hit.description}</p></div></Link>)}</div>:words.length>0?<div className="text-center py-12 text-gray-700">No matching pages yet. Try “PhilHealth”, “budget”, “governor”, or a municipality name.</div>:null}
  </main>;
}
