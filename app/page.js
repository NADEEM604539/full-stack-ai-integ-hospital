import { redirect } from 'next/navigation';
import { getUserRole } from '@/services/auth';

export default async function Home() {
  let role;

  try {
    // Get user role directly from service
    role = await getUserRole();
  } catch (error) {
    console.error('Error getting user role:', error.message);
    // If not authenticated or error, show loading page
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to role-based dashboard (outside try-catch)
  redirect(`/${role.toLowerCase()}/dashboard`);
}
