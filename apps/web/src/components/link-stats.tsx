'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, ApiError, LinkStats, shortUrl } from '@/lib/api';
import { CopyButton } from './copy-button';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; stats: LinkStats };

export function LinkStatsView({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    api.getStats(slug).then(
      (stats) => {
        if (!cancelled) setState({ status: 'ready', stats });
      },
      (err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && err.status === 404
            ? `No link named "${slug}".`
            : err instanceof Error
              ? err.message
              : 'Something went wrong';
        setState({ status: 'error', message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          link-shortener
        </Link>
        <Link href="/" className="btn btn-small">
          All links
        </Link>
      </header>

      {state.status === 'loading' && <LinkStatsSkeleton />}
      {state.status === 'error' && (
        <div className="card state" role="alert">
          <p className="state-title">Couldn&apos;t load these stats</p>
          <p className="error-banner">{state.message}</p>
        </div>
      )}
      {state.status === 'ready' && <Stats stats={state.stats} />}
    </main>
  );
}

export function LinkStatsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading stats" style={{ display: 'grid', gap: 24 }}>
      <span className="skeleton" style={{ width: 240, height: 28 }} />
      <div className="kpis">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ height: 88 }}>
            <span className="skeleton" style={{ width: '50%' }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ height: 320 }} />
    </div>
  );
}

function Stats({ stats }: { stats: LinkStats }) {
  const url = shortUrl(stats.slug);
  const last14Days = stats.clicksPerDay.reduce((sum, day) => sum + day.clicks, 0);
  const topReferrer = stats.topReferrers[0];
  const chartData = stats.clicksPerDay.map((day) => ({ label: formatDay(day.date), clicks: day.clicks }));

  return (
    <>
      <section style={{ display: 'grid', gap: 12 }}>
        <div>
          <h1 className="page-title">
            <a href={url} target="_blank" rel="noreferrer">
              /r/{stats.slug}
            </a>
          </h1>
          <p className="page-subtitle">
            Redirects to{' '}
            <a href={stats.targetUrl} target="_blank" rel="noreferrer">
              {stats.targetUrl}
            </a>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyButton text={url} className="btn btn-small" />
        </div>
      </section>

      <section className="kpis" aria-label="Summary">
        <Kpi label="Total clicks" value={stats.totalClicks.toLocaleString()} />
        <Kpi label="Last 14 days" value={last14Days.toLocaleString()} />
        <Kpi label="Top referrer" value={topReferrer ? referrerLabel(topReferrer.referrer) : '—'} />
        <Kpi label="Created" value={new Date(stats.createdAt).toLocaleDateString()} />
      </section>

      <div className="stats-grid">
        <section className="card" aria-labelledby="clicks-heading">
          <h2 id="clicks-heading" className="card-title">
            Clicks per day
          </h2>
          <p className="card-hint">UTC days, last 14 days</p>
          {stats.totalClicks === 0 ? (
            <div className="state">
              <p className="state-title">No clicks yet</p>
              <p>Share the short link and clicks will show up here.</p>
            </div>
          ) : (
            <div className="chart-box stats-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <div className="stats-side">
          <section className="card" aria-labelledby="referrers-heading">
            <h2 id="referrers-heading" className="card-title">
              Top referrers
            </h2>
            <p className="card-hint">All time</p>
            {stats.topReferrers.length === 0 ? (
              <p className="muted">No referrers yet.</p>
            ) : (
              <BarList
                rows={stats.topReferrers.map((row) => ({ name: referrerLabel(row.referrer), clicks: row.clicks }))}
                total={stats.totalClicks}
              />
            )}
          </section>

          <section className="card" aria-labelledby="devices-heading">
            <h2 id="devices-heading" className="card-title">
              Devices
            </h2>
            <p className="card-hint">All time</p>
            {stats.devices.length === 0 ? (
              <p className="muted">No device data yet.</p>
            ) : (
              <BarList
                rows={stats.devices.map((row) => ({ name: capitalize(row.device), clicks: row.clicks }))}
                total={stats.totalClicks}
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function BarList({ rows, total }: { rows: { name: string; clicks: number }[]; total: number }) {
  return (
    <ul className="bar-list">
      {rows.map((row) => {
        const share = total > 0 ? Math.round((row.clicks / total) * 100) : 0;
        return (
          <li key={row.name} className="bar-row">
            <span className="bar-row-name">{row.name}</span>
            <span className="bar-row-value">
              {row.clicks.toLocaleString()} · {share}%
            </span>
            <div className="bar-track" role="presentation">
              <div className="bar-fill" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function referrerLabel(referrer: string): string {
  return referrer === 'direct' ? 'Direct' : referrer;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
