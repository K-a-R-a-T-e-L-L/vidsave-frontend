import { ServiceForm } from '../service-form';
export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  return <ServiceForm serviceId={(await params).id} />;
}
