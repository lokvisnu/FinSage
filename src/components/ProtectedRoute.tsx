"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User needs to be authenticated but isn't
        setShouldRedirect(true);
        router.replace("/auth/login");
        return;
      } 
      
      if (!requireAuth && user) {
        // User is authenticated but shouldn't be (like on login/signup pages)
        setShouldRedirect(true);
        router.replace("/dashboard");
        return;
      }
      
      setShouldRedirect(false);
    }
  }, [user, loading, requireAuth, router]);

  // Show loading spinner while checking authentication or redirecting
  if (loading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-white text-lg">
            {shouldRedirect ? "Redirecting..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  // Don't render children if auth check failed and we need auth
  if (requireAuth && !user) {
    return null;
  }

  // Don't render children if user is authenticated but shouldn't be
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}
