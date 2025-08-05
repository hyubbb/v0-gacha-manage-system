"use client";

import type React from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { BranchProvider } from "@/contexts/branch-context";
import { GachaProvider } from "@/contexts/gacha-context";
import LoginForm from "@/components/login-form";
import Sidebar from "@/components/layout/sidebar";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <BranchProvider>
      <GachaProvider>
        <div className='flex h-screen bg-gray-100'>
          <Sidebar />
          <main className='flex-1 overflow-y-auto'>{children}</main>
        </div>
      </GachaProvider>
    </BranchProvider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
