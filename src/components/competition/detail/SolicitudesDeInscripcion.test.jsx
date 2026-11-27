import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SolicitudesDeInscripcion from './SolicitudesDeInscripcion';

/**
 * Los botones de una solicitud pendiente (ComeBack Golf).
 *
 *   #   caso                          | «Aprobar»                 | «Rechazar»
 *   ----|-----------------------------|---------------------------|-----------
 *   S1  hay sitio                     | en el color de éxito      | de error
 *   S2  el torneo está lleno          | apagado y desactivado: no | de error
 *                                     | parece el botón principal |
 *   S3  pulsar con sitio              | aprueba esa solicitud     |
 *   S4  pulsar rechazar               |                           | la rechaza
 */
const t = (clave) => clave;
const SOLICITUD = {
  id: 'e-1',
  status: 'REQUESTED',
  userName: 'Julia',
  userHandicap: 18,
  createdAt: '2026-11-20T10:00:00Z',
};

const pinta = (props = {}) => {
  const aprobar = vi.fn();
  const rechazar = vi.fn();
  render(
    <SolicitudesDeInscripcion
      competition={{ id: 'c-1', maxPlayers: 4 }}
      enrollments={[SOLICITUD]}
      t={t}
      i18n={{ language: 'es' }}
      isFull={false}
      handleApproveEnrollment={aprobar}
      handleRejectEnrollment={rechazar}
      {...props}
    />,
  );
  return {
    aprobar,
    rechazar,
    botonDeAprobar: screen.getByRole('button', { name: /detail\.approve/ }),
    botonDeRechazar: screen.getByRole('button', { name: /detail\.reject/ }),
  };
};

const clases = (el) => el.className.split(/\s+/);

describe('SolicitudesDeInscripcion · aprobar y rechazar', () => {
  it('S1: con sitio, aprobar va en el color de éxito y rechazar en el de error', () => {
    const { botonDeAprobar, botonDeRechazar } = pinta();

    expect(botonDeAprobar).toBeEnabled();
    expect(clases(botonDeAprobar)).toEqual(
      expect.arrayContaining(['bg-exito', 'text-sobre-contraste']),
    );
    expect(clases(botonDeRechazar)).toEqual(
      expect.arrayContaining(['bg-error', 'text-sobre-contraste']),
    );
  });

  it('S2: con el torneo lleno, aprobar queda apagado y desactivado', () => {
    const { botonDeAprobar, botonDeRechazar } = pinta({ isFull: true });

    expect(botonDeAprobar).toBeDisabled();
    // Apagado: ni el color de éxito ni el de contraste, que lo harían parecer
    // el botón más fuerte de la fila
    expect(clases(botonDeAprobar)).toEqual(
      expect.arrayContaining(['bg-linea', 'text-tinta-suave']),
    );
    expect(clases(botonDeAprobar)).not.toContain('bg-exito');
    expect(clases(botonDeAprobar)).not.toContain('bg-contraste');
    expect(botonDeRechazar).toBeEnabled();
  });

  it('S3: pulsar aprobar aprueba esa solicitud', () => {
    const { aprobar, botonDeAprobar } = pinta();

    fireEvent.click(botonDeAprobar);

    expect(aprobar).toHaveBeenCalledWith('e-1');
  });

  it('S4: pulsar rechazar la rechaza', () => {
    const { rechazar, botonDeRechazar } = pinta();

    fireEvent.click(botonDeRechazar);

    expect(rechazar).toHaveBeenCalledWith('e-1');
  });
});
