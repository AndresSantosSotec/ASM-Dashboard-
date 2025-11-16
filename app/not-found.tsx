"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="p-12 text-center">
          <div className="mb-8">
            <FileQuestion className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Página no encontrada
            </h2>
            <p className="text-gray-600 mb-8">
              Lo sentimos, no pudimos encontrar la página que estás buscando.
              Es posible que la URL sea incorrecta o que el recurso haya sido movido.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver atrás
            </Button>
            <Link href="/dashboard">
              <Button size="lg" className="flex items-center gap-2 w-full sm:w-auto">
                <Home className="h-5 w-5" />
                Ir al inicio
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Si crees que esto es un error, por favor contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
