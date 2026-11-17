import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Banner } from '@bettergov/kapwa/banner';
import { Card, CardHeader } from '@bettergov/kapwa/card';
import {
  loadMarkdownContent,
  type MarkdownContent,
} from '../lib/markdownLoader';
import { createMarkdownComponents } from '../lib/markdownComponents';
import { getTypographyTheme } from '../lib/typographyThemes';
import SEO from '../components/SEO';
const standalonePages = import.meta.glob('../../content/pages/*.md', {
  query: '?raw',
  import: 'default',
});
const components = createMarkdownComponents(getTypographyTheme('default'));
export default function Document({
  categoryType,
}: {
  categoryType?: 'service' | 'government';
}) {
  const { documentSlug, category } = useParams();
  const [result, setResult] = useState<{
    key: string;
    document?: MarkdownContent;
    error?: boolean;
  }>({ key: '' });
  const key = `${categoryType}/${category}/${documentSlug}`;
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let doc: MarkdownContent;
        if (categoryType && category && documentSlug) {
          doc = await loadMarkdownContent(documentSlug, category, categoryType);
        } else {
          const loader =
            standalonePages[`../../content/pages/${documentSlug}.md`];
          if (!loader) throw new Error('Page not found');
          const content = (await loader()) as string;
          doc = { content, title: content.match(/^#\s+(.+)$/m)?.[1] };
        }
        if (active) setResult({ key, document: doc });
      } catch {
        if (active) setResult({ key, error: true });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [key, category, categoryType, documentSlug]);
  const loading = result.key !== key;
  const doc = result.document;
  const citationIndex =
    doc?.content.search(
      /^## Source(?:s)?(?: and dates| and review| citations?| and reference dates)?\s*$/m
    ) ?? -1;
  const mainContent =
    citationIndex >= 0 ? doc!.content.slice(0, citationIndex) : doc?.content;
  const citations =
    citationIndex >= 0
      ? doc!.content.slice(citationIndex).replace(/^##[^\n]*\n/, '')
      : '';
  return (
    <>
      <SEO title={loading ? 'Loading' : doc?.title || 'Page not found'} />
      <Section className="mb-12">
        <Breadcrumbs className="mb-8" />
        {loading ? (
          <p role="status">Loading information…</p>
        ) : result.error ? (
          <>
            <Banner
              type="error"
              title="Page not found"
              description="This page is not in the current edition of BetterSiquijor."
              icon
            />
            <Link
              to="/"
              className="inline-block mt-6 text-primary-600 underline"
            >
              Return to the homepage
            </Link>
          </>
        ) : doc ? (
          <Card className="mb-8 markdown-content">
            <CardHeader>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {mainContent}
              </ReactMarkdown>
              {citations ? (
                <details className="mt-8 border-t border-gray-200 pt-5">
                  <summary className="cursor-pointer font-medium text-primary-700">
                    Sources and reference dates
                  </summary>
                  <div className="pt-5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {citations}
                    </ReactMarkdown>
                  </div>
                </details>
              ) : null}
            </CardHeader>
          </Card>
        ) : null}
      </Section>
    </>
  );
}
