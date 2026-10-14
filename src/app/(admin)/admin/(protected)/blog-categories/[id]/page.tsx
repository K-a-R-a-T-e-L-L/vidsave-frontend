import { CmsEditor } from '@/shared/admin/cms-editor';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CmsEditor key={'blog-categories-' + id} resource="blog-categories" id={id} />;
}
