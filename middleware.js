import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/createuser'])

// Role to allowed paths mapping
const rolePathsMap = {
  1: ['/admin', '/'], // Admin
  2: ['/patient', '/'], // Patient
  3: ['/doctor', '/'], // Doctor
  4: ['/nurse', '/'], // Nurse
  5: ['/pharmacist', '/'], // Pharmacist
  6: ['/finance', '/'], // Finance
  7: ['/receptionist', '/'], // Receptionist
}

// Routes that don't require role verification (public or auth-only)
const noRoleCheckRoutes = createRouteMatcher([
  '/api(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/'
])

// Get user's role from database
async function getUserRole(userId) {
  try {
    const connection = await db.getConnection()
    const [results] = await connection.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [userId]
    )
    connection.release()
    
    if (results.length > 0) {
      return results[0].role_id
    }
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

// Check if path is allowed for role
function isPathAllowedForRole(pathname, roleId) {
  if (!roleId) return false
  
  const allowedPaths = rolePathsMap[roleId]
  if (!allowedPaths) return false
  
  // Check if pathname matches any allowed path
  return allowedPaths.some(path => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path + '/')
  })
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth()
  const { pathname } = req.nextUrl

  // Public routes - always allow
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // API routes and routes without role checks
  if (noRoleCheckRoutes(req)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }
  }

  // Protect authenticated routes
  if (!userId) {
    await auth.protect()
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Get user role
  const roleId = await getUserRole(userId)
  
  if (!roleId) {
    // User doesn't have a role yet, allow them to view home page
    if (pathname === '/') {
      return NextResponse.next()
    }
    // Block access to role-specific routes
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Check if user has access to this route
  if (!isPathAllowedForRole(pathname, roleId)) {
    // Redirect to appropriate home route based on role
    const homeRoutes = {
      1: '/admin/dashboard',
      2: '/patient/dashboard',
      3: '/doctor/dashboard',
      4: '/nurse/dashboard',
      5: '/pharmacist/dashboard',
      6: '/finance/dashboard',
      7: '/receptionist/dashboard',
    }
    
    const homeRoute = homeRoutes[roleId] || '/'
    return NextResponse.redirect(new URL(homeRoute, req.url))
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