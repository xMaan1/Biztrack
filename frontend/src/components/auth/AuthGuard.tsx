'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // List of public routes that don't require authentication
  const publicRoutes = [
    '/', // Landing page
    '/login', // Login page
    '/signup', // Signup page
    '/client-portal', // Client portal (if exists)
    '/api', // API routes
    '/_next', // Next.js internal routes
    '/favicon.ico', // Favicon
    '/manifest.json', // PWA manifest
  ];

  // List of protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/inventory',
    '/pos',
    '/crm',
    '/sales',
    '/time-tracking',
    '/team',
    '/projects',
    '/events',
    '/tasks',
    '/users',
    '/workspace',
    '/reports',
    '/hrm',
    '/workshop-management/production',
    '/workshop-management/quality-control',
  ];

  // Check if current route is public
  const isPublicRoute = useMemo(() => {
    return publicRoutes.some((route) => pathname?.startsWith(route));
  }, [pathname]);

  // Check if current route is protected
  const isProtectedRoute = useMemo(() => {
    return protectedRoutes.some((route) => pathname?.startsWith(route));
  }, [pathname]);

  useEffect(() => {
    if (!loading) {
      // If user is not authenticated and trying to access protected route
      if (!isAuthenticated && isProtectedRoute) {
        router.push('/login');
        return;
      }

      // If user is authenticated and trying to access login/signup pages
      if (
        isAuthenticated &&
        (pathname === '/login' || pathname === '/signup')
      ) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, loading, pathname, router, isProtectedRoute]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Initializing...</p>
          <p className="text-sm text-gray-500">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    );
  }

  // For public routes, render children without authentication check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (!isAuthenticated) {
    // Show a brief loading state before redirect to prevent flash
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
