import { ProductividadRepository, FiltrosProductividad } from '../repositories/productividad.repository';

interface FiltrosRaw {
    fechaInicio?: any;
    fechaFin?: any;
    turno?: any;
    especialidad?: any;
    medico?: any;
}

export class ProductividadService {
    // Instanciamos el repositorio de manera privada siguiendo tu arquitectura
    private productividadRepository = new ProductividadRepository();

    async obtenerReporteEstadistico(filtrosRaw: FiltrosRaw) {
        try {
            const filtros: FiltrosProductividad = {
                fechaInicio: filtrosRaw.fechaInicio ? String(filtrosRaw.fechaInicio) : '',
                fechaFin: filtrosRaw.fechaFin ? String(filtrosRaw.fechaFin) : '',
                especialidadId: filtrosRaw.especialidad && filtrosRaw.especialidad !== '' ? String(filtrosRaw.especialidad) : null, // Mantenemos String de texto limpio
                medicoId: filtrosRaw.medico && filtrosRaw.medico !== '' ? parseInt(filtrosRaw.medico, 10) : null
            };

            if (!filtros.fechaInicio || !filtros.fechaFin) {
                throw new Error("El rango de fechas es obligatorio.");
            }

            // Invocamos correctamente al repositorio
            const data = await this.productividadRepository.obtenerProductividadMedica(filtros);
            
            // Retornamos bajo la misma estructura unificada de tu arquitectura
            return {
                success: true,
                data: data
            };
        } catch (error: any) {
            console.error('[ProductividadService] Error en consolidación de producción médica:', error.message);
            throw error;
        }
    }
}