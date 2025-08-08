import React from "react";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">403 - Acceso no autorizado</h1>
      <p>No tienes permiso para ver esta página.</p>
    </div>
  );
}
