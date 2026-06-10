'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { RefreshCw, Settings, LogOut } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState<{ nombre: string; usuario: string } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success && response.data.usuario) {
          setUsuario(response.data.usuario);
        }
      } catch (error) {
        console.warn('No se pudo cargar el usuario en el header');
      }
    };

    loadUser();
  }, []);

  const getUserInitial = () => {
    const name = usuario?.nombre?.trim();
    const username = usuario?.usuario?.trim();
    if (name) return name[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    Swal.fire({
      title: '¿Desea cerrar sesión?',
      text: 'Se eliminarán sus cookies seguras del navegador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, Salir',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post('/api/auth/logout');
          Swal.fire({
            title: 'Sesión Cerrada',
            text: 'Ha salido del sistema hospitalario de forma segura.',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
          }).then(() => {
            router.push('/login');
            router.refresh();
          });
        } catch (e) {
          document.cookie = 'sigh_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          router.push('/login');
        }
      }
    });
  };

  const handleChangePassword = async () => {
    setProfileMenuOpen(false);
    const result = await Swal.fire({
      title: 'Cambiar clave',
      html: `
        <input id="swal-current-password" type="password" class="swal2-input" placeholder="Contraseña actual" />
        <input id="swal-new-password" type="password" class="swal2-input" placeholder="Nueva contraseña" />
        <input id="swal-confirm-password" type="password" class="swal2-input" placeholder="Confirmar contraseña" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const currentPassword = (document.getElementById('swal-current-password') as HTMLInputElement)?.value;
        const newPassword = (document.getElementById('swal-new-password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('swal-confirm-password') as HTMLInputElement)?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Complete todos los campos.');
          return null;
        }
        if (newPassword.length < 6) {
          Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres.');
          return null;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contraseñas no coinciden.');
          return null;
        }
        return { currentPassword, newPassword, confirmPassword };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: result.value.currentPassword,
        newPassword: result.value.newPassword,
        confirmPassword: result.value.confirmPassword,
      });
      Swal.fire({
        title: 'Clave cambiada',
        text: 'Su nueva contraseña se ha guardado correctamente.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.mensaje || 'No se pudo cambiar la contraseña.',
        icon: 'error',
      });
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-[28px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-5 md:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel de Control Clínico</h1>
        <p className="text-slate-500 mt-1 text-sm">Estadística hospitalaria integral y productividad de personal en tiempo real.</p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        <button
          type="button"
          onClick={handleChangePassword}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <Settings className="inline-block w-4 h-4 mr-2 text-slate-500" />
          Cambiar clave
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase shadow-lg ring-1 ring-slate-900/10"
          >
            {getUserInitial()}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl z-20">
              <button
                type="button"
                onClick={handleChangePassword}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Cambiar clave</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
