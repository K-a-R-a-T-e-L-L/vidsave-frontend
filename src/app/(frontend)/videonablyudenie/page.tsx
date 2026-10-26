import SurveillancePage from '@/widgets/pages/SurveillancePage/SurveillancePage';
import { siteMetadata } from '@/app/lib/cms';
import { surveillanceContent } from '@/widgets/pages/SurveillancePage/surveillance.data';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return siteMetadata(surveillanceContent.title, surveillanceContent.description, surveillanceContent.path);
}

export default function Page() {
  return <SurveillancePage />;
}
