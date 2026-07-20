import React, { useState } from 'react';

const steps = [
  {
    id: 'pedido',
    label: '1. Pedido',
    title: 'Ingreso del Pedido',
    description: 'El cliente confirma su compra en el e-commerce o el vendedor la registra en el sistema. Los datos del cliente, método de envío y detalles del pedido se guardan instantáneamente, sin necesidad de transcribirlos a un Excel.'
  },
  {
    id: 'pago',
    label: '2. Pago',
    title: 'Validación de Pago Automática',
    description: 'El sistema verifica la transferencia, código QR o pasarela de pago al instante. El estado del pedido se actualiza a "Pagado" de manera automática, eliminando la espera por conciliaciones manuales o envío de comprobantes.'
  },
  {
    id: 'inventario',
    label: '3. Inventario',
    title: 'Stock Sincronizado',
    description: 'En el preciso momento en que el pago es exitoso, el producto se descuenta del inventario general. Si un ítem se queda sin stock, desaparece del catálogo para evitar ventas fantasma.'
  },
  {
    id: 'reporte',
    label: '4. Reporte',
    title: 'Visibilidad en Tiempo Real',
    description: 'El dueño del negocio puede abrir su panel de control y ver cómo suben los ingresos del día. El área de contabilidad ya tiene la venta registrada y lista para el reporte mensual, sin doble trabajo.'
  }
];

export default function SalesFlow() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-16">
      
      {/* Stepper Navigation */}
      <div className="flex flex-col gap-2 md:w-1/3" role="tablist" aria-label="Flujo de venta">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={step.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`flow-panel-${step.id}`}
              onClick={() => setActiveStep(idx)}
              className={`text-left px-6 py-4 rounded-r-lg border-l-4 transition-colors focus:outline-none focus:bg-[var(--ds-surface)] ${
                isActive 
                  ? 'border-[var(--ds-accent)] bg-[var(--ds-surface)] text-white font-bold'
                  : 'border-[var(--ds-border)] text-[var(--ds-muted)] hover:bg-[var(--ds-surface)] hover:text-white'
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Content Panel */}
      <div className="md:w-2/3 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-8 min-h-[250px] flex flex-col justify-center">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <div
              key={`panel-${step.id}`}
              id={`flow-panel-${step.id}`}
              role="tabpanel"
              hidden={!isActive}
              className={`flex flex-col gap-4 ${isActive ? 'block animate-fade-in' : 'hidden'}`}
            >
              <h3 className="text-2xl font-bold text-[var(--ds-text)] font-display">{step.title}</h3>
              <p className="text-[var(--ds-muted)] leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
