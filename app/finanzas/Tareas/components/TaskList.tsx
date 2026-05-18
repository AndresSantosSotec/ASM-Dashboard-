import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const tasks = [
  { id: 1, title: 'Enviar facturas pendientes - Mayo', status: 'pending', priority: 'high', date: '2024-05-15' },
  { id: 2, title: 'Distribuir pagos no consolidados (Bank A)', status: 'action_required', priority: 'critical', date: '2024-05-14' },
  { id: 3, title: 'Validar cuotas gastos electrónicos (Alumna reporte)', status: 'in_progress', priority: 'medium', date: '2024-05-15' },
];

const TaskList = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Próximas Acciones</h3>
        <Button size="sm">Nueva Tarea</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarea</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {task.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {task.status === 'action_required' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {task.status === 'in_progress' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                  <span className="capitalize">{task.status.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={task.priority === 'critical' ? 'destructive' : 'outline'}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>{task.date}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Ver detalles</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskList;