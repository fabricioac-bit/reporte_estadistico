import mssql from 'mssql';
import { executeQuery } from '../lib/db';

export interface FiltrosProductividad {
    fechaInicio: string;
    fechaFin: string;
    turno: string | null;
    especialidadId: string | null;
    medicoId: number | null;
}

export class ProductividadRepository {
    async obtenerProductividadMedica(filtros: FiltrosProductividad): Promise<any[]> {
        const { fechaInicio, fechaFin, especialidadId, medicoId } = {
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
            especialidadId: filtros.especialidadId && filtros.especialidadId !== '' ? filtros.especialidadId : null,
            medicoId: filtros.medicoId && !isNaN(filtros.medicoId) ? filtros.medicoId : null
        };
        
        try {
            const fechaInicioLimpia = fechaInicio.replace(/-/g, '');
            const fechaFinLimpia = fechaFin.replace(/-/g, '');

            const query = `
                DECLARE @FechaInicio VARCHAR(8) = '${fechaInicioLimpia}';
                DECLARE @FechaFin VARCHAR(8) = '${fechaFinLimpia}';
                DECLARE @EspecialidadNombre VARCHAR(100) = ${especialidadId ? `'${especialidadId}'` : 'NULL'};
                DECLARE @MedicoId INT = ${medicoId !== null ? medicoId : 'NULL'};

                SELECT 
                    M.IdMedico AS id,
                    (E.ApellidoPaterno + ' ' + ISNULL(E.ApellidoMaterno, '') + ' ' + E.Nombres) AS nombre,
                    S.Nombre AS especialidad,
                    
                    -- Conservamos el cálculo de turnos individuales por fila para la auditoría de la tabla
                    CASE 
                        WHEN T.IdTurno IN (36, 92, 94, 96) THEN 'Mañana'
                        WHEN T.IdTurno IN (38, 93, 95, 97) THEN 'Tarde'
                        ELSE 'Otro'
                    END AS turno,
                    
                    COUNT(C.IdCita) AS agendadas,
                    COUNT(CASE WHEN A.FyHFinal IS NOT NULL THEN A.IdAtencion END) AS atendidos,
                    (COUNT(C.IdCita) - COUNT(CASE WHEN A.FyHFinal IS NOT NULL THEN A.IdAtencion END)) AS ausentes,
                    SUM(CASE WHEN C.EsCitaAdicional = 1 THEN 1 ELSE 0 END) AS adicionales,
                    
                    '12 min' AS tiempoPromedio,
                    CASE 
                        WHEN COUNT(CASE WHEN A.FyHFinal IS NOT NULL THEN A.IdAtencion END) = 0 THEN 'Consultorio Demorado'
                        ELSE 'Atendiendo con Normalidad'
                    END AS estado

                FROM ProgramacionMedica PM
                INNER JOIN Medicos M ON M.IdMedico = PM.IdMedico
                INNER JOIN Empleados E ON E.IdEmpleado = M.IdEmpleado
                INNER JOIN Servicios S ON S.IdServicio = PM.IdServicio
                INNER JOIN Turnos T ON T.IdTurno = PM.IdTurno
                LEFT JOIN Citas C ON C.IdProgramacion = PM.IdProgramacion
                LEFT JOIN Atenciones A ON A.IdAtencion = C.IdAtencion

                WHERE 
                    PM.Fecha BETWEEN @FechaInicio AND @FechaFin
                    AND PM.IdTipoServicio = 1
                    
                    AND (@EspecialidadNombre IS NULL OR S.Nombre = @EspecialidadNombre)
                    AND (@MedicoId IS NULL OR M.IdMedico = @MedicoId)

                GROUP BY 
                    S.Nombre,
                    M.IdMedico,
                    E.Nombres,
                    E.ApellidoPaterno,
                    E.ApellidoMaterno,
                    T.IdTurno; -- Mantenemos la granularidad para que el Frontend pueda filtrar turnos localmente en la tabla
            `;

            const result = await executeQuery<any>(query);
            return result.recordset;
        } catch (error) {
            console.error("Error crítico en ProductividadRepository:", error);
            throw error;
        }
    }
}