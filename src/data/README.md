# Navigation and categories

This folder configures the portal's navigation and category cards:

- `services.yaml`: service categories, descriptions, and icons.
- `government.yaml`: government information categories.
- `navigation.ts`: navigation links.
- `yamlLoader.ts`: category loading.

Category pages and their cards are listed in `content/<section>/<category>/index.yaml`. Each listed slug must have a matching Markdown page.

**Official records and source registers live in [`../../data/`](../../data/README.md).** Edit canonical records there, then run `npm run data:build`. Do not put factual records into navigation configuration or edit generated downloads in `public/data/`.

Keep descriptions short and focused on what a resident can do: get a document, find an office, prepare an application, or explore provincial records. Put provenance details in the page's source notes.
