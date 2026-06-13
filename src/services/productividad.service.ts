import { ProductividadRepository, FiltrosProductividad } from '../repositories/productividad.repository';

interface FiltrosRaw {
    fechaInicio?: any;
    fechaFin?: any;
    turno?: any;
    especialidad?: any;
    medico?: any;
}

export class ProductividadService {
    // Instanciamos el repositorio internamente de manera privada, igual que en tu Dashboard
    private productividadRepository = new ProductividadRepository();

    async obtenerReporteEstadistico(filtrosRaw: FiltrosRaw) {
        try {
            const filtros: FiltrosProductividad = {
                fechaInicio: filtrosRaw.fechaInicio ? String(filtrosRaw.fechaInicio) : '',
                fechaFin: filtrosRaw.fechaFin ? String(filtrosRaw.fechaFin) : '',
                turno: filtrosRaw.turno || null,
                especialidadId: filtrosRaw.especialidad && filtrosRaw.especialidad !== '' ? parseInt(filtrosRaw.especialidad, 10) : null,
                medicoId: filtrosRaw.medico && filtrosRaw.medico !== '' ? parseInt(filtrosRaw.medico, 10) : null
            };

            if (!filtros.fechaInicio || !filtros.fechaFin) {
                throw new Error("El rango de fechas es obligatorio.");
            }

            // Invocamos al repositorio instanciado
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