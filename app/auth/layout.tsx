"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Don't redirect if on password reset page - user has recovery session
        if (pathname === "/auth/reset-password") {
          setIsLoading(false);
          return;
        }

        const user = await getCurrentUser();
        if (user) {
          // Already logged in, redirect to dashboard
          router.push("/dashboard");
        }
      } catch {
        // Not authenticated, allow access to auth pages
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)"
        }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#5f462d" }}
          ></div>
          <p style={{ color: "#5f462d" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
