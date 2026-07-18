// src/components/interactive/DiagnosticForm.tsx
import React, { useRef, useState } from 'react';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  need: string;
  bottleneck: string;
  stage: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  website: string;
  consent: boolean;
}

const INITIAL_DATA: FormData = {
  need: '',
  bottleneck: '',
  stage: '',
  name: '',
  email: '',
  company: '',
  phone: '',
  website: '',
  consent: false
};

export default function DiagnosticForm() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const requestId = useRef<string | null>(null);
  const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

  const markEdited = () => {
    if (requestId.current) requestId.current = null;
    setSubmitError('');
  };

  const needsList = [
    { id: 'backend', label: 'Backend y APIs a medida', desc: 'Sistemas a medida, bases de datos y control de stock.' },
    { id: 'ai', label: 'IA y Automatización', desc: 'Agentes de atención, RAG y reducción de tareas repetitivas.' },
    { id: 'ecommerce', label: 'E-commerce de Alta Disponibilidad', desc: 'Tiendas rápidas con pasarelas de pago y stock sincro.' },
    { id: 'optimization', label: 'Modernización de Sistemas', desc: 'Migrar hojas de Excel o software viejo a la nube.' },
    { id: 'not_sure', label: 'Aún no estoy seguro', desc: 'Necesito una consultoría para diagnosticar mi caso.' }
  ];

  const stagesList = [
    { id: 'idea', label: 'Idea o proyecto nuevo', desc: 'Quiero desarrollar un producto o sistema desde cero.' },
    { id: 'existing', label: 'Producto existente en marcha', desc: 'Necesito expandir o corregir fallos de mi sistema actual.' },
    { id: 'migration', label: 'Migración técnica', desc: 'Tengo bases de datos o Excels que requiero subir a la web.' },
    { id: 'critical', label: 'Sistema crítico en producción', desc: 'Tengo caídas frecuentes o lentitud y necesito soporte urgente.' }
  ];

  const handleSelectNeed = (needId: string) => {
    markEdited();
    setData(prev => ({ ...prev, need: needId }));
    setErrors(prev => ({ ...prev, need: undefined }));
    setStep(2);
  };

  const handleSelectStage = (stageId: string) => {
    markEdited();
    setData(prev => ({ ...prev, stage: stageId }));
    setErrors(prev => ({ ...prev, stage: undefined }));
    setStep(4);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    markEdited();
    const { name, value } = e.target;
    const next = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : value;
    setData(prev => ({ ...prev, [name]: next }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateStep3 = () => {
    if (data.bottleneck.trim().length < 10 || data.bottleneck.trim().length > 4000) {
      setErrors(prev => ({ ...prev, bottleneck: 'Describe el cuello de botella en 10 a 4000 caracteres.' }));
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (data.name.trim().length < 2 || data.name.trim().length > 120) newErrors.name = 'Introduce un nombre de 2 a 120 caracteres.';
    if (data.email.trim().length < 5 || data.email.trim().length > 254 || !/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Introduce un email corporativo válido.';
    if (data.company.trim().length < 2 || data.company.trim().length > 160) newErrors.company = 'Introduce una empresa de 2 a 160 caracteres.';
    if (data.phone.trim().length < 7 || data.phone.trim().length > 32) newErrors.phone = 'Introduce un número de teléfono válido.';
    if (!data.consent) newErrors.consent = 'Debes aceptar el tratamiento de tus datos.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep4()) return;
    setPending(true);
    setSubmitError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const turnstileToken = e.currentTarget.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value;
      if (!turnstileToken) throw new Error('Completa la verificaci\u00f3n de seguridad.');
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, request_id: requestId.current, turnstile_token: turnstileToken }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.whatsapp_url !== 'string') throw new Error(result?.error || 'No pudimos guardar tu solicitud.');
      window.location.assign(result.whatsapp_url);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos guardar tu solicitud. Inténtalo nuevamente.');
      (window as Window & { turnstile?: { reset: () => void } }).turnstile?.reset();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(11,15,19,0.5)] p-6 md:p-8 backdrop-blur-lg">
      <div className="absolute -inset-px bg-gradient-to-b from-[rgba(50,255,126,0.04)] to-transparent pointer-events-none rounded-2xl"></div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs font-mono text-white/40 mb-2">
          <span>Paso {step} de 4</span>
          <span className="text-[var(--color-accent)]">{Math.round((step / 4) * 100)}% Completado</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="relative z-10 min-h-[300px] flex flex-col justify-between">
        <input type="text" name="website" value={data.website} onChange={handleInputChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
        
        {/* STEP 1: Need selection */}
        {step === 1 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white mb-2">¿Qué necesitas resolver en tu negocio?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Selecciona la opción que mejor se adapte a tu requerimiento actual.</p>
            <div className="space-y-3">
              {needsList.map(need => (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => handleSelectNeed(need.id)}
                  className={`w-full text-left rounded-xl border border-white/5 bg-white/10 px-5 py-4 transition-all duration-300 hover:border-[rgba(50,255,126,0.3)] hover:bg-[rgba(50,255,126,0.02)] flex flex-col gap-1 group ${
                    data.need === need.id ? 'border-[var(--color-accent)] bg-[rgba(50,255,126,0.02)]' : ''
                  }`}
                >
                  <span className="font-bold text-white group-hover:text-[var(--color-accent)] transition-colors duration-300">{need.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{need.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Bottleneck description */}
        {step === 2 && (
          <div className="animate-[fadeIn_0.3s_ease-out] flex-grow">
            <h3 className="text-xl font-bold text-white mb-2">¿Dónde está el cuello de botella actual?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Contanos brevemente qué procesos son lentos o dónde se pierden ventas/datos.</p>
            <div className="flex flex-col gap-2">
              <textarea
                name="bottleneck"
                value={data.bottleneck}
                onChange={handleInputChange}
                placeholder="Ejemplo: Llevamos el control de stock en planillas Excel compartidas y siempre hay descuadres. Los clientes nos piden comprar por web pero solo les respondemos por WhatsApp de forma manual."
                rows={5}
                minLength={10}
                maxLength={4000}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/20 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all resize-none"
              ></textarea>
              {errors.bottleneck && <span className="text-xs text-red-400 font-semibold">{errors.bottleneck}</span>}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-xs font-mono font-bold text-white hover:bg-white/5 transition-all"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => { if (validateStep3()) setStep(3); }}
                className="rounded-lg bg-white px-5 py-2.5 text-xs font-mono font-bold text-black hover:bg-[var(--color-accent)] transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Project stage */}
        {step === 3 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white mb-2">¿En qué etapa está el proyecto?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Selecciona el estado actual de la iniciativa técnica.</p>
            <div className="space-y-3">
              {stagesList.map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleSelectStage(stage.id)}
                  className={`w-full text-left rounded-xl border border-white/5 bg-white/10 px-5 py-4 transition-all duration-300 hover:border-[rgba(50,255,126,0.3)] hover:bg-[rgba(50,255,126,0.02)] flex flex-col gap-1 group ${
                    data.stage === stage.id ? 'border-[var(--color-accent)] bg-[rgba(50,255,126,0.02)]' : ''
                  }`}
                >
                  <span className="font-bold text-white group-hover:text-[var(--color-accent)] transition-colors duration-300">{stage.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{stage.desc}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 rounded-lg border border-white/10 px-5 py-2.5 text-xs font-mono font-bold text-white hover:bg-white/5 transition-all"
            >
              Atrás
            </button>
          </div>
        )}

        {/* STEP 4: Contact details */}
        {step === 4 && (
          <div className="animate-[fadeIn_0.3s_ease-out] flex-grow">
            <h3 className="text-xl font-bold text-white mb-2">Datos de contacto</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Para coordinar el diagnóstico técnico o coordinar la visita a tu negocio.</p>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-name" className="text-xs font-semibold text-white/60">Nombre completo</label>
                  <input
                    type="text"
                    id="lead-name"
                    name="name"
                    value={data.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Hugo Balderrama"
                    minLength={2}
                    maxLength={120}
                    required
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  />
                  {errors.name && <span className="text-[10px] text-red-400 font-semibold">{errors.name}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-company" className="text-xs font-semibold text-white/60">Empresa</label>
                  <input
                    type="text"
                    id="lead-company"
                    name="company"
                    value={data.company}
                    onChange={handleInputChange}
                    placeholder="Ej: DarkoGym SRL"
                    minLength={2}
                    maxLength={160}
                    required
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  />
                  {errors.company && <span className="text-[10px] text-red-400 font-semibold">{errors.company}</span>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-email" className="text-xs font-semibold text-white/60">Email Corporativo</label>
                  <input
                    type="email"
                    id="lead-email"
                    name="email"
                    value={data.email}
                    onChange={handleInputChange}
                    placeholder="Ej: h.balderrama@darkogym.com"
                    minLength={5}
                    maxLength={254}
                    required
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  />
                  {errors.email && <span className="text-[10px] text-red-400 font-semibold">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-phone" className="text-xs font-semibold text-white/60">Número de WhatsApp</label>
                  <input
                    type="tel"
                    id="lead-phone"
                    name="phone"
                    value={data.phone}
                    onChange={handleInputChange}
                    placeholder="Ej: +591 78000000"
                    minLength={7}
                    maxLength={32}
                    required
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  />
                  {errors.phone && <span className="text-[10px] text-red-400 font-semibold">{errors.phone}</span>}
                </div>
              </div>
              <label className="mt-4 flex items-start gap-3 text-xs text-white/60">
                <input type="checkbox" name="consent" checked={data.consent} onChange={handleInputChange} required className="mt-0.5 accent-[var(--color-accent)]" />
                <span>Acepto que DarkoSync procese estos datos y comparta el diagn&oacute;stico y contacto enviados con WhatsApp/Meta para abrir la conversaci&oacute;n.</span>
              </label>
              {errors.consent && <span className="text-[10px] text-red-400 font-semibold">{errors.consent}</span>}
              {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark"></div> : <p role="alert" className="text-xs text-red-400">Verificaci&oacute;n no disponible.</p>}
              {submitError && <p role="alert" className="mt-4 text-xs text-red-400 font-semibold">{submitError}</p>}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-xs font-mono font-bold text-white hover:bg-white/5 transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-grow disabled:cursor-wait disabled:opacity-60 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-xs font-mono font-bold text-black hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <span>{pending ? 'Guardando solicitud...' : 'Solicitar Diagnóstico en WhatsApp'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.22 5.03a.75.75 0 111.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.168-4.17H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
