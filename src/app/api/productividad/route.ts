import { NextResponse } from 'next/server';
import { ProductividadRepository } from '@/repositories/productividad.repository';

export async function GET(request: Request) {
  const repoProductividad = new ProductividadRepository();
  
  try {
    const { searchParams } = new URL(request.url);
    
    const filtrosRaw = {
      fechaInicio: searchParams.get('fechaInicio') || '',
      fechaFin: searchParams.get('fechaFin') || '',
      turno: searchParams.get('turno'),
      especialidadId: searchParams.get('especialidadId'), // Captura el string del nombre del servicio
      medicoId: searchParams.get('medicoId'),
    };

    const data = await repoProductividad.obtenerProductividadMedica({
      fechaInicio: filtrosRaw.fechaInicio,
      fechaFin: filtrosRaw.fechaFin,
      turno: filtrosRaw.turno,
      especialidadId: filtrosRaw.especialidadId, 
      medicoId: filtrosRaw.medicoId ? parseInt(filtrosRaw.medicoId, 10) : null,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("💥 Error en el controlador de Next.js (route.ts):", error.message);
    return NextResponse.json(
      { success: false, mensaje: error.message || 'Error interno en el servidor' }, 
      { status: 500 }
    );
  }
}