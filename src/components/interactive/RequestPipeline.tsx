// src/components/interactive/RequestPipeline.tsx
import React, { useState, useEffect } from 'react';

type Scenario = 'backend' | 'ai' | 'commerce';

interface NodeDetail {
  title: string;
  description: string;
  metric?: string;
}

export default function RequestPipeline() {
  const [activeScenario, setActiveScenario] = useState<Scenario>('backend');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  // Auto-increment simulated requests
  useEffect(() => {
    const interval = setInterval(() => {
      setRequestCount(c => c + 1);
    }, activeScenario === 'commerce' ? 400 : 1500);

    return () => clearInterval(interval);
  }, [activeScenario]);

  const getNodeDetail = (nodeId: string): NodeDetail => {
    const details: Record<string, NodeDetail> = {
      client: {
        title: "Cliente (App/Web)",
        description: "Dispositivo del usuario enviando solicitudes concurrentes mediante HTTPS.",
        metric: "Uptime: 100%"
      },
      gateway: {
        title: "API Gateway / Cloudflare",
        description: "Ruta de entrada global. Filtra tráfico malicioso, distribuye la carga y gestiona certificados SSL.",
        metric: "Tiempo de filtrado: < 1ms"
      },
      auth: {
        title: "Servicio de Autenticación",
        description: "Valida firmas criptográficas, tokens JWT y permisos de acceso deterministas.",
        metric: "Validación: JWT crypt"
      },
      logic: {
        title: "Lógica de Negocio / Agente IA",
        description: activeScenario === 'ai' 
          ? "Procesa el prompt, inyecta contexto de negocio (RAG) y orquesta el flujo de respuesta del modelo."
          : "Servidores escalables ejecutando código determinista optimizado para alta concurrencia.",
        metric: activeScenario === 'ai' ? "Contexto: 24KB RAG" : "Cómputo: Latencia baja"
      },
      db: {
        title: "Base de Datos (Supabase/Postgres)",
        description: "Almacenamiento ACID relacional. Ejecuta consultas indexadas y mantiene integridad referencial.",
        metric: "Pool: 99.99% saludable"
      },
      cache: {
        title: "Redis Cache / Queue",
        description: "Almacena respuestas de consultas frecuentes para evitar cálculos redundantes en BD.",
        metric: "Hit Rate: 92%"
      }
    };
    return details[nodeId] || { title: "Nodo Técnico", description: "Procesamiento de datos del sistema." };
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,19,0.4)] p-6 md:p-8 overflow-hidden group">
      {/* Mesh glow backdrop */}
      <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[rgba(50,255,126,0.04)] to-transparent opacity-50 pointer-events-none"></div>

      {/* Title & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 z-10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[var(--color-accent)] uppercase">Simulador de Infraestructura</span>
          <h3 className="text-xl font-bold text-white mt-1">Live Request Pipeline</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['backend', 'ai', 'commerce'] as Scenario[]).map((scenario) => (
            <button
              key={scenario}
              onClick={() => setActiveScenario(scenario)}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-bold uppercase transition-all duration-300 border ${
                activeScenario === scenario
                  ? 'bg-[var(--color-accent)] text-black border-[var(--color-accent)]'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {scenario}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Pipeline Visualization */}
      <div className="relative w-full overflow-x-auto no-scrollbar py-6 z-10 flex justify-center">
        <div className="min-w-[700px] w-full max-w-4xl relative">
          <svg viewBox="0 0 800 200" className="w-full h-auto overflow-visible select-none fill-none">
            {/* Defs for gradients, patterns and arrow markers */}
            <defs>
              <linearGradient id="glow-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="50%" stopColor="#32ff7e" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>

            {/* Connection Lines (Pipelines) */}
            {/* Client -> Gateway */}
            <path d="M 80,100 L 200,100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* Gateway -> Auth */}
            <path d="M 200,100 L 320,100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* Auth -> Logic */}
            <path d="M 320,100 L 460,100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* Logic -> DB */}
            <path d="M 460,100 L 620,100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* Logic -> Cache */}
            <path d="M 460,100 Q 540,160 620,160" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

            {/* Animated Data Pulse Paths (renders pulses traveling) */}
            {/* Client to Gateway */}
            <path
              d="M 80,100 L 200,100"
              stroke="url(#glow-line)"
              strokeWidth="3"
              strokeDasharray="40 100"
              className="animate-[dash_2s_linear_infinite]"
              style={{ animationDuration: activeScenario === 'commerce' ? '0.8s' : '2s' }}
            />
            {/* Gateway to Auth */}
            <path
              d="M 200,100 L 320,100"
              stroke="url(#glow-line)"
              strokeWidth="3"
              strokeDasharray="30 90"
              className="animate-[dash_1.8s_linear_infinite]"
              style={{ animationDelay: '0.3s', animationDuration: activeScenario === 'commerce' ? '0.7s' : '1.8s' }}
            />
            {/* Auth to Logic */}
            <path
              d="M 320,100 L 460,100"
              stroke="url(#glow-line)"
              strokeWidth="3"
              strokeDasharray="40 120"
              className="animate-[dash_2.2s_linear_infinite]"
              style={{ animationDelay: '0.6s', animationDuration: activeScenario === 'commerce' ? '0.9s' : '2.2s' }}
            />
            {/* Logic to DB */}
            <path
              d="M 460,100 L 620,100"
              stroke="url(#glow-line)"
              strokeWidth="3"
              strokeDasharray="30 110"
              className="animate-[dash_2.5s_linear_infinite]"
              style={{ animationDelay: '0.9s', animationDuration: activeScenario === 'commerce' ? '1s' : '2.5s' }}
            />
            {/* Logic to Cache */}
            <path
              d="M 460,100 Q 540,160 620,160"
              stroke="url(#glow-line)"
              strokeWidth="3"
              strokeDasharray="20 80"
              className="animate-[dash_2.8s_linear_infinite]"
              style={{ animationDelay: '1.2s', animationDuration: activeScenario === 'commerce' ? '1.1s' : '2.8s' }}
            />

            {/* Nodes */}
            {/* Client Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('client')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="80" cy="100" r="16" fill="#11171d" stroke={hoveredNode === 'client' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="80" y="104" textAnchor="middle" fill="white" className="text-[10px] font-mono font-bold">CLI</text>
            </g>

            {/* Gateway Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('gateway')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="200" cy="100" r="20" fill="#11171d" stroke={hoveredNode === 'gateway' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="200" y="104" textAnchor="middle" fill="white" className="text-[9px] font-mono font-bold">GATEWAY</text>
            </g>

            {/* Auth Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('auth')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="320" cy="100" r="20" fill="#11171d" stroke={hoveredNode === 'auth' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="320" y="104" textAnchor="middle" fill="white" className="text-[9px] font-mono font-bold">AUTH</text>
            </g>

            {/* Business Logic Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('logic')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="460" cy="100" r="24" fill="#11171d" stroke={hoveredNode === 'logic' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="460" y="104" textAnchor="middle" fill="white" className="text-[9px] font-mono font-bold">
                {activeScenario === 'ai' ? 'IA_RAG' : 'API_CORE'}
              </text>
            </g>

            {/* Database Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('db')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="620" cy="100" r="22" fill="#11171d" stroke={hoveredNode === 'db' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="620" y="104" textAnchor="middle" fill="white" className="text-[9px] font-mono font-bold">POSTGRES</text>
            </g>

            {/* Cache Node */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode('cache')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx="620" cy="160" r="18" fill="#11171d" stroke={hoveredNode === 'cache' ? '#32ff7e' : 'rgba(255,255,255,0.2)'} strokeWidth="2" className="transition-all duration-300" />
              <text x="620" y="164" textAnchor="middle" fill="white" className="text-[8px] font-mono font-bold">REDIS</text>
            </g>
          </svg>

          {/* Scenario active indicators */}
          {activeScenario === 'commerce' && (
            <div className="absolute right-4 top-0 border border-amber-500/30 bg-amber-500/10 px-3 py-1 rounded text-[10px] font-mono text-amber-500 uppercase animate-pulse">
              Simulating Traffic Spike (25k req/s)
            </div>
          )}
          {activeScenario === 'ai' && (
            <div className="absolute right-4 top-0 border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 rounded text-[10px] font-mono text-[var(--color-accent)] uppercase">
              RAG & Prompt Pipeline Enabled
            </div>
          )}
        </div>
      </div>

      {/* Node Info / Explanation Drawer */}
      <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-6 h-28 flex flex-col justify-center">
        {hoveredNode ? (
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-base font-bold text-white">{getNodeDetail(hoveredNode).title}</h4>
              {getNodeDetail(hoveredNode).metric && (
                <span className="rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-2 py-0.5 text-[10px] font-mono text-[var(--color-accent)]">
                  {getNodeDetail(hoveredNode).metric}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {getNodeDetail(hoveredNode).description}
            </p>
          </div>
        ) : (
          <div className="text-center text-sm font-mono text-[var(--color-text-muted)] opacity-60">
            Pasa el cursor por encima de los nodos para explorar la arquitectura del sistema.
            <div className="text-xs text-white/40 mt-1">Total peticiones procesadas: {requestCount}</div>
          </div>
        )}
      </div>
    </div>
  );
}
