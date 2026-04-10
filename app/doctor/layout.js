import DoctorNavbar from '@/components/DoctorNavbar';

export const metadata = {
  title: 'Doctor Portal - MedSync HMS',
  description: 'Doctor clinical portal for patient management and appointments',
};

export default function DoctorLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <DoctorNavbar />
      <main style={{ marginLeft: 'auto', width: '100%' }} className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}
