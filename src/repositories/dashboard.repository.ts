import mssql from 'mssql';
import { executeQuery } from '../lib/db';

// Interfaz adaptada al nuevo contrato del gráfico unificado
export interface TrimestreServiciosRaw {
  IdTipoServicio: number;
  ServicioNombre: string;
  MesNum: number;
  MesNombre: string;
  Cant_Atendidos: number;
  Cant_NoAtendidos: number;
  Cant_Eliminadas: number;
}

export interface FuenteFinanciamientoPorServicioRaw {
  IdTipoServicio: number;
  ServicioNombre: string;
  IdFuenteFinanciamiento: number;
  NombreFuente: string;
  CantidadAtenciones: number;
}

export interface EstadoCitasPorServicioRaw {
  IdTipoServicio: number;
  ServicioNombre: string;
  Cant_Atendidos: number;
  Cant_NoAtendidos: number;
  Cant_Eliminadas: number;
}

export class DashboardRepository {
  // KPIs Globales: Sincronizados con las consultas reales de SQL Server (Trimestre 2026)
  async getKpisGlobales(): Promise<any> {
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

    // ---- TARJETA 5: CAMAS EMBARAZO / EMERGENCIA ----
    const queryCamasEmerg = `
      SELECT 
        SUM(CASE WHEN IdPaciente IS NOT NULL THEN 1 ELSE 0 END) AS Camas_Ocupadas_Emerg,
        SUM(CASE WHEN IdPaciente IS NULL THEN 1 ELSE 0 END) AS Camas_Desocupadas_Emerg
      FROM Camas 
      WHERE IdServicioPropietario IN (385, 386, 387, 104, 86, 310)
    `;

    const [resConsultorio, resEmergencia, resHospitalizacion, resCamasHospit, resCamasEmerg] = await Promise.all([
      executeQuery<any>(queryConsultorio),
      executeQuery<any>(queryEmergencia),
      executeQuery<any>(queryHospitalizacion),
      executeQuery<any>(queryCamasHospit),
      executeQuery<any>(queryCamasEmerg)
    ]);

    return {
      totalAtenCE: resConsultorio.recordset[0]?.Cantidad || 0,
      totalEmergencia: resEmergencia.recordset[0]?.Cantidad || 0,
      totalHospit: resHospitalizacion.recordset[0]?.Cantidad || 0,
      
      Camas_Ocupadas_Hosp: resCamasHospit.recordset[0]?.Camas_Ocupadas_Hosp || 0,
      Camas_Desocupadas_Hosp: resCamasHospit.recordset[0]?.Camas_Desocupadas_Hosp || 0,
      Camas_Ocupadas_Emerg: resCamasEmerg.recordset[0]?.Camas_Ocupadas_Emerg || 0,
      Camas_Desocupadas_Emerg: resCamasEmerg.recordset[0]?.Camas_Desocupadas_Emerg || 0
    };
  }

  // GRÁFICO: Producción global de los 3 mesees
  async getRendimientoMensual(): Promise<TrimestreServiciosRaw[]> {
    const query = `
      SELECT
        IdTipoServicio,
        CASE IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END AS ServicioNombre,
        MONTH(FechaIngreso) AS MesNum,
        CASE MONTH(FechaIngreso)
          WHEN 4 THEN 'Abr'
          WHEN 5 THEN 'May'
          WHEN 6 THEN 'Jun'
        END AS MesNombre,
        SUM(CASE WHEN idEstadoAtencion <> 0
          AND ((IdTipoServicio = 1 AND FyHFinal IS NOT NULL)
            OR (IdTipoServicio IN (2, 3) AND FechaEgreso IS NOT NULL))
          THEN 1 ELSE 0 END) AS Cant_Atendidos,
        SUM(CASE WHEN idEstadoAtencion <> 0
          AND ((IdTipoServicio = 1 AND FyHFinal IS NULL)
            OR (IdTipoServicio IN (2, 3) AND FechaEgreso IS NULL))
          THEN 1 ELSE 0 END) AS Cant_NoAtendidos,
        SUM(CASE WHEN idEstadoAtencion = 0 THEN 1 ELSE 0 END) AS Cant_Eliminadas
      FROM sigh.dbo.Atenciones
      WHERE EsPacienteExterno <> 1
        AND IdTipoServicio IN (1, 2, 3)
        AND FechaIngreso BETWEEN '20260401' AND '20260630'
      GROUP BY IdTipoServicio, MONTH(FechaIngreso)
      ORDER BY IdTipoServicio, MONTH(FechaIngreso);
    `;

    const result = await executeQuery<TrimestreServiciosRaw>(query);
    return result.recordset;
  }

  // Gráfico de Fuentes de Financiamiento por Servicio
  async getFinanciamientoPorServicio(): Promise<FuenteFinanciamientoPorServicioRaw[]> {
    const query = `
      SELECT
        a.IdTipoServicio,
        CASE a.IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END AS ServicioNombre,
        f.IdFuenteFinanciamiento,
        f.Descripcion AS NombreFuente,
        COUNT(a.IdAtencion) AS CantidadAtenciones
      FROM sigh.dbo.Atenciones a
      INNER JOIN sigh.dbo.FuentesFinanciamiento f
        ON f.IdFuenteFinanciamiento = a.IdFuenteFinanciamiento
      WHERE
        a.EsPacienteExterno <> 1
        AND a.idEstadoAtencion <> 0
        AND a.FechaEgreso IS NOT NULL
        AND a.IdTipoServicio IN (1, 2, 3)
        AND a.IdFuenteFinanciamiento IN (1, 5, 3, 4, 7, 9, 16, 17)
        AND a.FechaIngreso BETWEEN '20260401' AND '20260630'
      GROUP BY
        a.IdTipoServicio,
        CASE a.IdTipoServicio
          WHEN 1 THEN 'CE'
          WHEN 2 THEN 'Emergencia'
          WHEN 3 THEN 'Hospitalización'
        END,
        f.IdFuenteFinanciamiento,
        f.Descripcion
      ORDER BY
        a.IdTipoServicio,
        f.IdFuenteFinanciamiento;
    `;

    const result = await executeQuery<FuenteFinanciamientoPorServicioRaw>(query);
    return result.recordset;
  }

}