import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface MensualRaw {
  MesNum: number;
  Cantidad: number;
}

export class DashboardRepository {
  // KPIs Globales: Sincronizados con las consultas reales de SQL Server (Trimestre 2026)
  async getKpisGlobales(): Promise<any> {
    
    // Filtros de fecha exactos de tus queries puras de SQL Server
    const fechaInicioCE = '20260401';
    const fechaFinCE = '20260630';
    
    const fechaInicioTri = '20260401';
    const fechaFinTri = '20260630';

    // ---- TARJETA 1: CONSULTORIO EXTERNO ----
    const queryConsultorio = `
      SELECT COUNT(idatencion) AS Cantidad
      FROM Atenciones  
      WHERE EsPacienteExterno <> 1    
        AND idEstadoAtencion <> 0
        AND IdTipoServicio = 1
        AND FyHFinal IS NOT NULL 
        AND FechaIngreso BETWEEN '${fechaInicioCE}' AND '${fechaFinCE}'
    `;

    // ---- TARJETA 2: EMERGENCIA ----
    const queryEmergencia = `
      SELECT COUNT(idatencion) AS Cantidad
      FROM Atenciones  
      WHERE EsPacienteExterno <> 1    
        AND idEstadoAtencion <> 0
        AND IdTipoServicio = 2
        AND FechaEgreso IS NOT NULL
        AND FechaIngreso BETWEEN '${fechaInicioTri}' AND '${fechaFinTri}'
    `;

    // ---- TARJETA 3: HOSPITALIZACION ----
    const queryHospitalizacion = `
      SELECT COUNT(idatencion) AS Cantidad
      FROM Atenciones  
      WHERE EsPacienteExterno <> 1    
        AND idEstadoAtencion <> 0
        AND IdTipoServicio = 3
        AND FechaEgreso IS NOT NULL
        AND FechaIngreso BETWEEN '${fechaInicioTri}' AND '${fechaFinTri}'
    `;

    // ---- TARJETA 4: CAMAS HOSPITALIZACION ----
    const queryCamasHospit = `
      SELECT 
        SUM(CASE WHEN IdPaciente IS NOT NULL THEN 1 ELSE 0 END) AS Camas_Ocupadas_Hosp,
        SUM(CASE WHEN IdPaciente IS NULL THEN 1 ELSE 0 END) AS Camas_Desocupadas_Hosp
      FROM Camas 
      WHERE IdServicioPropietario IN (218, 216, 213, 219, 420, 399, 400, 401, 290, 255, 249, 6, 405, 179, 2, 318, 317)
    `;

    // ---- TARJETA 5: CAMAS EMERGENCIA ----
    const queryCamasEmerg = `
      SELECT 
        SUM(CASE WHEN IdPaciente IS NOT NULL THEN 1 ELSE 0 END) AS Camas_Ocupadas_Emerg,
        SUM(CASE WHEN IdPaciente IS NULL THEN 1 ELSE 0 END) AS Camas_Desocupadas_Emerg
      FROM Camas 
      WHERE IdServicioPropietario IN (385, 386, 387, 104, 86, 310)
    `;

    // Ejecución en paralelo de tus 5 consultas optimizadas en la base de datos
    const [resConsultorio, resEmergencia, resHospitalizacion, resCamasHospit, resCamasEmerg] = await Promise.all([
      executeQuery<any>(queryConsultorio),
      executeQuery<any>(queryEmergencia),
      executeQuery<any>(queryHospitalizacion),
      executeQuery<any>(queryCamasHospit),
      executeQuery<any>(queryCamasEmerg)
    ]);

    // RETORNO UNIFICADO CON TUS NUEVOS ALIAS
    return {
      totalAtenCE: resConsultorio.recordset[0]?.Cantidad || 0,
      totalEmergencia: resEmergencia.recordset[0]?.Cantidad || 0,
      totalHospit: resHospitalizacion.recordset[0]?.Cantidad || 0,
      
      // Mapeo exacto de las nuevas columnas de camas
      Camas_Ocupadas_Hosp: resCamasHospit.recordset[0]?.Camas_Ocupadas_Hosp || 0,
      Camas_Desocupadas_Hosp: resCamasHospit.recordset[0]?.Camas_Desocupadas_Hosp || 0,
      Camas_Ocupadas_Emerg: resCamasEmerg.recordset[0]?.Camas_Ocupadas_Emerg || 0,
      Camas_Desocupadas_Emerg: resCamasEmerg.recordset[0]?.Camas_Desocupadas_Emerg || 0
    };
  }

  // Gráfico Izquierdo: Volumen por MESES
  async getRendimientoMensual(anio: number): Promise<MensualRaw[]> {
    const query = `
      SELECT 
        MONTH(FechaIngreso) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE YEAR(FechaIngreso) = @anio AND MONTH(FechaIngreso) BETWEEN 1 AND 6
      GROUP BY MONTH(FechaIngreso)
      ORDER BY MONTH(FechaIngreso) ASC
    `;

    const result = await executeQuery<MensualRaw>(query, {
      anio: { type: mssql.Int, value: anio }
    });

    return result.recordset;
  }

  // Gráfico Derecho: Volumen agrupado por HORAS
  async getDemandaPorHoras(): Promise<any[]> {
    const query = `
      SELECT 
        CAST(SUBSTRING(HoraIngreso, 1, 2) AS INT) as MesNum,
        COUNT(IdAtencion) as Cantidad
      FROM sigh.dbo.Atenciones
      WHERE MONTH(FechaIngreso) = 6
      GROUP BY CAST(SUBSTRING(HoraIngreso, 1, 2) AS INT)
      ORDER BY MesNum ASC
    `;

    const result = await executeQuery<any>(query);
    return result.recordset;
  }
}