export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sources/:path*',
    '/pipeline/:path*',
    '/repository/:path*',
    '/reports/:path*',
    '/insights/:path*',
    '/saved/:path*',
    '/collaboration/:path*',
    '/billing/:path*',
    '/settings/:path*',
    '/roadmap/:path*',
    '/api/sources/:path*',
    '/api/pipeline/:path*',
    '/api/repository/:path*',
    '/api/reports/:path*',
    '/api/insights/:path*',
    '/api/saved-views/:path*',
    '/api/collaboration/:path*',
    '/api/billing/:path*',
    '/api/settings/:path*',
    '/api/uploads/:path*',
    '/api/workspaces/:path*',
  ],
};
