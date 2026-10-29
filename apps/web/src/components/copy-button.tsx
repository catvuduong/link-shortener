'use client';

import { useEffect, useState } from 'react';

export function CopyButton({ text, className = 'btn btn-small' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; the URL stays visible so it can be copied by hand.
    }
  }

  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
