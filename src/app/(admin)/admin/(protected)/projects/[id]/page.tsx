import { CmsEditor } from '@/shared/admin/cms-editor';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CmsEditor key={'projects-' + id} resource="projects" id={id} />;
}
