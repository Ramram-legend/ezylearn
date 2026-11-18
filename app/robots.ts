import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.ezylearn.world';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api',
        '/auth',
        '/badges',
        '/dashboard',
        '/history',
        '/lessons',
        '/onboarding',
        '/profile',
        '/progress',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
