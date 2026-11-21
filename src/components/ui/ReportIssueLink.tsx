import { Flag } from 'lucide-react';
import { Link } from 'react-router';

type ReportIssueLinkProps = {
  recordType: string;
  recordId: string;
  recordName: string;
  pagePath: string;
  className?: string;
};

const GITHUB_ISSUES_URL =
  'https://github.com/BetterSiquijor/BetterSiquijor/issues/new';

/**
 * Renders a compact, resident-facing link to report an outdated number,
 * address, or record detail via a pre-filled GitHub issue or the corrections guide.
 */
export default function ReportIssueLink({
  recordType,
  recordId,
  recordName,
  pagePath,
  className = '',
}: ReportIssueLinkProps) {
  const title = `Correction: ${recordName} (${recordId})`;
  const body = [
    `**Record type:** ${recordType}`,
    `**Record ID:** \`${recordId}\``,
    `**Record name:** ${recordName}`,
    `**Page:** https://bettersiquijor.vercel.app${pagePath}`,
    '',
    '### What needs updating?',
    'Please describe the outdated or incorrect detail (for example, a changed telephone number, office address, or course list).',
    '',
    '### Official source or link (if available)',
    'Share an official government page, agency Facebook post, or document photo/link if you have one.',
  ].join('\n');

  const issueUrl = `${GITHUB_ISSUES_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 ${className}`}
    >
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary-700 hover:underline font-medium"
      >
        <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Report outdated info
      </a>
      <span aria-hidden="true">·</span>
      <Link
        to="/government/sources/corrections"
        className="text-gray-600 hover:text-primary-700 underline"
      >
        Other ways to send a correction
      </Link>
    </div>
  );
}
