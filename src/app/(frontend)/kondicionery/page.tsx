import TradePage from '@/widgets/pages/TradePage/TradePage';
import { tradeContent } from '@/widgets/pages/TradePage/trade.data';
import { siteMetadata } from '@/app/lib/cms';
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  const data = tradeContent.climate;
  return siteMetadata(data.title, data.description, data.path);
}
export default function Page() {
  return <TradePage kind="climate" />;
}
