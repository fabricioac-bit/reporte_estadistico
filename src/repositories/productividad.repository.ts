import { executeQuery } from '../lib/db';

export interface FiltrosProductividad {
    fechaInicio: string;
    fechaFin: string;
    especialidadId: string | null;
    medicoId: number | null;
}

export class ProductividadRepository {
    async obtenerProductividadMedica(filtros: FiltrosProductividad): Promise<any[]> {
        // Mapeo unificado y seguro de las propiedades del frontend
        const fechaInicio = filtros.fechaInicio;
        const fechaFin = filtros.fechaFin;
        const especialidadNombre = filtros.especialidadId && filtros.especialidadId !== '' ? filtros.especialidadId : null;
        const medicoId = filtros.medicoId && !isNaN(filtros.medicoId) ? filtros.medicoId : null;
        
        try {
            // Formateo seguro de fechas para compatibilidad con SQL Server (YYYYMMDD)
            const fechaInicioLimpia = fechaInicio.replace(/-/g, '');
            const fechaFinLimpia = fechaFin.replace(/-/g, '');

            const query = `
                DECLARE @FechaInicio VARCHAR(8) = '${fechaInicioLimpia}';
                DECLARE @FechaFin VARCHAR(8) = '${fechaFinLimpia}';
                DECLARE @EspecialidadNombre VARCHAR(100) = ${especialidadNombre ? `'${especialidadNombre}'` : 'NULL'};
                DECLARE @MedicoId INT = ${medicoId !== null ? medicoId : 'NULL'};

                SELECT 
                    M.IdMedico AS id,
                    (E.ApellidoPaterno + ' ' + ISNULL(E.ApellidoMaterno, '') + ' ' + E.Nombres) AS nombre,
                    S.Nombre AS especialidad,
                    
                    CASE 
                        WHEN T.IdTurno IN (36, 92, 94, 96) THEN 'Mañana'
                        WHEN T.IdTurno IN (38, 93, 95, 97) THEN 'Tarde'
                        ELSE 'Otro'
                    END AS turno,
                    
                    COUNT(C.IdCita) AS agendadas,
                    
                    -- Métrica unificada de Atendidos (FechaEgreso firmada)
                    COUNT(CASE 
                        WHEN A.FechaEgreso IS NOT NULL AND A.idEstadoAtencion <> 0 THEN A.IdAtencion 
                    END) AS atendidos,
                    
                    -- Métrica unificada de Ausentes (Cita existente sin Egreso)
                    COUNT(CASE 
                        WHEN A.IdAtencion IS NOT NULL AND A.FechaEgreso IS NULL AND A.idEstadoAtencion <> 0 THEN A.IdAtencion 
                    END) AS ausentes,
                    
                    -- Métrica de adicionales por consultorio
                    SUM(CASE WHEN C.EsCitaAdicional = 1 THEN 1 ELSE 0 END) AS adicionales,
                    
                    -- Tiempo promedio real indexado de EspecialidadCE (Cero retrasos en el servidor)
                    CAST(ISNULL(ECE.TiempoPromedioAtencion, 15) AS VARCHAR(3)) + ' min' AS tiempoPromedio

                FROM ProgramacionMedica PM
                INNER JOIN Medicos M ON M.IdMedico = PM.IdMedico
                INNER JOIN Empleados E ON E.IdEmpleado = M.IdEmpleado
                INNER JOIN Servicios S ON S.IdServicio = PM.IdServicio
                INNER JOIN Turnos T ON T.IdTurno = PM.IdTurno

                -- Conexión optimizada por ID de Especialidad
                LEFT JOIN EspecialidadCE ECE ON ECE.IdEspecialidad = PM.IdEspecialidad

                LEFT JOIN Citas C ON C.IdProgramacion = PM.IdProgramacion
                LEFT JOIN Atenciones A ON A.IdAtencion = C.IdAtencion

                WHERE 
                    PM.Fecha BETWEEN @FechaInicio AND @FechaFin
                    AND PM.IdTipoServicio = 1                                      -- Filtro estricto Consulta Externa
                    AND (A.EsPacienteExterno <> 1 OR A.EsPacienteExterno IS NULL)   -- Mapeo de especialidades CE
                    AND (A.idEstadoAtencion <> 0 OR A.idEstadoAtencion IS NULL)     -- Ignora anulados
                    
                    -- Embudo dinámico reactivo
                    AND (@EspecialidadNombre IS NULL OR S.Nombre = @EspecialidadNombre)
                    AND (@MedicoId IS NULL OR M.IdMedico = @MedicoId)

                GROUP BY 
                    S.Nombre,
                    M.IdMedico,
                    E.Nombres,
                    E.ApellidoPaterno,
                    E.ApellidoMaterno,
                    T.IdTurno,
                    ECE.TiempoPromedioAtencion
                ORDER BY 
                    S.Nombre, 
                    nombre;
            `;

            const result = await executeQuery<any>(query);
            return result.recordset;
        } catch (error) {
            console.error("Error crítico en ProductividadRepository:", error);
            throw error;
        }
    }
}