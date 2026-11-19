import { readFileSync, writeFileSync } from 'node:fs';

export function writeColleges() {
  const directory = JSON.parse(
    readFileSync('data/records/colleges.json', 'utf8')
  );
  const register = JSON.parse(
    readFileSync('data/sources/college-sources.json', 'utf8')
  );
  writeFileSync(
    'public/data/colleges.json',
    JSON.stringify(directory, null, 2) + '\n'
  );
  const columns = [
    'name',
    'sector',
    'municipality',
    'address',
    'phones',
    'emails',
    'website',
    'facebook',
    'programs',
    'reviewed',
  ];
  const programLabel = p =>
    p.name + (p.majors.length ? ' — ' + p.majors.join(', ') : '');
  const rows = directory.colleges.map(c => [
    c.name,
    c.sector,
    c.municipality,
    c.address,
    c.contacts
      .filter(t => t.kind === 'phone')
      .map(t => t.value)
      .join('; '),
    c.contacts
      .filter(t => t.kind === 'email')
      .map(t => t.value)
      .join('; '),
    c.website,
    c.facebook.url,
    c.programs.map(programLabel).join('; '),
    c.reviewedAt,
  ]);
  const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  writeFileSync(
    'public/data/colleges.csv',
    [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'
  );
  let md =
    '# Colleges in Siquijor\n\nFind a college, compare courses, and contact the admissions or registrar’s office.\n';
  for (const c of directory.colleges) {
    md += `\n## ${c.name} (${c.shortName})\n\n**${c.sector} college · ${c.address}**\n\n`;
    for (const t of c.contacts) md += `- **${t.label}:** ${t.value}.\n`;
    md += `- [Facebook page](${c.facebook.url}).\n`;
    if (c.website) md += `- [College website](${c.website}).\n`;
    if (c.programs.length) {
      md += '\n### Courses\n\n';
      for (const p of c.programs) md += `- ${programLabel(p)} (${p.level}).\n`;
    } else
      md +=
        '\nContact the college about degree programs and admission requirements.\n';
  }
  md +=
    '\n## More education services\n\n- [Find an elementary or secondary school](/services/education/find-school).\n- [Explore Siquijor State College courses](/services/education/public-higher-education).\n\n## Sources and reference dates\n\n';
  for (const s of register.sources)
    md += `- [${s.publisher}: ${s.title}](${s.url}). ${s.sourceDate ? 'Publication: ' + s.sourceDate + '. Checked ' + s.reviewed : 'Checked ' + s.reviewed + '; publication date not stated'}.\n`;
  md +=
    '\nDegree lists follow each institution’s published catalogue or official Facebook announcement. Contact your chosen college for intake availability, fees, application dates, and admission requirements. UniFAST listing does not guarantee scholarship eligibility.\n';
  writeFileSync('content/services/education/colleges.md', md);
  console.log(
    `Generated college directory: ${directory.colleges.length} institutions.`
  );
}
