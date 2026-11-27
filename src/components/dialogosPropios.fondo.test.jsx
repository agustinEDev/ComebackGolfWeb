import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmModal from './modals/ConfirmModal';
import AliasSheet from './profile/AliasSheet';
import DialogosDePartidaRapida from './quick_match/DialogosDePartidaRapida';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave, i18n: { language: 'es' } }),
}));

/**
 * Los diálogos que no van sobre `ModalShell` y pintan su propio fondo. La regla
 * es la misma (Agustín, 23 nov 2026): tocar fuera cierra exactamente cuando
 * cerraría Escape, y solo con el gesto entero en el fondo.
 *
 * LA TABLA:
 *
 *   #   | diálogo                       | tocar fuera            | en vuelo
 *   ----|-------------------------------|------------------------|---------
 *   C1  | ConfirmModal                  | cierra (ya cerraba)    | no
 *   C2  | ConfirmModal, gesto desde la  | no                     |
 *       | caja (seleccionar el texto)   |                        |
 *   C3  | ConfirmModal: un clic de      | no llega a lo que lo   |
 *       | dentro                        | envuelve               |
 *   A1  | AliasSheet                    | cierra (ya cerraba)    | no
 *   Q1  | partida rápida: terminar      | cierra (antes no)      | no
 *   Q2  | partida rápida: cancelar      | cierra (antes no)      | no
 *   Q3  | partida rápida: desacuerdo    | no: hay que elegir,    |
 *       |                               | y Escape tampoco       |
 *
 * Las hojas de anotar (`hojasInferiores.foco`), las instrucciones de instalar,
 * el selector de stroke index y el asistente de partida rápida tienen sus
 * casos en sus propios tests.
 */
const tocarElFondo = (fondo) => {
  fireEvent.mouseDown(fondo);
  fireEvent.mouseUp(fondo);
  fireEvent.click(fondo);
};

describe('ConfirmModal · tocar fuera', () => {
  const abre = (props) =>
    render(
      <ConfirmModal
        isOpen
        title="¿Seguro?"
        message="No hay vuelta atrás"
        onConfirm={vi.fn()}
        {...props}
      />,
    );

  it('C1 · cierra tocando fuera', () => {
    const onCancel = vi.fn();
    abre({ onCancel });

    tocarElFondo(screen.getByRole('dialog'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('C1 · con la acción en vuelo, no (tampoco Escape)', () => {
    const onCancel = vi.fn();
    abre({ onCancel, isLoading: true });

    tocarElFondo(screen.getByRole('dialog'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('C2 · un gesto que empezó en la caja no cierra', () => {
    const onCancel = vi.fn();
    abre({ onCancel });

    fireEvent.mouseDown(screen.getByText('No hay vuelta atrás'));
    fireEvent.mouseUp(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));

    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('ConfirmModal · los clics de dentro', () => {
  // Se pinta a veces dentro de una fila o tarjeta con su propio `onClick`:
  // confirmar o cancelar no puede llegar hasta ella
  it('C3 · no llegan a lo que lo envuelve', () => {
    const deLaFila = vi.fn();
    render(
      <div onClick={deLaFila}>
        <ConfirmModal
          isOpen
          title="¿Seguro?"
          message="No hay vuelta atrás"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </div>,
    );

    fireEvent.click(screen.getByTestId('confirm-modal-confirm'));

    expect(deLaFila).not.toHaveBeenCalled();
  });
});

describe('AliasSheet · tocar fuera', () => {
  it('A1 · cierra tocando fuera', () => {
    const onClose = vi.fn();
    render(<AliasSheet aliasActual="" onGuardar={vi.fn()} onClose={onClose} />);

    tocarElFondo(screen.getByRole('dialog').parentElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('A1 · guardando, no (tampoco Escape)', async () => {
    const onClose = vi.fn();
    render(
      <AliasSheet
        aliasActual=""
        onGuardar={() => new Promise(() => {})}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByTestId('alias-sheet-input'), {
      target: { value: 'Chuchi' },
    });
    fireEvent.click(screen.getByTestId('alias-sheet-save'));
    await waitFor(() =>
      expect(screen.getByTestId('alias-sheet-save')).toBeDisabled(),
    );

    tocarElFondo(screen.getByRole('dialog').parentElement);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('DialogosDePartidaRapida · tocar fuera', () => {
  const t = (clave) => clave;
  const abre = (props) =>
    render(
      <DialogosDePartidaRapida
        t={t}
        showFinishConfirm={false}
        showCancelConfirm={false}
        hayDiscrepancia={false}
        yaCerrada={false}
        isSubmitting={false}
        onCerrarTerminar={vi.fn()}
        onTerminar={vi.fn()}
        onCerrarCancelar={vi.fn()}
        onCancelar={vi.fn()}
        resuelveDiscrepancia={vi.fn()}
        comoSeLee={(v) => String(v)}
        {...props}
      />,
    );
  const fondo = () => screen.getByRole('dialog').parentElement;

  it.each([
    ['Q1 · terminar', 'showFinishConfirm', 'onCerrarTerminar'],
    ['Q2 · cancelar', 'showCancelConfirm', 'onCerrarCancelar'],
  ])('%s: cierra tocando fuera', (_, abierto, cierre) => {
    const cerrar = vi.fn();
    abre({ [abierto]: true, [cierre]: cerrar });

    tocarElFondo(fondo());

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Q1 · terminar', 'showFinishConfirm', 'onCerrarTerminar'],
    ['Q2 · cancelar', 'showCancelConfirm', 'onCerrarCancelar'],
  ])('%s: con la petición en vuelo, no', (_, abierto, cierre) => {
    const cerrar = vi.fn();
    abre({ [abierto]: true, [cierre]: cerrar, isSubmitting: true });

    tocarElFondo(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it.each([
    ['Q1 · terminar', 'showFinishConfirm', 'onCerrarTerminar'],
    ['Q2 · cancelar', 'showCancelConfirm', 'onCerrarCancelar'],
  ])('%s: tocar dentro de la caja no cierra', (_, abierto, cierre) => {
    const cerrar = vi.fn();
    abre({ [abierto]: true, [cierre]: cerrar });

    tocarElFondo(screen.getByRole('dialog'));

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('Q3 · el desacuerdo no se cierra tocando fuera: hay que elegir', () => {
    const resuelve = vi.fn();
    const cerrarTerminar = vi.fn();
    const cerrarCancelar = vi.fn();
    abre({
      hayDiscrepancia: true,
      discrepancia: {
        holeNumber: 3,
        participantId: 'p1',
        enElServidor: 4,
        mio: 5,
      },
      myParticipant: { participantId: 'p1' },
      resuelveDiscrepancia: resuelve,
      onCerrarTerminar: cerrarTerminar,
      onCerrarCancelar: cerrarCancelar,
    });

    tocarElFondo(fondo());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(resuelve).not.toHaveBeenCalled();
    expect(cerrarTerminar).not.toHaveBeenCalled();
    expect(cerrarCancelar).not.toHaveBeenCalled();
  });
});
