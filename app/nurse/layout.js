import NurseNavbar from '@/components/NurseNavbar';

export const metadata = {
  title: 'Nurse Portal - MedSync HMS',
  description: 'Nurse clinical portal for patient vitals, encounters, and clinical support',
};

export default function NurseLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <NurseNavbar />
      <main style={{ width: '100%' }} className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}
