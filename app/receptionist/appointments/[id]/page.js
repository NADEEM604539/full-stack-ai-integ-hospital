import AppointmentDetailClient from './AppointmentDetailClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentDetailPage({ params }) {
  const { id } = await params;

  if (!id) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <p style={{ color: '#E74C3C' }} className="text-lg font-bold">Invalid appointment ID</p>
      </div>
    );
  }

  return <AppointmentDetailClient appointmentId={id} />;
}
