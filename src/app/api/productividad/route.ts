import { NextResponse } from 'next/server';
import { ProductividadService } from '@/services/productividad.service';

export async function GET(request: Request) {
  // Instanciamos el Service para respetar las capas del software, no el Repo de frente
  const servicioProductividad = new ProductividadService();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Mapeamos las llaves exactamente con los nombres que espera recibir tu "FiltrosRaw" del Service
    const filtrosRaw = {
      fechaInicio: searchParams.get('fechaInicio') || '',
      fechaFin: searchParams.get('fechaFin') || '',
      turno: searchParams.get('turno'),
      especialidad: searchParams.get('especialidadId'), // Se alinea como "especialidad" string
      medico: searchParams.get('medicoId'),             // Se alinea como "medico" para que el service lo parsee a Int
    };

    // Consumimos a través del Service pasándole el objeto crudo de la URL
    const respuestaConsolidada = await servicioProductividad.obtenerReporteEstadistico(filtrosRaw);

    // Como tu frontend del dashboard ya espera el arreglo de datos directo para los gráficos y tablas, 
    // respondemos con el .data que devolvió el Service
    return NextResponse.json(respuestaConsolidada.data);
    
  } catch (error: any) {
    console.error("Error en el controlador de Next.js (route.ts):", error.message);
    return NextResponse.json(
      { success: false, mensaje: error.message || 'Error interno en el servidor' }, 
      { status: 500 }
    );
  }
}