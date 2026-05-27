"use client"

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaskList from './components/TaskList';
import PaymentReconciliation from './components/PaymentReconciliation';
import NotesManagement from './components/NotesManagement';
import ReportesLitePanel from './components/ReportesLitePanel';
import { ClipboardList, Replace, StickyNote, LayoutPanelTop } from 'lucide-react';

const FinancialDashboard = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');
  const [activeTab, setActiveTab] = useState(tabParam || 'tasks');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión Financiera</h1>
          <p className="text-muted-foreground">
            Módulo centralizado para conciliaciones, tareas financieras y reportes.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4 lg:w-full">
          <TabsTrigger value="tasks" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 text-xs md:text-sm">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Tareas</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 text-xs md:text-sm">
            <Replace className="h-4 w-4" />
            <span className="hidden sm:inline">Conciliación</span>
          </TabsTrigger>

          <TabsTrigger value="notes" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 text-xs md:text-sm">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notas</span>
          </TabsTrigger>

          <TabsTrigger value="overview" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 text-xs md:text-sm">
            <LayoutPanelTop className="h-4 w-4" />
            <span className="hidden lg:inline">Mantenimientos Financieros (Lite)</span>
            <span className="hidden sm:inline lg:hidden">Mantenimientos (Lite)</span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tablero de Tareas</CardTitle>
              <CardDescription>
                Gestión de facturas pendientes, distribución de pagos y recordatorios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Conciliación Bancaria</CardTitle>
              <CardDescription>
                Vistas separadas para Conciliación, Historial y Kardex sin conciliar con flujo guiado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentReconciliation initialView={viewParam} />
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Notas</CardTitle>
              <CardDescription>
                Carga masiva de notas y seguimiento de comentarios por tarea.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotesManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos Financieros (Lite)</CardTitle>
              <CardDescription>
                Secciones de Kardex, Conciliaciones y Cuotas integradas en Tareas con carga diferida por módulo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportesLitePanel />
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default FinancialDashboard;