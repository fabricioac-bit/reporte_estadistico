'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import {
  RefreshCw,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Search,
  FileSpreadsheet,
  FileText,
  UserPlus,
} from 'lucide-react';

const datosHoraManana = [
  { hora: '08:00', atenciones: 25 },
  { hora: '09:00', atenciones: 48 },
  { hora: '10:00', atenciones: 65 },
  { hora: '11:00', atenciones: 42 },
  { hora: '12:00', atenciones: 15 },
];

const datosComposicion = [
  { name: 'Atendidos', value: 168, color: '#2563eb' },
  { name: 'Ausentes', value: 35, color: '#ef4444' },
  { name: 'Adicionales', value: 18, color: '#10b981' },
];

const rankingMedicosHumano = [
  { id: 1, nombre: 'Dr. Alejandro Gomez M.', especialidad: 'Pediatria', agendadas: 20, atendidos: 16, adicionales: 4, ausentes: 4, estado: 'Interrumpido por Emergencia' },
  { id: 2, nombre: 'Dra. Elena Rostworowski', especialidad: 'Ginecologia', agendadas: 24, atendidos: 18, adicionales: 2, ausentes: 6, estado: 'Atendiendo con Normalidad' },
  { id: 3, nombre: 'Dr. Carlos Mendoza V.', especialidad: 'Medicina Interna', agendadas: 18, atendidos: 15, adicionales: 5, ausentes: 3, estado: 'Consultorio Demorado' },
  { id: 4, nombre: 'Dra. Sofia Benavides K.', especialidad: 'Cardiologia', agendadas: 15, atendidos: 12, adicionales: 1, ausentes: 3, estado: 'Atendiendo con Normalidad' },
];

export default function ProductividadPage() {
  const productividadData = rankingMedicosHumano.map((m) => ({
    nombre: m.nombre,
    porcentaje: Number(((m.atendidos / m.agendadas) * 100).toFixed(1)),
    atendidos: m.atendidos,
    agendadas: m.agendadas,
    adicionales: m.adicionales,
    ausentes: m.ausentes,
  })).sort((a, b) => b.porcentaje - a.porcentaje);

  const singleMedBreakdown = rankingMedicosHumano.length === 1 ? [
    { name: 'Agendadas', value: rankingMedicosHumano[0].agendadas, color: '#cbd5e1' },
    { name: 'Atendidas', value: rankingMedicosHumano[0].atendidos, color: '#2563eb' },
    { name: 'Ausentes', value: rankingMedicosHumano[0].ausentes, color: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-8">

        {/* FILTROS VISUALES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Productividad Hospitalaria Real</h2>
            <p className="text-slate-500 text-xs mt-0.5">Analisis contextualizado en la actividad real del consultorio basando turnos, reprogramaciones por emergencias y sobrecupos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Inicio</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>01/06/2026</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Fin</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center justify-between text-xs font-medium text-slate-700">
                <span>02/06/2026</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Turno Clínico</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center text-xs font-medium text-slate-700">
                Mañana
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Especialidad</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center text-xs font-medium text-slate-700">
                Todas las Especialidades
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Medico Asignado</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center text-xs font-medium text-slate-400 bg-slate-100/50">
                Todos los Medicos del area
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button className="h-9 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-90 px-4">
                <Search className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE TARJETAS KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citas Ofertadas / Agendadas</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">215</h3>
              <p className="text-slate-400 text-[11px] font-medium">Planificacion oficial del turno</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citados Atendidos</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">168</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-blue-50 text-blue-700">
                78.1% asistencia regular
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pacientes Adicionales</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">+18</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-emerald-50 text-emerald-700">
                Carga extra por pasillo
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ausentes / Cupos Perdidos</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">35</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-red-50 text-red-700">
                16.2% tiempo muerto generado
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <UserX className="w-7 h-7 text-red-500" />
            </div>
          </div>
        </div>

        {/* GRAFICOS - FLUJO HORARIO Y COMPOSICION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Gráfico Productividad (BarChart horizontal) */}
          <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Productividad: % Asistencia por Médico</h3>
                <p className="text-xs text-slate-400 mt-0.5">Comparativa de asistencia (Atendidas / Agendadas) en el periodo seleccionado.</p>
              </div>
            </div>

            <div className="w-full h-80 pt-4">
              {rankingMedicosHumano.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productividadData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="#94a3b8" fontSize={11} />
                    <YAxis type="category" dataKey="nombre" width={220} tick={{ fontSize: 12, fill: '#0f172a' }} />
                    <Tooltip formatter={(value: number | string) => `${value}%`} />
                    <Bar dataKey="porcentaje" barSize={18} radius={4}>
                      <LabelList dataKey="porcentaje" position="right" formatter={(v: number) => `${v}%`} />
                      {productividadData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.porcentaje < 60 ? '#ef4444' : '#2563eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={singleMedBreakdown} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(value) => `${value} pacientes`} />
                    <Bar dataKey="value">
                      {singleMedBreakdown.map((entry, index) => (
                        <Cell key={`cell-s-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico Composición */}
          <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Composición de Atenciones</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribución: Atendidos, Ausentes y Adicionales.</p>
                </div>
              </div>

              <div className="w-full h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosComposicion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosComposicion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => `${value} pacientes`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* TABLA DE DETALLE COMPLETA PARA EXPORTAR */}
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Tabla de Detalle: Desempeño por Médico</h3>
              <p className="text-xs text-slate-400 mt-0.5">Información completa para análisis y exportación.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm cursor-pointer hover:bg-slate-50">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Excel</span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm cursor-pointer hover:bg-slate-50">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Exportar PDF</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
                  <th className="px-4 py-3 font-bold">Médico</th>
                  <th className="px-4 py-3 font-bold">Especialidad</th>
                  <th className="px-4 py-3 text-center font-bold">Turno</th>
                  <th className="px-4 py-3 text-center font-bold">Agendadas</th>
                  <th className="px-4 py-3 text-center font-bold">Atendidas</th>
                  <th className="px-4 py-3 text-center font-bold">% Asistencia</th>
                  <th className="px-4 py-3 text-center font-bold">Adicionales</th>
                  <th className="px-4 py-3 text-center font-bold">Ausentes</th>
                  <th className="px-4 py-3 text-center font-bold">Tiempo Prom.</th>
                  <th className="px-4 py-3 text-right font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingMedicosHumano.map((medico) => {
                  const porcentajeAsistencia = ((medico.atendidos / medico.agendadas) * 100).toFixed(1);
                  return (
                    <tr key={medico.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{medico.nombre}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{medico.especialidad}</td>
                      <td className="px-4 py-3 text-center text-slate-600">Mañana</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-800">{medico.agendadas}</td>
                      <td className="px-4 py-3 text-center font-medium text-blue-600">{medico.atendidos}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">{porcentajeAsistencia}%</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/40 rounded">{medico.adicionales}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">{medico.ausentes}</td>
                      <td className="px-4 py-3 text-center text-slate-600">12 min</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          medico.estado === 'Atendiendo con Normalidad' ? 'bg-blue-50 text-blue-700' :
                          medico.estado === 'Interrumpido por Emergencia' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {medico.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium space-y-1">
            <p>* Los porcentajes se calculan en base a (Citas Atendidas / Citas Agendadas)</p>
            <p>* Los datos de "Tiempo Promedio" son sincronizados desde el módulo de admisión SIGH</p>
          </div>
        </div>

    </div>
  );
}