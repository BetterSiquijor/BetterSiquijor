import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const inputs = [
  {
    file: 'data/schools/siquijor_elementary_schools.json',
    label: 'Elementary school list',
  },
  {
    file: 'data/schools/siquijor_high_schools.json',
    label: 'High school list',
  },
];
const sections = [
  [
    'School information',
    [
      ['former_name', 'Former name'],
      ['alternate_name', 'Other name'],
      ['legacy_school_id', 'Former school ID'],
      ['category', 'School category'],
      ['affiliation', 'Affiliation'],
      ['address', 'Address'],
      ['barangay', 'Barangay'],
      ['location', 'Location'],
      ['postal_code', 'Postal code'],
      ['deped_district', 'DepEd district'],
      ['founded_year', 'Year founded'],
      ['founded_notes', 'School history'],
    ],
  ],
  [
    'Education and programs',
    [
      ['departments', 'Departments'],
      ['levels_offered', 'Levels offered'],
      ['high_school_levels', 'Secondary levels'],
      ['curriculum_focus', 'Curriculum'],
      ['shs_tracks', 'Senior high school tracks'],
      ['shs_strands', 'Senior high school strands'],
      ['college_programs', 'College programs'],
      ['programs_and_accreditations', 'Program listings'],
    ],
  ],
  [
    'Contact the school',
    [
      ['contact.email', 'Email'],
      ['contact.email_note', 'Email details'],
      ['contact.phone', 'Telephone'],
      ['social_media.facebook_url', 'Facebook'],
    ],
  ],
  [
    'Staff listed in the directory',
    [
      ['leadership.school_head', 'School head'],
      ['leadership.previous_school_heads', 'Previous school heads'],
      ['leadership.director', 'Director'],
      ['leadership.president', 'President'],
      ['leadership.shs_principal', 'Senior high school principal'],
    ],
  ],
  [
    'Other directory details',
    [
      ['classrooms', 'Classrooms listed'],
      ['size_classification', 'Size classification'],
      ['reported_enrollment', 'Reported enrollment'],
      ['note', 'Notes'],
    ],
  ],
];
const at = (record, key) =>
  key.split('.').reduce((value, part) => value?.[part], record);
const clean = value =>
  Array.isArray(value) ? value.filter(v => v !== null && v !== '') : value;
