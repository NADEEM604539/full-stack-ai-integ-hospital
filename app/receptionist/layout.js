import ReceptionistNavbar from '@/components/ReceptionistNavbar';

export const metadata = {
  title: 'Receptionist Dashboard - MedSync HMS',
  description: 'Hospital receptionist management portal',
};

export default function ReceptionistLayout({ children }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <ReceptionistNavbar />
      
      {/* Main Content Area */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
