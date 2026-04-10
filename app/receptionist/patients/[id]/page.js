import PatientDetailClient from './PatientDetailClient';
import { getPatientById } from '@/services/receptionist';

export default async function PatientDetailPage({ params }) {
  const { id } = await params;

  if (!id) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p style={{ color: '#E74C3C' }} className="text-lg font-bold">
              Patient ID is invalid
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch patient data server-side directly from service
  let initialData = null;
  let fetchError = null;

  try {
    initialData = await getPatientById(parseInt(id, 10));
    if (!initialData) {
      fetchError = 'Patient not found';
    }
  } catch (err) {
    fetchError = err.message || 'Failed to load patient data';
  }

  return <PatientDetailClient patientId={id} initialData={initialData} initialError={fetchError} />;
}
