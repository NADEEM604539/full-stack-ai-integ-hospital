import AppointmentDetailClient from './AppointmentDetailClient';

export default async function AppointmentDetailPage({ params }) {
  const { id } = params;

  return <AppointmentDetailClient appointmentId={id} />;
}
