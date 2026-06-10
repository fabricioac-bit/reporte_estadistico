'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  UserCheck,
  AlertTriangle,
  Bed,
  Menu,
  ChevronDown,
  BarChart3,
  Clock,
  Coins,
  ShieldCheck,
  FileText,
  HeartPulse,
} from 'lucide-react';

export function Sidebar() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [consultaExternaOpen, setConsultaExternaOpen] = useState(false);
  const [emergenciaOpen, setEmergenciaOpen] = useState(false);
  const [hospitalizacionOpen, setHospitalizacionOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
    setExpandedGroups([]);
    setConsultaExternaOpen(false);
  };

  const handleMenuToggle = (menuKey: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedGroups([menuKey]);
      return;
    }

    setExpandedGroups((prev) => {
      if (prev.includes(menuKey)) return prev.filter((k) => k !== menuKey);
      return [...prev, menuKey];
    });
  };

  return (
    <aside
      className={`relative flex-shrink-0 h-screen sticky top-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col transition-all duration-300 ease-in-out z-30 ${
        sidebarCollapsed ? 'w-20 md:w-20' : 'w-full md:w-72'
      }`}
    >
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                <HeartPulse className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-lg tracking-tight leading-none">REZOLA</h2>
                <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Hospitalario</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
              aria-label="Colapsar menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/30 backdrop-blur-xl">
        {!sidebarCollapsed && (
          <div className="mb-4 px-2 text-xs uppercase tracking-[0.3em] text-sky-300">Módulos clínicos</div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleMenuToggle('produccion')}
            className={`w-full flex items-center justify-between gap-3 text-white transition-all duration-300 ${
              sidebarCollapsed ? 'justify-center bg-slate-900/90 px-0 py-3 rounded-xl' : 'bg-blue-600 hover:bg-blue-700 rounded-2xl px-3 py-3'
            }`}
            title="Producción Médica"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2 text-slate-900 shadow-sm">
                <Activity className="w-5 h-5" />
              </span>
              <span className={`${sidebarCollapsed ? 'hidden' : 'block'} font-semibold`}>Producción Médica</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                sidebarCollapsed ? 'hidden' : 'block'
              } ${expandedGroups.includes('produccion') ? 'rotate-180' : ''}`}
            />
          </button>

          {!sidebarCollapsed && expandedGroups.includes('produccion') && (
            <ul className="mt-1 pl-2 space-y-2 border-l border-slate-800/80 ml-5">
              {/* CONSULTA EXTERNA */}
              <li>
                <button
                  type="button"
                  onClick={() => setConsultaExternaOpen(!consultaExternaOpen)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">Consulta Externa</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${consultaExternaOpen ? 'rotate-180' : ''}`} />
                </button>
                {consultaExternaOpen && (
                  <ul className="mt-1 pl-3 space-y-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/productividad')}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Productividad</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/tiempos')}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tiempos e Indicadores</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* EMERGENCIA */}
              <li>
                <button
                  type="button"
                  onClick={() => setEmergenciaOpen(!emergenciaOpen)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">Emergencia</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${emergenciaOpen ? 'rotate-180' : ''}`} />
                </button>
                {emergenciaOpen && (
                  <ul className="mt-1 pl-3 space-y-1">
                    <li>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Frecuencia de Atenciones</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Triage y Tiempos</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* HOSPITALIZACIÓN */}
              <li>
                <button
                  type="button"
                  onClick={() => setHospitalizacionOpen(!hospitalizacionOpen)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">Hospitalización</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hospitalizacionOpen ? 'rotate-180' : ''}`} />
                </button>
                {hospitalizacionOpen && (
                  <ul className="mt-1 pl-3 space-y-1">
                    <li>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Bed className="w-3.5 h-3.5 text-teal-400" />
                        <span>Giro de Camas</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Promedio de Estancia</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleMenuToggle('programas')}
            className={`w-full flex items-center justify-between gap-3 text-white transition-all duration-300 ${
              sidebarCollapsed ? 'justify-center bg-slate-900/90 px-0 py-3 rounded-xl' : 'bg-slate-800 hover:bg-slate-700/80 rounded-2xl px-3 py-3'
            }`}
            title="Prog. Estratégicos"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2 text-slate-900 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className={`${sidebarCollapsed ? 'hidden' : 'block'} font-semibold`}>Prog. Estratégicos</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                sidebarCollapsed ? 'hidden' : 'block'
              } ${expandedGroups.includes('programas') ? 'rotate-180' : ''}`}
            />
          </button>

          {!sidebarCollapsed && expandedGroups.includes('programas') && (
            <ul className="mt-1 pl-2 space-y-1 border-l border-slate-800/80 ml-5">
              <li>
                <button type="button" className="w-full block rounded-xl px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <HeartPulse className="w-4 h-4" />
                    <span>Etapa Vida Niño</span>
                  </span>
                </button>
              </li>
              <li>
                <button type="button" className="w-full block rounded-xl px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>Planif. Familiar</span>
                  </span>
                </button>
              </li>
              <li>
                <button type="button" className="w-full block rounded-xl px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Programa Cáncer</span>
                  </span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
}
