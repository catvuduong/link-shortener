'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, ApiError, LinkRow, shortUrl } from '@/lib/api';
import { CopyButton } from './copy-button';

interface Props {
  links: LinkRow[] | null;
  error: string | null;
  onRetry: () => void;
  onDeleted: (slug: string) => void;
}

export function LinksTable({ links, error, onRetry, onDeleted }: Props) {
  if (error) {
    return (
      <div className="state" role="alert">
        <p className="state-title">Couldn&apos;t load your links</p>
        <p className="error-banner">{error}</p>
        <button type="button" className="btn btn-small" onClick={onRetry} style={{ marginTop: 12 }}>
          Try again
        </button>
      </div>
    );
  }

  if (links === null) {
    return (
      <div className="state" aria-busy="true" aria-label="Loading links">
        <div style={{ display: 'grid', gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="skeleton" style={{ width: `${70 - i * 10}%`, margin: '0 auto' }} />
          ))}
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="state">
        <p className="state-title">No links yet</p>
        <p>Shorten your first URL above and it will show up here.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Short link</th>
            <th className="hide-sm">Destination</th>
            <th className="num">Clicks</th>
            <th className="hide-sm">Created</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <LinkRowItem key={link.slug} link={link} onDeleted={onDeleted} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkRowItem({ link, onDeleted }: { link: LinkRow; onDeleted: (slug: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = shortUrl(link.slug);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteLink(link.slug);
      onDeleted(link.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <tr data-testid="link-row">
      <td>
        <a
          className="short-url"
          data-testid="short-url"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {url}
        </a>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
      </td>
      <td className="hide-sm">
        <span className="cell-truncate" title={link.targetUrl}>
          {link.targetUrl}
        </span>
      </td>
      <td className="num" data-testid="click-count">
        {link.clicks.toLocaleString()}
      </td>
      <td className="hide-sm muted">{new Date(link.createdAt).toLocaleDateString()}</td>
      <td>
        <div className="actions">
          <CopyButton text={url} />
          <Link className="btn btn-small" href={`/links/${link.slug}`}>
            Stats
          </Link>
          <button type="button" className="btn btn-small btn-danger" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}