const populated = value =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  (!Array.isArray(value) || value.length > 0);
const slug = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function buildSchoolDirectory() {
  const schools = new Map();
  const sources = [];
  const governingOffices = [];
  let inputRecords = 0;
  for (const input of inputs) {
    const bytes = readFileSync(input.file);
    const data = JSON.parse(bytes);
    sources.push({
      ...input,
      exportedAt: data.exported_at,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    governingOffices.push({
      source: input.label,
      offices: data.governing_offices,
    });
    function visit(value, path = '') {
      if (
        Array.isArray(value) &&
        value.length &&
        value.every(item => item && typeof item === 'object' && 'name' in item)
      ) {
        for (const record of value) {
          inputRecords++;
          const id = record.deped_school_id
            ? `deped-${record.deped_school_id}`
            : `name-${slug(record.name)}`;
          const entry = schools.get(id) || {
            id,
            schoolId: record.deped_school_id,
            name: record.name,
            sector: record.sector,
            municipality: record.municipality,
            barangay: record.barangay,
            levels: new Set(),
            profiles: [],
          };
          if (
            entry.name !== record.name ||
            entry.municipality !== record.municipality ||
            entry.sector !== record.sector
          ) {
            throw new Error(`Conflicting school identity: ${id}`);
          }
          // The three secondary-focused references in the elementary file do not establish elementary provision.
          if (
            input.file.includes('elementary_schools') &&
            (path === 'public.elementary_schools' ||
              path === 'public.integrated_schools' ||
              path === 'private.elementary_schools')
          )
            entry.levels.add('Elementary');
          if (input.file.includes('high_schools'))
            entry.levels.add('Secondary');
          if (
            [
              ...(record.levels_offered || []),
              ...(record.departments || []),
            ].some(level => /^kindergarten/i.test(level))
          )
            entry.levels.add('Kindergarten');
          entry.profiles.push({
            source: input.label,
            file: input.file,
            path,
            record,
          });
          schools.set(id, entry);
        }
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          if (key !== 'governing_offices')
            visit(child, path ? `${path}.${key}` : key);
        }
      }
    }
    visit(data);
  }
  const records = [...schools.values()]
    .map(entry => {
      const detailSections = sections
        .map(([title, fields]) => ({
          title,
          fields: fields
            .map(([key, label]) => {
              const variants = new Map();
              for (const profile of entry.profiles) {
                const value = clean(at(profile.record, key));
                if (!populated(value)) continue;
                const serialised = JSON.stringify(value);
                const variant = variants.get(serialised) || {
                  value,
                  sources: [],
                };
                if (!variant.sources.includes(profile.source))
                  variant.sources.push(profile.source);
                variants.set(serialised, variant);
              }
              return { key, label, values: [...variants.values()] };
            })
            .filter(field => field.values.length),
        }))
        .filter(section => section.fields.length);
      const { profiles, ...identity } = entry;
      return {
        ...identity,
        levels: [...entry.levels].sort(),
        sections: detailSections,
        sourceFiles: [...new Set(profiles.map(p => p.file))],
      };
    })
    .sort(
      (a, b) =>
        a.municipality.localeCompare(b.municipality) ||
        a.name.localeCompare(b.name)
    );
  return {
    metadata: {
      title: 'Siquijor school directory',
      sources,
      inputRecords,
      uniqueSchools: records.length,
      duplicatesCombined: inputRecords - records.length,
      attribution:
        'School lists supplied in data/schools; source export dates retained. No independent per-field verification is implied.',
    },
    governingOffices,
    schools: records,
  };
}

export function writeSchoolDirectory() {
  const directory = buildSchoolDirectory();
  mkdirSync('data/derived', { recursive: true });
  mkdirSync('public/data/schools', { recursive: true });
  const json = JSON.stringify(directory, null, 2) + '\n';
  writeFileSync('data/derived/schools.json', json);
  writeFileSync('public/data/schools.json', json);
  for (const source of directory.metadata.sources)
    writeFileSync(`public/${source.file}`, readFileSync(source.file));
  const search = directory.schools.map(s => ({
    title: s.name,
    type: 'services',
    description: [
      s.municipality,
      s.barangay,
      s.sector,
      s.levels.join(', '),
      s.schoolId ? `School ID ${s.schoolId}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    url:
      '/services/education/find-school?q=' +
      encodeURIComponent(s.schoolId || s.name),
    content: JSON.stringify(s.sections),
  }));
  writeFileSync(
    'data/derived/school-search.json',
    JSON.stringify(search, null, 2) + '\n'
  );
  const columns = [
    'school_id',
    'name',
    'sector',
    'municipality',
    'barangay',
    'levels',
    'source_files',
  ];
  const csv = [
    columns,
    ...directory.schools.map(s => [
      s.schoolId,
      s.name,
      s.sector,
      s.municipality,
      s.barangay,
      s.levels.join('; '),
      s.sourceFiles.join('; '),
    ]),
  ];
  const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  writeFileSync(
    'public/data/schools.csv',
    csv.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'
  );
  let page =
    '# Find a school in Siquijor\n\nFind elementary schools, high schools, integrated schools, and kindergarten centers. Search by school name, DepEd ID, or location.\n\n## School directory\n\n';
  page +=
    '| School | Municipality | Sector | Levels |\n| --- | --- | --- | --- |\n';
  for (const school of directory.schools)
    page += `| [${school.name}](/services/education/find-school?q=${encodeURIComponent(school.schoolId || school.name)}) | ${school.municipality} | ${school.sector} | ${school.levels.join(', ')} |\n`;
  page +=
    '\n## Sources and reference dates\n\nSchool lists supplied in `data/schools/`, exported **17 November 2026**. Duplicate school IDs are combined; different contact and staff listings retain their file labels. The export date does not establish current tenure or accreditation.\n';
  writeFileSync('content/services/education/find-school.md', page);
  console.log(
    `School directory: ${directory.schools.length} schools from ${directory.metadata.inputRecords} supplied entries; duplicate institutions combined.`
  );
}
