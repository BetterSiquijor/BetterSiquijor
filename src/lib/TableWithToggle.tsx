import {type ReactNode,type HTMLAttributes,useState} from 'react';
import {Table,List} from 'lucide-react';
import {type TypographyTheme} from './typographyThemes';

interface MarkdownNode {type?:string;tagName?:string;value?:string;children?:MarkdownNode[];}
const textOf=(node:MarkdownNode):string=>node.value??(node.children||[]).map(textOf).join('');
function tableRows(node?:MarkdownNode){
  const rows:MarkdownNode[]=[];
  function walk(n:MarkdownNode){if(n.tagName==='tr')rows.push(n);else for(const child of n.children||[])walk(child);}
  if(node)walk(node);
  return rows.map(row=>(row.children||[]).filter(c=>c.tagName==='th'||c.tagName==='td').map(textOf));
}

export function TableWithToggle({children,theme,node,...props}:{children:ReactNode;theme:TypographyTheme;node?:MarkdownNode}&HTMLAttributes<HTMLTableElement>){
  // The original markdown syntax tree preserves cell boundaries, including cells
  // containing links or formatted text. React child keys are not a data schema.
  const parsed=tableRows(node);
  const headers=parsed[0]||[];
  const rows=parsed.slice(1);
  const [viewMode,setViewMode]=useState<'table'|'list'>('table');
  return <div className="mb-6 min-w-0">
    <div className="flex justify-end mb-4 gap-2">
      <button type="button" aria-pressed={viewMode==='table'} onClick={()=>setViewMode('table')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode==='table'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Table size={16} aria-hidden="true"/>Table</button>
      <button type="button" aria-pressed={viewMode==='list'} disabled={rows.length===0} onClick={()=>setViewMode('list')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode==='list'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><List size={16} aria-hidden="true"/>List</button>
    </div>
    {viewMode==='list'&&rows.length>0?<div className="space-y-4">{rows.map((cells,i)=><dl key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">{headers.map((header,j)=><div key={j} className="grid sm:grid-cols-3 gap-1 sm:gap-3"><dt className="font-semibold text-gray-800 text-sm">{header}</dt><dd className="text-gray-700 text-sm sm:col-span-2 break-words">{cells[j]??''}</dd></div>)}</dl>)}</div>:<div className="overflow-x-auto"><table className={`${theme.components.table} sticky-table`} style={{'--first-col-width':'10rem'} as React.CSSProperties} {...props}>{children}</table></div>}
  </div>;
}
