import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes - no authentication required
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/createuser',
  '/api/hospital/stats',
  '/'
])

// Role-specific routes
const roleRoutes = {
  admin: createRouteMatcher(['/admin(.*)']),
  doctor: createRouteMatcher(['/doctor(.*)']),
  patient: createRouteMatcher(['/patient(.*)']),
  nurse: createRouteMatcher(['/nurse(.*)']),
  pharmacist: createRouteMatcher(['/pharmacist(.*)']),
  finance: createRouteMatcher(['/finance(.*)']),
  receptionist: createRouteMatcher(['/receptionist(.*)']),
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protect all other routes - if not logged in, redirect to homepage (which will show the landing page)
  if (!userId) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Only check role access for actual pages, not API routes or static files
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    let userRole = null;
    
    try {
      // Fetch user role from our own API
      // Pass the cookie so the API route can authenticate the Clerk user
      const roleResponse = await fetch(new URL('/api/auth/user', req.url), {
        headers: {
          cookie: req.headers.get('cookie') || ''
        }
      });
      
      if (roleResponse.ok) {
        const data = await roleResponse.json();
        if (data?.success && data?.data?.role) {
          userRole = data.data.role.toLowerCase();
        }
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error fetching user role:', error);
    }

    if (userRole) {
      // Check if user is trying to access a route that doesn't match their role
      for (const [role, matcher] of Object.entries(roleRoutes)) {
        if (matcher(req) && userRole !== role) {
          // If they try to access another role's route, send them to their own dashboard
          return NextResponse.redirect(new URL(`/${userRole}/dashboard`, req.url));
        }
      }
    } else {
      // If we couldn't get the role but they are logged in, redirect to homepage 
      // The homepage has logic to figure it out or retry
      if (req.nextUrl.pathname !== '/') {
         return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}