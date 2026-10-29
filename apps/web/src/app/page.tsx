'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreateLinkForm } from '@/components/create-link-form';
import { LinksTable } from '@/components/links-table';
import { API_URL, api, LinkRow } from '@/lib/api';

export default function Home() {
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.listLinks().then(
      (rows) => {
        setLinks(rows);
        setError(null);
      },
      (err: Error) => setError(err.message),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">link-shortener</span>
      </header>

      <section aria-labelledby="create-heading" style={{ display: 'grid', gap: 12 }}>
        <div>
          <h1 id="create-heading" className="page-title">
            Shorten a link
          </h1>
          <p className="page-subtitle">Short links redirect instantly and count every click.</p>
        </div>
        <CreateLinkForm
          onCreated={(link) => setLinks((prev) => [link, ...(prev ?? [])])}
        />
      </section>

      <section className="card" aria-labelledby="links-heading">
        <div style={{ marginBottom: 16 }}>
          <h2 id="links-heading" className="card-title">
            Your links
          </h2>
          <p className="card-hint">Click counts include every redirect since the link was created.</p>
        </div>
        <LinksTable
          links={links}
          error={error}
          onRetry={load}
          onDeleted={(slug) => setLinks((prev) => (prev ?? []).filter((link) => link.slug !== slug))}
        />
      </section>

      <Health />
    </main>
  );
}

function Health() {
  const [status, setStatus] = useState('checking…');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((d) => setStatus(`api ${d.status} / db ${d.db}`))
      .catch(() => setStatus('api unreachable'));
  }, []);

  return (
    <footer className="footer">
      <span data-testid="health">{status}</span>
    </footer>
  );
}
