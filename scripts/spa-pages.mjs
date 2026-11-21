import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import * as yaml from 'js-yaml';
const html=await readFile('dist/index.html','utf8');
const routes=new Set(['services','government','search','data','hotlines','barangays']);
for(const group of ['services','government']){
 const data=yaml.load(await readFile(`src/data/${group}.yaml`,'utf8'));
 for(const category of data.categories){
  routes.add(`${group}/${category.slug}`);
  const index=yaml.load(await readFile(`content/${group}/${category.slug}/index.yaml`,'utf8'));
  for(const page of index.pages) routes.add(`${group}/${category.slug}/${page.slug}`);
 }
}
for(const file of await readdir('content/pages')) if(file.endsWith('.md'))routes.add(file.slice(0,-3));
for(const route of routes){const dest=join('dist',route,'index.html');await mkdir(dirname(dest),{recursive:true});await writeFile(dest,html);}
console.log(`Prepared ${routes.size} direct-entry static routes.`);
