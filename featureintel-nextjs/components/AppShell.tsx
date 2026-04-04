'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { navItems } from '@/data/mock';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <div><strong>FeatureIntel</strong></div>
            <div className="small">Next.js SaaS starter</div>
          </div>
        </div>

        <div className="panel">
          <div className="small">Architecture</div>
          <div className="stack" style={{ marginTop: 10 }}>
            <div>React / Next.js front end</div>
            <div>API gateway + workers</div>
            <div>NLP / LLM extraction</div>
            <div>Feature repository + graph</div>
            <div>Tenant RBAC + audit</div>
          </div>
        </div>

        <nav className="nav" style={{ marginTop: 12 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn('nav-link', pathname === item.href && 'active')}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="hero-title">Feature Intelligence Platform</h1>
            <div className="muted">Architecture, wireframes, screens, and flow converted into full Next.js app structure</div>
          </div>
          <div className="top-actions">
            <input className="search" placeholder="Search features, reports, sources..." />
            <button className="btn">Alerts</button>
            <button className="btn primary">Ingest Data</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
