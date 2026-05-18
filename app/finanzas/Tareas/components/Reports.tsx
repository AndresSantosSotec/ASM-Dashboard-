import React from 'react';

const Reports = () => {
  return (
    <div className="reports-container">
      <header className="reports-header">
        <h1>Gestión Financiera - Reportes Consolidados</h1>
      </header>
      <main className="reports-content">
        <p>Esta es la vista inicial para los reportes consolidados. Aquí se mostrarán los datos relacionados con los pagos, cuotas y servicios.</p>
        <ul>
          <li>Reporte de pagos consolidados</li>
          <li>Reporte de cuotas y servicios</li>
          <li>Reporte de conciliaciones</li>
        </ul>
      </main>
    </div>
  );
};

export default Reports;