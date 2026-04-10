import { getDashboardStats, getTodayAppointments } from '@/services/receptionist';
import DashboardClient from './DashboardClient';

export default async function ReceptionistDashboard() {
  let stats = null;
  let appointments = [];
  let error = null;

  try {
    stats = await getDashboardStats();
    appointments = (await getTodayAppointments()).slice(0, 4);
  } catch (err) {
    console.error('Dashboard server error:', err);
    error = err.message;
  }

  return (
    <DashboardClient 
      initialStats={stats} 
      initialAppointments={appointments} 
      initialError={error}
    />
  );
}
