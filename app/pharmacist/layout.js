import PharmacistNavbar from '@/components/PharmacistNavbar';

export default function PharmacistLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <PharmacistNavbar />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
