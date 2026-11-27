import { useTranslation } from 'react-i18next';
import InvitationStatus from '../../domain/value_objects/InvitationStatus';

const STATUS_COLORS = {
  [InvitationStatus.PENDING]: 'border border-current text-aviso',
  [InvitationStatus.ACCEPTED]: 'border border-current text-exito',
  [InvitationStatus.DECLINED]: 'border border-current text-error',
  [InvitationStatus.EXPIRED]: 'border border-current text-tinta-suave',
  [InvitationStatus.NO_ROOM]: 'border border-current text-aviso',
  // La retiró quien invita (FE #724): distinta de la caducada
  [InvitationStatus.CANCELLED]: 'border border-current text-tinta',
  // En lista de espera hasta que se reabra la inscripción (15 nov 2026)
  [InvitationStatus.ON_HOLD]: 'border border-current text-aviso',
};

const InvitationBadge = ({ status }) => {
  const { t } = useTranslation('invitations');

  const colorClass =
    STATUS_COLORS[status] || 'border border-current text-tinta-suave';

  return (
    <span
      data-testid="invitation-badge"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {t(`status.${status}`)}
    </span>
  );
};

export default InvitationBadge;
