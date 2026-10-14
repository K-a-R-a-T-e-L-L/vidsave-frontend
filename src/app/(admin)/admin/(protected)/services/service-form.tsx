import { CmsEditor } from '@/shared/admin/cms-editor';
export function ServiceForm({ serviceId }: { serviceId?: string }) {
  return <CmsEditor key={serviceId ?? 'new'} resource="services" id={serviceId} />;
}
