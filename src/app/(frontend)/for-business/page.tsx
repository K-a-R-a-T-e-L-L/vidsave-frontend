import { cmsPageMetadata } from '@/app/lib/cms';
import AudiencePage from '@/app/components/PublicPage/AudiencePage';
import { audienceContent } from '@/app/lib/public-content';

const content = audienceContent.business;
export async function generateMetadata() {
  return cmsPageMetadata('for-business', content.title, content.description, content.path);
}
export const dynamic = 'force-dynamic';
export default function Page() {
  return <AudiencePage audience="business" />;
}
