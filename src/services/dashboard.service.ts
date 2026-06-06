import { DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();
  private nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  async getDashboardData() {
    try {
      const fechaActual = new Date();
      const anioActual = fechaActual.getFullYear();

      // Consumo en paralelo del repositorio con los nuevos contratos estandarizados
      const [kpisRaw, rendimientoRaw, horasRaw] = await Promise.all([
        this.dashboardRepository.getKpisGlobales(),
        this.dashboardRepository.getRendimientoMensual(anioActual),
        this.dashboardRepository.getDemandaPorHoras()
      ]);

      // FORMATEADOR 1 (Izquierdo): Estructura de Meses para el gráfico de barras
      const rendimientoMensualFormateado = this.nombresMeses.map((mesNombre, indice) => {
        const mesNumero = indice + 1;
        const registro = rendimientoRaw.find(r => r.MesNum === mesNumero);
        return {
          mes: mesNombre,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      // FORMATEADOR 2 (Derecho): Estructura de Horas para el componente de líneas
      const horasTurnos = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18];
      
      const historialQuirurgicoFormateado = horasTurnos.map(hora => {
        const registro = horasRaw.find(h => h.MesNum === hora);
        return {
          mes: `${hora.toString().padStart(2, '0')}:00`,
          cantidad: registro ? registro.Cantidad : 0
        };
      });

      return {
        success: true,
        data: {
          kpis: {
            // Unificación total de Atenciones
            totalAtenCE: kpisRaw ? kpisRaw.totalAtenCE : 0, 
            consultas_tendencia: 0, 
            
            totalEmergencia: kpisRaw ? kpisRaw.totalEmergencia : 0, 
            emergencia_tendencia: 0,
            
            totalHospit: kpisRaw ? kpisRaw.totalHospit : 0, 
            cirugias_tendencia: 0,
            
            // Unificación del Censo de Camas en Tiempo Real (Hospitalización y Emergencia)
            Camas_Ocupadas_Hosp: kpisRaw ? kpisRaw.Camas_Ocupadas_Hosp : 0,
            Camas_Desocupadas_Hosp: kpisRaw ? kpisRaw.Camas_Desocupadas_Hosp : 0,
            Camas_Ocupadas_Emerg: kpisRaw ? kpisRaw.Camas_Ocupadas_Emerg : 0,
            Camas_Desocupadas_Emerg: kpisRaw ? kpisRaw.Camas_Desocupadas_Emerg : 0
          },
          rendimiento_mensual: rendimientoMensualFormateado,
          historial_quirurgico: historialQuirurgicoFormateado
        }
      };

    } catch (error: any) {
      console.error('[DashboardService] Error en consolidación de producción:', error.message);
      throw error;
    }
  }
}