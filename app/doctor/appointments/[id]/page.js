import AppointmentDetailClient from './AppointmentDetailClient';

export const metadata = {
  title: 'Appointment Details - Doctor Portal',
  description: 'View appointment details and manage SOAP notes',
};

export default async function AppointmentDetailPage({ params }) {
  const { id } = await params;
  return <AppointmentDetailClient appointmentId={id} />;
}
