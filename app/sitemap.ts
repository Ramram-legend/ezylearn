import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.ezylearn.world';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
