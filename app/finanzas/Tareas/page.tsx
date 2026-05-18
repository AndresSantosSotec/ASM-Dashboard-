"use client"

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaskList from './components/TaskList';
import PaymentReconciliation from './components/PaymentReconciliation';
import Reports from './components/Reports';
import NotesManagement from './components/NotesManagement';
import Filters from './components/Filters';
import { ClipboardList, Replace, FileText, StickyNote, Filter } from 'lucide-react';

const FinancialDashboard = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
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
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Tareas</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <Replace className="h-4 w-4" />
            <span className="hidden sm:inline">Conciliación</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notas</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
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
                Carga de archivos y empalme automático con boletas de alumnos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentReconciliation />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Consolidados</CardTitle>
              <CardDescription>
                Visualización de pagos, deudas y estados de cuenta según el banco.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Reports />
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

        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Filtros</CardTitle>
              <CardDescription>
                Estandarización de búsqueda por fechas, cursos y montos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Filters />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;