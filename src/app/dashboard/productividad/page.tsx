'use client';

import { generarExcelProductividad, generarPDFProductividad } from '@/lib/exportadores';
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
}

export const dynamic = 'force-dynamic';

export default function ProductividadPage() {
  const [vistaActual, setVistaActual] = useState<VistaType>('grafico');
  const [loading, setLoading] = useState<boolean>(false);
  const [datosHospital, setDatosHospital] = useState<RowProductividad[]>([]);
  const [listaEspecialidades, setListaEspecialidades] = useState<string[]>([]);
  const [listaMedicos, setListaMedicos] = useState<{ id: number; nombre: string }[]>([]);
  
  const [turnoTabla, setTurnoTabla] = useState<string>('Mañana');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const filasPorPagina = 10;

  // Rango de fechas dinámico adaptativo (Junio 2026)
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
      setPaginaActual(1);

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
    setTurnoTabla('Mañana');
    fetchProductividad(filtrosInicial);
  };

  // Consolidación limpia por médico y especialidad
  const productividadData = useMemo(() => {
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

    const arreglado = Array.from(mapaConsolidado.values()).map((m) => {
      const nombreTruncado = m.nombre.length > 22 ? `${m.nombre.substring(0, 22)}...` : m.nombre;
      return {
        idUnico: m.nombre, 
        labelEjeY: `${nombreTruncado} (${m.especialidad})`, 
        atendidos: m.atendidos,
        agendadas: m.agendadas,
      };
    });

    if (!filtros.especialidad && !filtros.medico) {
      return arreglado.sort((a, b) => b.atendidos - a.atendidos).slice(0, 5);
    }
    return arreglado.sort((a, b) => b.atendidos - a.atendidos);
  }, [datosHospital, filtros.especialidad, filtros.medico]);

  // Universo operativo de la dona central
  const totalCitasProcesadas = useMemo(() => {
    const nombresActivos = new Set(productividadData.map(p => p.idUnico));
    const filtrados = datosHospital.filter(dh => nombresActivos.has(dh.nombre));
    
    const atendidos = filtrados.reduce((acc, cur) => acc + cur.atendidos, 0);
    const ausentes = filtrados.reduce((acc, cur) => acc + cur.ausentes, 0);
    const adicionales = filtrados.reduce((acc, cur) => acc + cur.adicionales, 0);

    return {
      total: atendidos + ausentes,
      atendidos,
      ausentes,
      adicionales,
      datosGrafico: [
        { name: 'Atendidos', value: atendidos, color: '#2563eb' },
        { name: 'Ausentes', value: ausentes, color: '#ef4444' },
        { name: 'Adicionales', value: adicionales, color: '#10b981' },
      ].filter(d => d.value > 0)
    };
  }, [datosHospital, productividadData]);

  const datosTablaFiltrados = useMemo(() => {
    return datosHospital.filter((d) => d.turno === turnoTabla);
  }, [datosHospital, turnoTabla]);

  const totalPaginas = Math.ceil(datosTablaFiltrados.length / filasPorPagina);
  
  const tablaPaginada = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return datosTablaFiltrados.slice(inicio, inicio + filasPorPagina);
  }, [datosTablaFiltrados, paginaActual]);

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col space-y-3 text-slate-800 overflow-hidden select-none">
      
      {/* SECCIÓN DE FILTROS SUPERIORES */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-none">
        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 items-end flex-wrap">
          <div className="flex flex-col gap-0.5 min-w-max relative">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Inicio</span>
            <div className="relative flex items-center">
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleInputChange}
                className="bg-white border border-slate-200 rounded-lg pl-2 pr-8 h-8 flex items-center text-xs font-medium text-slate-700 w-36 outline-none focus:border-blue-500 cursor-pointer"
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
                className="bg-white border border-slate-200 rounded-lg pl-2 pr-8 h-8 flex items-center text-xs font-medium text-slate-700 w-36 outline-none focus:border-blue-500 cursor-pointer"
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
              className="h-8 flex items-center justify-center gap-1 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-700 px-3 disabled:bg-blue-400 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Filtrar</span>
            </button>
            <button
              onClick={handleLimpiar}
              className="h-8 w-8 flex items-center justify-center bg-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-400 transition"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑAS */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit flex-none">
        <button
          onClick={() => setVistaActual('grafico')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-150 ${
            vistaActual === 'grafico' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Gráficos
        </button>
        <button
          onClick={() => setVistaActual('tabla')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-150 ${
            vistaActual === 'tabla' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" /> Tablas
        </button>
      </div>

      {/* ÁREA CENTRAL INDEPENDIENTE Y ADAPTATIVA */}
      <div className="flex-1 min-h-0 relative">
        {vistaActual === 'grafico' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full items-start">
            
            {/* CARD GRÁFICO BARRAS MODERADO */}
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col justify-between min-h-[340px]">
              <div className="border-b border-slate-50 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  {!filtros.especialidad && !filtros.medico ? 'Top 5 Médicos con Mayor Producción' : 'Volumen de Producción'}
                </h3>
              </div>
              <div className="mt-3 w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productividadData} layout="vertical" margin={{ top: 5, right: 35, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} hide />
                    <YAxis type="category" dataKey="labelEjeY" width={220} tick={{ fontSize: 8, fill: '#0f172a', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      labelStyle={{ display: 'none' }} 
                      contentStyle={{ padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} pacientes`, 'Atendidos']} 
                    />
                    <Bar dataKey="atendidos" fill="#2563eb" barSize={12} radius={3}>
                      <LabelList dataKey="atendidos" position="right" fontSize={9} fontWeight="bold" fill="#475569" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CARD GRÁFICO DONA MODERADO */}
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col justify-between min-h-[340px]">
              <div className="border-b border-slate-50 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900">Composición Operativa de Citas</h3>
              </div>
              <div className="flex relative items-center justify-center h-[200px] mt-2">
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-none">{totalCitasProcesadas.total}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">Citas Totales</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={totalCitasProcesadas.datosGrafico}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {totalCitasProcesadas.datosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} formatter={(value: any) => `${value} pacientes`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center items-center gap-4 text-[9px] font-bold border-t border-slate-50 pt-2.5 mt-2 flex-none">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 block"/>Atendidos: {totalCitasProcesadas.atendidos}</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 block"/>Ausentes: {totalCitasProcesadas.ausentes}</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block"/>Adicionales: {totalCitasProcesadas.adicionales}</div>
              </div>
            </div>

          </div>
        )}

        {/* TABLA MEJORADA CON ENCAJE TOTAL */}
        {vistaActual === 'tabla' && (
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-none gap-2">
              <div>
                <h3 className="font-extrabold text-xs text-slate-900">Desempeño Longitudinal</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-[28px] px-3 h-8 text-xs text-slate-700">
                  <span className="font-bold text-slate-400 text-[10px] mr-1">Turno:</span>
                  <select
                    value={turnoTabla}
                    onChange={(e) => { setTurnoTabla(e.target.value); setPaginaActual(1); }}
                    className="bg-transparent font-bold outline-none cursor-pointer text-slate-700"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                {/* Botón de Excel Optimizado */}
                <button 
                  onClick={() => generarExcelProductividad(datosTablaFiltrados, turnoTabla)}
                  className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 h-8 rounded-[28px] text-xs font-bold shadow-sm hover:bg-slate-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> <span>Excel</span>
                </button>

                {/* Botón de PDF Optimizado */}
                <button 
                  onClick={() => generarPDFProductividad(datosTablaFiltrados, turnoTabla)}
                  className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 h-8 rounded-[28px] text-xs font-bold shadow-sm hover:bg-slate-50"
                >
                  <FileText className="w-3.5 h-3.5 text-red-500" /> <span>PDF</span>
                </button>
              </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden mt-2">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[9px] uppercase tracking-wider font-bold">
                    <th className="px-3 py-2.5 font-bold">Médico</th>
                    <th className="px-3 py-2.5 font-bold">Especialidad</th>
                    <th className="px-3 py-2.5 text-center font-bold">Turno</th>
                    <th className="px-3 py-2.5 text-center font-bold">Agendadas</th>
                    <th className="px-3 py-2.5 text-center font-bold">Atendidas</th>
                    <th className="px-3 py-2.5 text-center font-bold">% Asist.</th>
                    <th className="px-3 py-2.5 text-center font-bold">Adic.</th>
                    <th className="px-3 py-2.5 text-center font-bold">Ausentes</th>
                    <th className="px-3 py-2.5 text-center font-bold">T. Prom.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tablaPaginada.map((medico, idx) => {
                    const porcentajeAsistencia = medico.agendadas > 0 ? ((medico.atendidos / medico.agendadas) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-800">{medico.nombre}</td>
                        <td className="px-3 py-2.5 text-slate-600">{medico.especialidad}</td>
                        <td className="px-3 py-2.5 text-center text-slate-600">{medico.turno}</td>
                        <td className="px-3 py-2.5 text-center font-medium text-slate-800">{medico.agendadas}</td>
                        <td className="px-3 py-2.5 text-center font-medium text-blue-600">{medico.atendidos}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800">{porcentajeAsistencia}%</td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-600 bg-emerald-50/40 rounded text-[10px]">{medico.adicionales}</td>
                        <td className="px-3 py-2.5 text-center text-red-500 font-medium">{medico.ausentes}</td>
                        <td className="px-3 py-2.5 text-center text-slate-600">{medico.tiempoPromedio}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BOTONERA NUMÉRICA COMPACTA */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto flex-none text-xs font-bold text-slate-500">
              <span>Mostrando {tablaPaginada.length} de {datosTablaFiltrados.length} registros</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPaginas }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaActual(i + 1)}
                    className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold border transition-colors ${
                      paginaActual === i + 1
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}