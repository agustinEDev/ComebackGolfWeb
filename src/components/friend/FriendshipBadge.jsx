import { useTranslation } from 'react-i18next';
import FriendshipStatus from '../../domain/value_objects/FriendshipStatus';

const STATUS_COLORS = {
  [FriendshipStatus.PENDING]: 'border border-current text-aviso',
  [FriendshipStatus.ACCEPTED]: 'border border-current text-exito',
  [FriendshipStatus.DECLINED]: 'border border-current text-error',
  [FriendshipStatus.BLOCKED]: 'border border-current text-tinta',
};

const FriendshipBadge = ({ status }) => {
  const { t } = useTranslation('friends');

  const colorClass =
    STATUS_COLORS[status] || 'border border-current text-tinta-suave';

  return (
    <span
      data-testid="friendship-badge"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {t(`status.${status}`)}
    </span>
  );
};

export default FriendshipBadge;
