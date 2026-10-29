'use client';

import { FormEvent, useState } from 'react';
import { api, LinkRow } from '@/lib/api';

export function CreateLinkForm({ onCreated }: { onCreated: (link: LinkRow) => void }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const link = await api.createLink(url.trim(), slug.trim() || undefined);
      onCreated(link);
      setUrl('');
      setSlug('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" data-testid="create-link-form" onSubmit={submit}>
      <label className="field">
        <span className="field-label">Destination URL</span>
        <input
          className="input"
          name="url"
          type="url"
          required
          placeholder="https://example.com/a-very-long-link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="field-label">Custom slug</span>
        <input
          className="input"
          name="slug"
          placeholder="optional"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Shortening…' : 'Shorten link'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
