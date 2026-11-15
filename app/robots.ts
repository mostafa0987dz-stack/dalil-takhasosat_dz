
import type { MetadataRoute } from 'next'

const SITE_URL = 'https://dalil-takhasosat-dz-main.xvertex.workers.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/favorites'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
