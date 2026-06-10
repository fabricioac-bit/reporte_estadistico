import { DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();
  // Reducimos la estructura fija exclusivamente al trimestre solicitado por el ingeniero
  private mesesTrimestre = [
    { num: 4, nombre: 'Abr' },
    { num: 5, nombre: 'May' },
    { num: 6, nombre: 'Jun' }
  ];

  async getDashboardData() {
    try {
      // Consumo en paralelo del repositorio con la nueva query unificada por servicios
      const [kpisRaw, rendimientoRaw, financiamientoRaw] = await Promise.all([
        this.dashboardRepository.getKpisGlobales(),
        this.dashboardRepository.getRendimientoMensual(),
        this.dashboardRepository.getFinanciamientoPorServicio(),
      ]);

      const serviciosFinanciamiento = [
        { servicioId: 1, servicioNombre: 'CE' },
        { servicioId: 2, servicioNombre: 'Emergencia' },
        { servicioId: 3, servicioNombre: 'Hospitalización' }
      ];

      const estadoCitasPorServicio = rendimientoRaw.map((servicio) => ({
        servicioId: servicio.IdTipoServicio,
        servicioNombre: servicio.ServicioNombre,
        atendidos: servicio.Cant_Atendidos,
        noAtendidos: servicio.Cant_NoAtendidos,
        eliminadas: servicio.Cant_Eliminadas
      }));

      const financiamientoPorServicio = serviciosFinanciamiento.map((servicio) => {
        return {
          servicioId: servicio.servicioId,
          servicioNombre: servicio.servicioNombre,
          datos: financiamientoRaw
            .filter(item => item.IdTipoServicio === servicio.servicioId)
            .map(item => ({
              nombre_financ: item.NombreFuente,
              cantidad_atenciones: item.CantidadAtenciones
            }))
            .sort((a, b) => b.cantidad_atenciones - a.cantidad_atenciones)
        };
      });

      return {
        success: true,
        data: {
          kpis: {
            // Unificación total de Atenciones de Tarjetas Acumuladas
            totalAtenCE: kpisRaw ? kpisRaw.totalAtenCE : 0, 
            consultas_tendencia: 0, 
            
            totalEmergencia: kpisRaw ? kpisRaw.totalEmergencia : 0, 
            emergencia_tendencia: 0,
            
            totalHospit: kpisRaw ? kpisRaw.totalHospit : 0, 
            cirugias_tendencia: 0,
            
            // Censo de Camas en Tiempo Real
            Camas_Ocupadas_Hosp: kpisRaw ? kpisRaw.Camas_Ocupadas_Hosp : 0,
            Camas_Desocupadas_Hosp: kpisRaw ? kpisRaw.Camas_Desocupadas_Hosp : 0,
            Camas_Ocupadas_Emerg: kpisRaw ? kpisRaw.Camas_Ocupadas_Emerg : 0,
            Camas_Desocupadas_Emerg: kpisRaw ? kpisRaw.Camas_Desocupadas_Emerg : 0
          },
          rendimiento_mensual: [], // El reporte mensual histórico ya no es el foco actual
          estado_citas_por_servicio: estadoCitasPorServicio,
          financiamiento_por_servicio: financiamientoPorServicio,
        }
      };

    } catch (error: any) {
      console.error('[DashboardService] Error en consolidación de producción:', error.message);
      throw error;
    }
  }
}