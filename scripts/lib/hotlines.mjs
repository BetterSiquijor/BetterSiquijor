import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const HOTLINE_INPUTS = [
  {
    id: 'supplied-emergency-assistance-contacts',
    title:
      'Province of Siquijor — List of Emergency Assistance Contact Numbers',
    file: 'data/hotlines/siquijor_emergency_assistance_contacts.json',
    publicPath: 'hotlines/siquijor_emergency_assistance_contacts.json',
  },
  {
    id: 'supplied-pdrrmo-emergency-hotlines',
    title: 'Province of Siquijor PDRRMO — Emergency Hotline Directory',
    file: 'data/hotlines/siquijor_emergency_hotlines.json',
    publicPath: 'hotlines/siquijor_emergency_hotlines.json',
  },
];

const SAN_JUAN_NOTE =
  'Supplied hotline entries duplicate Municipality of Siquijor numbers verbatim; see San Juan Municipal Police Station (0926 324 2820) in facilities.json.';

const DISCREPANCIES = [
  'PDRRMO mobile prefix differs: 0953 209 9165 appears in the assistance contacts list, hotline directory header, siquijorprovince.com, and PDRRMO Facebook, whereas 0933-209-9165 appears under Province of Siquijor in the hotline directory.',
  'PDRRMO email spelling differs: pdrrmosiquijor07@gmail.com appears on PDRRMO Facebook, whereas the hotline directory header lists pdrmosiquijor07@gmail.com (single r) and sptpdrrmosiquijor@gmail.com.',
  'Bureau of Fire Protection numbers differ across sections: 035-480-9051 under Province of Siquijor in the hotline directory, 035 480 9123 and 0926 410 2433 in the assistance contacts list, and 035-480-0054, 0926-410-2433, 0935-480-9123 under Municipality of Siquijor.',
  'Siquijor Provincial Hospital contact 0935 924 7077 in the assistance contacts list appears under Municipality of Siquijor Rural Health Unit in the hotline directory.',
  'Municipality of San Juan duplicates all five Municipality of Siquijor entries verbatim in the supplied hotline directory; San Juan Municipal Police Station separately lists 0926 324 2820 in its undated station directory.',
  'Police station numbers differ between the supplied hotline directory and station sources in BetterSiquijor: Enrique Villanueva (0996-835-1602 vs 0906 835 1602 on station Facebook) and Siquijor town (0997-558-9114 vs 0977 180 3999 on undated station site).',
];

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');
const csvCell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';

/**
 * Builds the normalized emergency hotline directory from the user-supplied JSON files.
 * Preserves verbatim values, undated source status, and documented discrepancies.
 */
export function buildHotlineDirectory() {
  const assistance = readJson(HOTLINE_INPUTS[0].file);
  const hotlines = readJson(HOTLINE_INPUTS[1].file);
  const sources = HOTLINE_INPUTS.map(input => ({
    id: input.id,
    title: input.title,
    file: input.file,
    publicDownload: `/data/${input.publicPath}`,
    sourceAsOf: null,
    sha256: sha256(input.file),
  }));

  const provincialDirectory = (
    hotlines.directories['Province of Siquijor'] || []
  ).map(entry => ({
    office: entry.agency_office_response_group,
    contactNumbers: [...entry.contact_numbers],
  }));

  const municipalDirectories = Object.entries(hotlines.directories)
    .filter(([area]) => area !== 'Province of Siquijor')
    .map(([municipality, entries]) => ({
      municipality: municipality.replace(/^Municipality of /, ''),
      sectionLabel: municipality,
      entries: entries.map(entry => ({
        office: entry.agency_office,
        contactNumbers: [...entry.contact_numbers],
      })),
      note: municipality === 'Municipality of San Juan' ? SAN_JUAN_NOTE : null,
    }));

  return {
    metadata: {
      title: 'Siquijor emergency and disaster hotlines',
      suppliedDate: '2026-11-18',
      phoneAvailabilityTested: false,
      emergencyNumber: '911',
      attribution:
        'User-supplied PDRRMO and provincial emergency hotline JSON files preserved in data/hotlines/ without alteration; original snapshots are undated and telephone availability has not been tested.',
      sources,
      discrepancies: DISCREPANCIES,
    },
    pdrrmoDirectoryHeader: {
      office: hotlines.header.office,
      address: hotlines.header.address,
      emails: [...hotlines.header.emails],
      contactNumbers: [...hotlines.header.contact_numbers],
    },
    provincialAssistanceContacts: assistance.contacts.map(entry => ({
      office: entry.agency_office,
      contactNumbers: [...entry.contact_numbers],
    })),
    provincialDirectory,
    municipalDirectories,
  };
}

/**
 * Generates public hotline JSON, CSV, and verbatim copies of the supplied source files.
 */
export function writeHotlineDirectory() {
  const directory = buildHotlineDirectory();
  mkdirSync('public/data/hotlines', { recursive: true });
  mkdirSync('data/derived', { recursive: true });
  for (const input of HOTLINE_INPUTS) {
    writeFileSync(`public/data/${input.publicPath}`, readFileSync(input.file));
  }
  const serialized = JSON.stringify(directory, null, 2) + '\n';
  writeFileSync('public/data/emergency-hotlines.json', serialized);
  writeFileSync('data/derived/hotlines.json', serialized);

  const columns = ['dataset', 'area', 'office', 'contact_numbers', 'note'];
  const rows = [
    [
      'national',
      'Philippines / NIR / Siquijor',
      'Emergency Hotline',
      '911',
      '',
    ],
    ...directory.provincialAssistanceContacts.map(entry => [
      'assistance-contacts',
      'Province of Siquijor',
      entry.office,
      entry.contactNumbers.join('; '),
      '',
    ]),
    ...directory.provincialDirectory.map(entry => [
      'pdrrmo-hotline-directory',
      'Province of Siquijor',
      entry.office,
      entry.contactNumbers.join('; '),
      '',
    ]),
    ...directory.municipalDirectories.flatMap(group =>
      group.entries.map(entry => [
        'pdrrmo-hotline-directory',
        group.sectionLabel,
        entry.office,
        entry.contactNumbers.join('; '),
        group.note || '',
      ])
    ),
  ];

  writeFileSync(
    'public/data/emergency-hotlines.csv',
    [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') +
      '\r\n'
  );
  console.log(
    `Hotlines directory: ${directory.provincialAssistanceContacts.length} assistance contact groups, ${directory.provincialDirectory.length} provincial listings, and ${directory.municipalDirectories.length} municipalities exported.`
  );
}
