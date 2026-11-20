import { getContentList, getCmsBootstrap } from '@/app/lib/cms';
import { absoluteUrl } from '@/app/lib/site';
import { escapeXml } from '@/app/lib/xml';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [{ items }, { settings }] = await Promise.all([
    getContentList('posts', 'placement=feed&limit=30'),
    getCmsBootstrap(),
  ]);
  const entries = items
    .map((post) => {
      const link = escapeXml(absoluteUrl('/blog/' + post.slug));
      return (
        '<item><title>' +
        escapeXml(post.title) +
        '</title><link>' +
        link +
        '</link><guid isPermaLink="true">' +
        link +
        '</guid><description>' +
        escapeXml(post.excerpt) +
        '</description>' +
        (post.publishedAt ? '<pubDate>' + new Date(post.publishedAt).toUTCString() + '</pubDate>' : '') +
        '</item>'
      );
    })
    .join('');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>' +
    escapeXml(settings.companyName) +
    ' — Блог</title><link>' +
    absoluteUrl('/blog') +
    '</link><description>Статьи о видеонаблюдении, кондиционерах и электромонтаже.</description><language>ru</language>' +
    entries +
    '</channel></rss>';
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
