import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'FeatureIntel Next.js Starter',
  description: 'SaaS starter for feature intelligence workflows',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
