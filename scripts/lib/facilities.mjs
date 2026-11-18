import { readFileSync, writeFileSync } from 'node:fs';

export function writeFacilities() {
  const directory = JSON.parse(
    readFileSync('data/records/facilities.json', 'utf8')
  );
  const sources = JSON.parse(
    readFileSync('data/sources/facility-sources.json', 'utf8')
  );
  writeFileSync(
    'public/data/facilities.json',
    JSON.stringify(directory, null, 2) + '\n'
  );
  const columns = [
    'name',
    'type',
    'municipality',
    'address',
    'phone',
    'email',
    'facebook',
    'reviewed',
  ];
  const rows = directory.facilities.map(f => [
    f.name,
    f.kind,
    f.municipality,
    f.address,
    f.contacts
      .filter(c => c.kind === 'phone')
      .map(c => c.value)
      .join('; '),
    f.contacts
      .filter(c => c.kind === 'email')
      .map(c => c.value)
      .join('; '),
    f.facebook?.url,
    f.reviewedAt,
  ]);
  const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  writeFileSync(
    'public/data/facilities.csv',
    [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'
  );
  const sourceById = new Map(sources.sources.map(s => [s.id, s]));
  for (const [kind, file, title, intro] of [
    [
      'hospital',
      'content/services/health/hospitals.md',
      'Hospitals in Siquijor',
      'Find hospital locations, telephone numbers, email addresses, and hospital Facebook pages.',
    ],
    [
      'police',
      'content/services/public-safety/police-stations.md',
      'Police stations in Siquijor',
      'Find your municipal police station and the provincial police office.',
    ],
  ]) {
    const facilities = directory.facilities.filter(f =>
      kind === 'hospital' ? f.kind === 'hospital' : f.kind !== 'hospital'
    );
    let md = `# ${title}\n\n${intro}\n\nFor urgent assistance, **call 911**.\n`;
    const cited = new Set([directory.metadata.emergencySourceId]);
    for (const f of facilities) {
      md += `\n## ${f.name}\n\n**Location:** ${f.address}.\n\n`;
      for (const contact of f.contacts) {
        md += `- **${contact.label}:** ${contact.value}.\n`;
        cited.add(contact.sourceId);
      }
      if (f.facebook) {
        md += `- [Facebook page](${f.facebook.url}).\n`;
        cited.add(f.facebook.sourceId);
      }
      for (const d of f.details) {
        md += `- **${d.label}:** ${d.value}.\n`;
        for (const id of d.sourceIds) cited.add(id);
      }
      for (const id of f.addressSourceIds) cited.add(id);
    }
    md += '\n## Sources and reference dates\n\n';
    for (const id of cited) {
      const s = sourceById.get(id);
      md += `- [${s.publisher}: ${s.title}](${s.url}). ${s.sourceDate ? 'Publication: ' + s.sourceDate + '. ' : ''}Checked ${s.reviewed}.\n`;
    }
    md +=
      kind === 'hospital'
        ? '\nContact availability has not been tested by telephone. Hospital capacity is a dated directory count, not current bed availability.\n'
        : '\nContact availability has not been tested by telephone.\n';
    writeFileSync(file, md);
  }
  console.log(
    `Generated hospital and police directories: ${directory.facilities.length} records.`
  );
}
