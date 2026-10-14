import { cmsPageMetadata } from '@/app/lib/cms';
import AudiencePage from '@/app/components/PublicPage/AudiencePage';
import { audienceContent } from '@/app/lib/public-content';

const content = audienceContent.home;
export async function generateMetadata() {
  return cmsPageMetadata('for-home', content.title, content.description, content.path);
}
export const dynamic = 'force-dynamic';
export default function Page() {
  return <AudiencePage audience="home" />;
}
