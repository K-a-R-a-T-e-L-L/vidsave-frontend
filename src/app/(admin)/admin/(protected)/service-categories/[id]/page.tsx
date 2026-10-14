import { CategoryForm } from '../category-form';
export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  return <CategoryForm categoryId={(await params).id} />;
}
