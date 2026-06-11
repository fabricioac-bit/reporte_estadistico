'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  UserCheck,
  AlertTriangle,
  Bed,
  RefreshCw,
  BarChart3,
  Clock,
  Coins,
  Signature,
  ShieldCheck,
  FileText,
  ChevronDown,
} from 'lucide-react';

interface FinanciamientoPorServicio {
  servicioId: number;
  servicioNombre: string;
  datos: Array<{
    nombre_financ: string;
    cantidad_atenciones: number;
  }>;
}

interface DashboardContract {
  kpis: {
    totalAtenCE: number;
    consultas_tendencia: number;
    totalHospit: number;
    cirugias_tendencia: number;
    totalEmergency: number;
    emergency_tendencia: number;
    totalEmergencia: number;
    emergencia_tendencia: number;
    Camas_Ocupadas_Hosp: number;
    Camas_Desocupadas_Hosp: number;
    Camas_Ocupadas_Emerg: number;
    Camas_Desocupadas_Emerg: number;
  };
  rendimiento_mensual: Array<{ 
    mes: string; 
    ce: number; 
    emergencia: number; 
    hospitalizacion: number; 
  }>;
  estado_citas_por_servicio: Array<{
    servicioId: number;
    servicioNombre: string;
    datos: Array<{
      mes: string;
      atendidos: number;
      noAtendidos: number;
      eliminadas: number;
    }>;
  }>;
  financiamiento_por_servicio: FinanciamientoPorServicio[];
  historial_quirurgico: Array<{ mes: string; cantidad: number }>;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [selectedServicioCitasId, setSelectedServicioCitasId] = useState(1);
  const [selectedServicioFinanciamientoId, setSelectedServicioFinanciamientoId] = useState(1);

  const loadDashboardData = async (isRetry = false) => {
    if (isRetry) setReconnecting(true);
    try {
      const dashboardRes = await axios.get('/api/dashboard');
      setData(dashboardRes.data.data ? dashboardRes.data.data : dashboardRes.data);

      setLoading(false);
      setReconnecting(false);
    } catch (err: any) {
      console.error('Fallo en la comunicación con la infraestructura del Dashboard:', err);
      setReconnecting(true);

      setTimeout(() => {
        loadDashboardData(true);
      }, 5000);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
        {loading || !data ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-semibold">Consolidando métricas de la Intranet Hospitalaria...</p>
          </div>
        ) : (
          <>
            {/* GRID DE CARDS KPI 5 COLUMNAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Card 1: Consultorio Externo Trimestral */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultorio Externo</span>
                  <span className="text-xs text-slate-400 font-medium block -mt-1">Trimestral</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
                    {data.kpis.totalAtenCE.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <UserCheck className="w-6 h-6 text-sky-500" />
                </div>
              </div>

              {/* Card 2: Hospitalización Trimestral */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospitalización</span>
                  <span className="text-xs text-slate-400 font-medium block -mt-1">Trimestral</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
                    {data.kpis.totalHospit.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
              </div>

              {/* Card 3: Emergencia Trimestral */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergencia</span>
                  <span className="text-xs text-slate-400 font-medium block -mt-1">Trimestral</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
                    {data.kpis.totalEmergencia.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* Card 4: Camas Hospitalización en Tiempo Real */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Camas Hosp.</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-teal-500 shrink-0">
                    <Bed className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                    <span className="text-xs font-bold text-slate-500">Ocupadas:</span>
                    <span className="text-lg font-black text-slate-800 leading-none">
                      {data.kpis.Camas_Ocupadas_Hosp.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[11px] font-medium text-slate-400">Disponibles:</span>
                    <span className="text-xs font-bold text-slate-600">
                      {data.kpis.Camas_Desocupadas_Hosp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Camas Emergencia en Tiempo Real */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Camas Emerg.</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-rose-500 shrink-0">
                    <Bed className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                    <span className="text-xs font-bold text-slate-500">Ocupadas:</span>
                    <span className="text-lg font-black text-slate-800 leading-none">
                      {data.kpis.Camas_Ocupadas_Emerg.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[11px] font-medium text-slate-400">Disponibles:</span>
                    <span className="text-xs font-bold text-slate-600">
                      {data.kpis.Camas_Desocupadas_Emerg.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN DE GRÁFICOS INTERACTIVOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* ESTADO DE CITAS POR SERVICIO */}
              <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-3xl shadow-sm space-y-3 min-h-[420px] flex flex-col">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg text-slate-900">Estado de citas por servicio</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="servicioEstadoSelect" className="text-sm text-slate-500">Servicio</label>
                    <div className="relative">
                      <select
                        id="servicioEstadoSelect"
                        value={selectedServicioCitasId}
                        onChange={(event) => setSelectedServicioCitasId(Number(event.target.value))}
                        className="appearance-none rounded-[28px] border border-slate-200/80 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      >
                        {data.estado_citas_por_servicio.map((servicio) => (
                          <option key={servicio.servicioId} value={servicio.servicioId}>
                            {servicio.servicioNombre}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">ABR - JUN</p>

                <div className="flex-1 h-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.estado_citas_por_servicio.find((serv) => serv.servicioId === selectedServicioCitasId)?.datos ?? []}
                      margin={{ top: 12, right: 20, left: 0, bottom: 0 }}
                      barCategoryGap="20%"
                      maxBarSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                        formatter={(value: number) => [value.toLocaleString(), 'Total']}
                      />
                      <Bar dataKey="atendidos" name="Atendidos" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="noAtendidos" name="No atendidos" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="eliminadas" name="Eliminadas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Atendidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>No atendidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Eliminadas</span>
                  </div>
                </div>
              </div>

              {/* FUENTES DE FINANCIAMIENTO POR SERVICIO */}
              <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-3xl shadow-sm space-y-3 min-h-[420px] flex flex-col">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg text-slate-900">Fuentes de financiamiento</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="servicioSelect" className="text-sm text-slate-500">Servicio</label>
                    <div className="relative">
                      <select
                        id="servicioSelect"
                        value={selectedServicioFinanciamientoId}
                        onChange={(event) => setSelectedServicioFinanciamientoId(Number(event.target.value))}
                        className="appearance-none rounded-[28px] border border-slate-200/80 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      >
                        {data.financiamiento_por_servicio.map((servicio) => (
                          <option key={servicio.servicioId} value={servicio.servicioId}>
                            {servicio.servicioNombre}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">ABR - JUN</p>

                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.financiamiento_por_servicio.find((serv) => serv.servicioId === selectedServicioFinanciamientoId)?.datos ?? []}
                      margin={{ top: 10, right: 16, left: 16, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="nombre_financ"
                        width={160}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                        formatter={(value: number) => [value.toLocaleString(), 'Cantidad']}
                      />
                      <Bar dataKey="cantidad_atenciones" fill="#2563eb" radius={[0, 10, 10, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SECCIÓN INFERIOR: ACCESOS RÁPIDOS */}
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">Módulos Administrativos y de Control</h3>
                <p className="text-slate-500 mt-1 text-sm">
                  Accesos directos para la gestión del hospital y análisis de interoperabilidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Signature className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Firma Digital</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Firma recetas médicas, órdenes de laboratorio y consentimientos digitales de forma legal y segura.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Auditoría & Logs</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Monitorea quién consultó, modificó o descargó información sensible del servidor.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Exportación en Un Clic</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Descarga resúmenes ejecutivos e indicadores de rendimiento directamente en formato PDF o Excel.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
    </div>
  );
}