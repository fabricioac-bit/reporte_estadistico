'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  Search,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Table2,
  Eraser,
} from 'lucide-react';

type VistaType = 'grafico' | 'tabla';

interface FiltrosState {
  fechaInicio: string;
  fechaFin: string;
  especialidad: string;
  medico: string;
}

interface RowProductividad {
  id: number;
  nombre: string;
  especialidad: string;
  turno: string;
  agendadas: number;
  atendidos: number;
  ausentes: number;
  adicionales: number;
  tiempoPromedio: string;
  estado: string;
}

export const dynamic = 'force-dynamic';

export default function ProductividadPage() {
  const [vistaActual, setVistaActual] = useState<VistaType>('grafico');
  const [loading, setLoading] = useState<boolean>(false);
  const [datosHospital, setDatosHospital] = useState<RowProductividad[]>([]);
  const [listaEspecialidades, setListaEspecialidades] = useState<string[]>([]);
  const [listaMedicos, setListaMedicos] = useState<{ id: number; nombre: string }[]>([]);
  
  // Estado para el filtro local de turno en la tabla
  const [turnoTabla, setTurnoTabla] = useState<string>('');

  // Rango de fechas dinámico (Tiempo real basado en Junio 2026)
  const filtrosInicial = useMemo<FiltrosState>(() => {
    const hoy = new Date(); 
    const añoActual = hoy.getFullYear(); 
    const mesActual = hoy.getMonth(); 

    const primerDia = new Date(añoActual, mesActual, 1);
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      fechaInicio: format(primerDia),
      fechaFin: format(hoy),
      especialidad: '',
      medico: '',
    };
  }, []);

  const [filtros, setFiltros] = useState<FiltrosState>(filtrosInicial);

  const fetchProductividad = async (filtrosAEnviar: FiltrosState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtrosAEnviar.fechaInicio) params.append('fechaInicio', filtrosAEnviar.fechaInicio);
      if (filtrosAEnviar.fechaFin) params.append('fechaFin', filtrosAEnviar.fechaFin);
      if (filtrosAEnviar.especialidad) params.append('especialidadId', filtrosAEnviar.especialidad);
      if (filtrosAEnviar.medico) params.append('medicoId', filtrosAEnviar.medico);

      const respuesta = await fetch(`/api/productividad?${params.toString()}`);
      if (!respuesta.ok) throw new Error('Error en el servidor');
      
      const data: RowProductividad[] = await respuesta.json();
      setDatosHospital(data);

      if (!filtrosAEnviar.especialidad && !filtrosAEnviar.medico) {
        const bgEspecialidades = Array.from(new Set(data.map(m => m.especialidad))).sort();
        setListaEspecialidades(bgEspecialidades);

        const bgMedicos = Array.from(
          new Map(data.map(m => [m.id, m.nombre])).entries()
        ).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
        setListaMedicos(bgMedicos);
      }
    } catch (error) {
      console.error('Error cargando el reporte:', error);
      setDatosHospital([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductividad(filtrosInicial);
  }, [filtrosInicial]);

  const medicosFiltradosPorEmbudo = useMemo(() => {
    if (!filtros.especialidad) return listaMedicos;
    return listaMedicos.filter((med) =>
      datosHospital.some((dh) => dh.id === med.id && dh.especialidad === filtros.especialidad)
    );
  }, [filtros.especialidad, listaMedicos, datosHospital]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => {
      const nuevosFiltros = { ...prev, [name]: value };
      if (name === 'especialidad') nuevosFiltros.medico = '';
      return nuevosFiltros;
    });
  };

  const handleFiltrar = () => fetchProductividad(filtros);
  const handleLimpiar = () => {
    setFiltros(filtrosInicial);
    setTurnoTabla('');
    fetchProductividad(filtrosInicial);
  };

  // ==========================================
  // PROCESAMIENTO E INTELIGENCIA DE GRÁFICOS (CONSOLIDACIÓN Y TOP 5)
  // ==========================================
  const productividadData = useMemo(() => {
    // 1. Agrupamos y consolidamos turnos duplicados para evitar barras repetidas
    const mapaConsolidado = new Map<string, { nombre: string; especialidad: string; atendidos: number; agendadas: number }>();
    
    datosHospital.forEach((item) => {
      const llave = `${item.id}-${item.especialidad}`;
      if (mapaConsolidado.has(llave)) {
        const exist = mapaConsolidado.get(llave)!;
        exist.atendidos += item.atendidos;
        exist.agendadas += item.agendadas;
      } else {
        mapaConsolidado.set(llave, {
          nombre: item.nombre,
          especialidad: item.especialidad,
          atendidos: item.atendidos,
          agendadas: item.agendadas
        });
      }
    });

    const arreglado = Array.from(mapaConsolidado.values()).map((m) => ({
      nombre: `${m.nombre} (${m.especialidad})`,
      porcentaje: m.agendadas > 0 ? Number(((m.atendidos / m.agendadas) * 100).toFixed(1)) : 0,
      atendidos: m.atendidos,
      agendadas: m.agendadas,
    }));

    // 2. Si está "A lo natural" (sin filtros), ordenamos por más atendidos y recortamos al Top 5
    if (!filtros.especialidad && !filtros.medico) {
      return arreglado.sort((a, b) => b.atendidos - a.atendidos).slice(0, 5);
    }

    // Si hay filtros, mostramos todos los de esa área ordenados por porcentaje
    return arreglado.sort((a, b) => b.porcentaje - a.porcentaje);
  }, [datosHospital, filtros.especialidad, filtros.medico]);

  // Datos de composición globales basados estrictamente en el universo del gráfico actual
  const datosComposicion = useMemo(() => {
    // Si el gráfico está mostrando un Top 5 o un filtro, la torta debe reflejar exactamente esa misma sumatoria
    const medicosActivos = new Set(productividadData.map(p => p.nombre.split(' (')[0]));
    
    const filtrados = datosHospital.filter(dh => medicosActivos.has(dh.nombre));

    return [
      { name: 'Atendidos', value: filtrados.reduce((acc, cur) => acc + cur.atendidos, 0), color: '#2563eb' },
      { name: 'Ausentes', value: filtrados.reduce((acc, cur) => acc + cur.ausentes, 0), color: '#ef4444' },
      { name: 'Adicionales', value: filtrados.reduce((acc, cur) => acc + cur.adicionales, 0), color: '#10b981' },
    ];
  }, [datosHospital, productividadData]);

  // FILTRO LOCAL EXCLUSIVO DE LA TABLA (React Side)
  const datosTablaFiltrados = useMemo(() => {
    if (!turnoTabla) return datosHospital;
    return datosHospital.filter((d) => d.turno === turnoTabla);
  }, [datosHospital, turnoTabla]);

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* SECCIÓN DE FILTROS SUPERIORES */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Productividad Hospitalaria Real</h2>
          <p className="text-slate-500 text-[11px] mt-1">
            Análisis clasificado estructuralmente por la tabla maestra de turnos institucionales de consulta externa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 items-end flex-wrap">
          
          <div className="flex flex-col gap-0.5 min-w-max relative">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Inicio</span>
            <div className="relative flex items-center">
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleInputChange}
                className="bg-white border border-slate-200 rounded-lg pl-2 pr-8 h-8 flex items-center text-xs font-medium text-slate-700 w-36 outline-none focus:border-blue-500 cursor-pointer appearance-none"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 min-w-max relative">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Fin</span>
            <div className="relative flex items-center">
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleInputChange}
                className="bg-white border border-slate-200 rounded-lg pl-2 pr-8 h-8 flex items-center text-xs font-medium text-slate-700 w-36 outline-none focus:border-blue-500 cursor-pointer appearance-none"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-[140px]">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">Especialidad</span>
            <select
              name="especialidad"
              value={filtros.especialidad}
              onChange={handleInputChange}
              className="bg-white border border-slate-200 rounded-lg px-2 h-8 flex items-center text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer w-full"
            >
              <option value="">Todas las Especialidades</option>
              {listaEspecialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-[140px]">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">Médico</span>
            <select
              name="medico"
              value={filtros.medico}
              onChange={handleInputChange}
              className="bg-white border border-slate-200 rounded-lg px-2 h-8 flex items-center text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer w-full"
            >
              <option value="">
                {filtros.especialidad ? 'Todos los de esta especialidad' : 'Todos los Médicos del área'}
              </option>
              {medicosFiltradosPorEmbudo.map((med) => (
                <option key={med.id} value={med.id}>{med.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-1.5 min-w-max">
            <button
              onClick={handleFiltrar}
              disabled={loading}
              className="h-8 flex items-center justify-center gap-1 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-700 transition-colors px-3 whitespace-nowrap disabled:bg-blue-400"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Cargando...' : 'Filtrar'}</span>
            </button>
            <button
              onClick={handleLimpiar}
              className="h-8 w-8 flex items-center justify-center bg-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-400 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VISTAS TOGGLE */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setVistaActual('grafico')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
            vistaActual === 'grafico' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Gráficos
        </button>
        <button
          onClick={() => setVistaActual('tabla')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
            vistaActual === 'tabla' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          Tablas
        </button>
      </div>

      {/* RENDERS PRINCIPALES */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex justify-center items-center text-slate-500 font-semibold text-xs">
          Calculando base de datos transaccional en tiempo real...
        </div>
      ) : datosHospital.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex justify-center items-center text-slate-400 text-xs font-medium">
          No se registran atenciones clínicas bajo los filtros establecidos en este rango.
        </div>
      ) : (
        <>
          {/* SECCIÓN DE GRÁFICOS (CON LOGICA TOP 5 / COMPRESIÓN) */}
          {vistaActual === 'grafico' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-3xl shadow-sm space-y-3 min-h-[420px] flex flex-col">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-base text-slate-900">
                    {!filtros.especialidad && !filtros.medico ? 'Top 5 Médicos con Más Atenciones' : 'Productividad por Especialidad'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">% Rendimiento Asistencial</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productividadData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="#94a3b8" fontSize={10} />
                      <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 8, fill: '#0f172a' }} />
                      <Tooltip formatter={(value: number | string) => `${value}%`} />
                      <Bar dataKey="porcentaje" barSize={12} radius={3}>
                        <LabelList dataKey="porcentaje" position="right" formatter={(v: number) => `${v}%`} fontSize={9} />
                        {productividadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.porcentaje < 75 ? '#ef4444' : '#2563eb'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-3xl shadow-sm space-y-3 min-h-[420px] flex flex-col">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-base text-slate-900">Composición de Atenciones</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribución proporcional de carga médica analizada</p>
                </div>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosComposicion}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}
                        outerRadius={90}
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
          )}

          {/* SECCIÓN DE TABLA (CON FILTRO DE TURNO INTEGRADO) */}
          {vistaActual === 'tabla' && (
            <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-3xl shadow-sm space-y-3 min-h-[380px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Desempeño por Médico</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Información completa extraída del SIGH</p>
                </div>
                
                {/* FILTRO DE TURNO UBICADO AL LADO DE EXCEL/PDF */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-8 text-[11px]">
                    <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mr-1">Turno Tabla:</span>
                    <select
                      value={turnoTabla}
                      onChange={(e) => setTurnoTabla(e.target.value)}
                      className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="">Todos</option>
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-slate-50">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>Excel</span>
                    </button>
                    <button className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-slate-50">
                      <FileText className="w-3 h-3 text-red-500" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[9px] uppercase tracking-wider font-bold">
                      <th className="px-3 py-2 font-bold">Médico</th>
                      <th className="px-3 py-2 font-bold">Especialidad</th>
                      <th className="px-3 py-2 text-center font-bold">Turno</th>
                      <th className="px-3 py-2 text-center font-bold">Agendadas</th>
                      <th className="px-3 py-2 text-center font-bold">Atendidas</th>
                      <th className="px-3 py-2 text-center font-bold">% Asist.</th>
                      <th className="px-3 py-2 text-center font-bold">Adic.</th>
                      <th className="px-3 py-2 text-center font-bold">Ausentes</th>
                      <th className="px-3 py-2 text-center font-bold">T. Prom.</th>
                      <th className="px-3 py-2 text-right font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datosTablaFiltrados.map((medico, idx) => {
                      const porcentajeAsistencia = medico.agendadas > 0 ? ((medico.atendidos / medico.agendadas) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2">
                            <p className="font-bold text-slate-800">{medico.nombre}</p>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{medico.especialidad}</td>
                          <td className="px-3 py-2 text-center text-slate-600 text-[10px]">{medico.turno}</td>
                          <td className="px-3 py-2 text-center font-medium text-slate-800">{medico.agendadas}</td>
                          <td className="px-3 py-2 text-center font-medium text-blue-600">{medico.atendidos}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">{porcentajeAsistencia}%</td>
                          <td className="px-3 py-2 text-center font-bold text-emerald-600 bg-emerald-50/40 rounded text-[10px]">{medico.adicionales}</td>
                          <td className="px-3 py-2 text-center text-red-500 font-medium text-[10px]">{medico.ausentes}</td>
                          <td className="px-3 py-2 text-center text-slate-600 text-[10px]">{medico.tiempoPromedio}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                              medico.estado === 'Atendiendo con Normalidad' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
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
            </div>
          )}
        </>
      )}
    </div>
  );
}