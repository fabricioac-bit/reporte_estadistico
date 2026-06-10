'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export default function TiemposPage() {
  const tiemposPromedio = [
    { fecha: '01/06', avg: 14 },
    { fecha: '02/06', avg: 13 },
    { fecha: '03/06', avg: 12 },
    { fecha: '04/06', avg: 15 },
    { fecha: '05/06', avg: 11 },
    { fecha: '06/06', avg: 13 },
    { fecha: '07/06', avg: 12 },
    { fecha: '08/06', avg: 10 },
    { fecha: '09/06', avg: 12 },
    { fecha: '10/06', avg: 12 },
    { fecha: '11/06', avg: 13 },
    { fecha: '12/06', avg: 11 },
    { fecha: '13/06', avg: 12 },
    { fecha: '14/06', avg: 12 },
  ];

  const duracionBuckets = [
    { bucket: '<5m', count: 24 },
    { bucket: '5-10m', count: 80 },
    { bucket: '10-15m', count: 140 },
    { bucket: '15-20m', count: 60 },
    { bucket: '>20m', count: 16 },
  ];

  const percentiles = {
    p50: 12,
    p75: 16,
    p90: 25,
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Tiempos e Indicadores</h2>
        <p className="text-slate-500 text-xs mt-1">Indicadores de tiempo de atención y espera para optimizar asignaciones.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 uppercase font-bold">Tiempo promedio atención</div>
            <div className="text-2xl font-extrabold mt-2">12 min</div>
            <div className="text-[11px] text-slate-400 mt-1">P50: {percentiles.p50}m · P90: {percentiles.p90}m</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 uppercase font-bold">Tiempo espera promedio</div>
            <div className="text-2xl font-extrabold mt-2">8 min</div>
            <div className="text-[11px] text-slate-400 mt-1">P75: {percentiles.p75}m</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 uppercase font-bold">Tiempo muerto (prom.)</div>
            <div className="text-2xl font-extrabold mt-2">16 min</div>
            <div className="text-[11px] text-slate-400 mt-1">% de turnos con retraso: 18%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm lg:col-span-8">
          <h3 className="font-extrabold text-lg text-slate-900">Tendencia: Tiempo Promedio por Día</h3>
          <p className="text-xs text-slate-400 mt-0.5">Últimos 14 días — minutos por paciente.</p>

          <div className="w-full h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tiemposPromedio} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: number | string) => `${v} min`} />
                <Line type="monotone" dataKey="avg" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm lg:col-span-4">
          <h3 className="font-extrabold text-lg text-slate-900">Distribución de Duraciones</h3>
          <p className="text-xs text-slate-400 mt-0.5">Histograma de duración por bucket.</p>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={duracionBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: number | string) => `${v} pacientes`} />
                <Bar dataKey="count" fill="#2563eb" radius={4}>
                  {duracionBuckets.map((entry, i) => (
                    <Cell key={`c-${i}`} fill={entry.bucket === '>20m' ? '#ef4444' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-[12px] text-slate-600">
            <div>P50: {percentiles.p50} min</div>
            <div>P75: {percentiles.p75} min</div>
            <div>P90: {percentiles.p90} min</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm">
        <h3 className="font-extrabold text-lg text-slate-900">Detalle de Tiempos por Turno</h3>
        <p className="text-xs text-slate-400 mt-0.5">Tabla con métricas por médico y turno (mock).</p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Médico</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3 text-center">Tiempo Prom.</th>
                <th className="px-4 py-3 text-center">Tiempo Espera</th>
                <th className="px-4 py-3 text-center">P90</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">Dr. Alejandro Gomez</td>
                <td className="px-4 py-3">Mañana</td>
                <td className="px-4 py-3 text-center">12 min</td>
                <td className="px-4 py-3 text-center">8 min</td>
                <td className="px-4 py-3 text-center">22 min</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">Dra. Elena Rostworowski</td>
                <td className="px-4 py-3">Mañana</td>
                <td className="px-4 py-3 text-center">13 min</td>
                <td className="px-4 py-3 text-center">9 min</td>
                <td className="px-4 py-3 text-center">24 min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}