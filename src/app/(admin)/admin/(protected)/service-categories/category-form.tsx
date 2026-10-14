import { CmsEditor } from '@/shared/admin/cms-editor';
export function CategoryForm({ categoryId }: { categoryId?: string }) {
  return <CmsEditor key={categoryId ?? 'new'} resource="service-categories" id={categoryId} />;
}
