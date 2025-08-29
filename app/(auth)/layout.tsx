import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex justify-center items-center min-h-screen">
        {children}
      </div>
    </div>
  );
}