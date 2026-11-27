import {
  CLASE_DE_LA_LISTA_DE_PESTANAS,
  claseDePestana,
} from '../../components/ui/clasesDeComportamiento';
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import customToast from '../../utils/toast';
import HeaderAuth from '../../components/layout/HeaderAuth';
import { useAuth } from '../../hooks/useAuth';
import { useCargaCancelableEffect } from '../../hooks/useCargaCancelableEffect';
import FriendCard from '../../components/friend/FriendCard';
import AddFriendModal from '../../components/friend/AddFriendModal';
import {
  listFriendsUseCase,
  listPendingFriendRequestsUseCase,
  respondFriendRequestUseCase,
  removeFriendUseCase,
  blockUserUseCase,
  searchUsersUseCase,
} from '../../composition';
import BlockLoader from '../../components/ui/BlockLoader';
import {
  GrupoDePestanas,
  ListaDePestanas,
  PanelDePestana,
} from '../../components/ui/Pestanas';
import { PANTALLA_MENOS_BARRA_INFERIOR } from '../../utils/barraInferior';
import { mensajeDelError } from '../../utils/mensajeDelError';
import { registraElFallo } from '../../utils/registraElFallo';
import { marcaDeAgua } from '../../utils/marcaDeAgua';
import DibujoDeMarca from '../../components/ui/DibujoDeMarca';

const TABS = ['friends', 'received', 'sent'];

const FriendsPage = () => {
  const { t } = useTranslation('friends');
  const { user, loading: isLoadingUser } = useAuth();

  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [processingKeys, setProcessingKeys] = useState(() => new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const startProcessing = (key) => {
    setProcessingKeys((prev) => new Set(prev).add(key));
  };

  const stopProcessing = (key) => {
    setProcessingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Del id y no del objeto: la misma persona con un `user` nuevo (la sesión
  // se vuelve a leer) no recarga la página ni suelta las tarjetas ocupadas
  const userId = user?.id;
  // Las tres listas, al entrar y tras cada acción. De dos acciones seguidas,
  // la recarga de la primera que llegue tarde ya no pisa la de la segunda.
  // Tras una acción se recarga en silencio: sin la espera de toda la página,
  // solo la de su tarjeta, que sigue ocupada hasta que llega SU recarga
  const { cargando, recargar } = useCargaCancelableEffect(
    () =>
      Promise.all([
        listFriendsUseCase.execute(userId),
        listPendingFriendRequestsUseCase.execute(userId, 'received'),
        listPendingFriendRequestsUseCase.execute(userId, 'sent'),
      ]),
    [userId],
    {
      activa: Boolean(userId),
      alCargar: ([friendsResult, receivedResult, sentResult]) => {
        setFriends(friendsResult.friendships);
        setReceived(receivedResult.friendships);
        setSent(sentResult.friendships);
      },
      alFallar: (error) => {
        registraElFallo(
          'FriendsPage.error-loading-friends',
          'Error loading friends:',
          error,
        );
        customToast.error(mensajeDelError(error, t('errors.failedToLoad')));
      },
    },
  );
  // Sin usuario no se pide nada y se sigue esperando, como antes
  const isLoading = cargando || !user;

  // La recarga tras una acción, y que la tarjeta siga ocupada hasta que lleguen
  // unas listas que ya la incluyan: si otra acción la sustituye, su promesa
  // espera a la recarga más reciente (lo hace el hook)
  const recargarTrasLaAccion = () => recargar({ silenciosa: true });

  const handleAccept = async (friendshipId) => {
    const key = `friendship:${friendshipId}`;
    startProcessing(key);
    try {
      await respondFriendRequestUseCase.execute(friendshipId, 'ACCEPT');
      customToast.success(t('success.accepted'));
      await recargarTrasLaAccion();
    } catch (error) {
      registraElFallo(
        'FriendsPage.error-accepting-friend-request',
        'Error accepting friend request:',
        error,
      );
      customToast.error(mensajeDelError(error, t('errors.failedToRespond')));
    } finally {
      stopProcessing(key);
    }
  };

  const handleDecline = async (friendshipId) => {
    const key = `friendship:${friendshipId}`;
    startProcessing(key);
    try {
      await respondFriendRequestUseCase.execute(friendshipId, 'DECLINE');
      customToast.success(t('success.declined'));
      await recargarTrasLaAccion();
    } catch (error) {
      registraElFallo(
        'FriendsPage.error-declining-friend-request',
        'Error declining friend request:',
        error,
      );
      customToast.error(mensajeDelError(error, t('errors.failedToRespond')));
    } finally {
      stopProcessing(key);
    }
  };

  const handleRemoveOrCancel = async (friendshipId) => {
    const key = `friendship:${friendshipId}`;
    startProcessing(key);
    try {
      await removeFriendUseCase.execute(friendshipId);
      customToast.success(t('success.removed'));
      await recargarTrasLaAccion();
    } catch (error) {
      registraElFallo(
        'FriendsPage.error-removing-friendship',
        'Error removing friendship:',
        error,
      );
      customToast.error(mensajeDelError(error, t('errors.failedToRemove')));
    } finally {
      stopProcessing(key);
    }
  };

  const handleBlock = async (otherUserId) => {
    if (!otherUserId) return;
    const key = `user:${otherUserId}`;
    startProcessing(key);
    try {
      await blockUserUseCase.execute(otherUserId);
      customToast.success(t('success.blocked'));
      await recargarTrasLaAccion();
    } catch (error) {
      registraElFallo(
        'FriendsPage.error-blocking-user',
        'Error blocking user:',
        error,
      );
      customToast.error(mensajeDelError(error, t('errors.failedToBlock')));
    } finally {
      stopProcessing(key);
    }
  };

  const handleSearchUsers = async (query) => {
    return searchUsersUseCase.execute(query);
  };

  const isPageLoading = isLoadingUser || isLoading;

  if (isPageLoading) {
    // La cabecera se queda puesta durante la espera: aparecer de golpe al
    // terminar es un salto, y de eso va justamente FE #495
    return (
      <div
        className={`${PANTALLA_MENOS_BARRA_INFERIOR} bg-fondo ${marcaDeAgua('guante')}`}
      >
        <HeaderAuth user={user} />
        <BlockLoader texto={t('loading')} />
      </div>
    );
  }

  const listByTab = { friends, received, sent };
  const currentList = listByTab[activeTab];

  return (
    <div
      className={`${PANTALLA_MENOS_BARRA_INFERIOR} bg-fondo ${marcaDeAgua(currentList.length === 0 ? null : 'guante')}`}
    >
      <HeaderAuth user={user} />

      <AddFriendModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSearchUsers={handleSearchUsers}
        t={t}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* La vuelta al feed va visible tambien en movil, al reves que el resto
            de la aplicacion: a Amigos se entra desde el feed, y en movil la
            navegacion inferior marca la pestana del feed como activa mientras
            estas aqui, asi que sin este enlace no hay ninguna senal de por
            donde se vuelve */}
        <Link
          to="/feed"
          data-testid="friends-back-to-feed"
          className="inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-tinta mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToFeed')}
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="hidden md:block text-2xl font-bold text-tinta">
              {t('title')}
            </h1>
            <p className="text-sm text-tinta-suave mt-1">{t('subtitle')}</p>
          </div>
          <button
            data-testid="add-friend-button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sobre-contraste bg-contraste rounded-boton transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            {t('add.button')}
          </button>
        </div>

        {/* Tabs: las tres comparten la lista de abajo, que es su panel */}
        <GrupoDePestanas actual={activeTab} onElegir={setActiveTab} panelUnico>
          <ListaDePestanas
            etiqueta={t('tabsLabel')}
            className={`${CLASE_DE_LA_LISTA_DE_PESTANAS} mb-4`}
            data-testid="friend-tabs"
            pestanas={TABS.map((tab) => ({
              id: tab,
              testId: `tab-${tab}`,
              contenido: (
                <>
                  {/* Si no cabe en una línea, el número baja debajo del
                      nombre, que no se parte: las tres con su número caben
                      a 320 px (FE #1224) */}
                  <span className="whitespace-nowrap">{t(`tabs.${tab}`)}</span>
                  {listByTab[tab].length > 0 && (
                    <span className="inline-flex shrink-0 items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-medium border border-current">
                      {listByTab[tab].length}
                    </span>
                  )}
                </>
              ),
            }))}
            claseDePestana={(abierta) =>
              `flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2 py-2.5 sm:flex-none sm:gap-2 sm:px-4 ${claseDePestana(abierta)}`
            }
          />

          {/* List */}
          {/* Vacía no hay nada enfocable dentro: entonces el panel sí es parada */}
          <PanelDePestana enfocable={currentList.length === 0}>
            {currentList.length === 0 ? (
              <div className="text-center py-12">
                {/* Vacía: su dibujo, y la página sin marca de agua (27 nov 2026) */}
                <DibujoDeMarca
                  nombre="carrito"
                  className="mx-auto mb-3 h-32 w-32 text-tinta"
                />
                <p className="text-tinta-suave">{t(`empty.${activeTab}`)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map((friendship) => (
                  <FriendCard
                    key={friendship.id}
                    friendship={friendship}
                    mode={
                      activeTab === 'friends'
                        ? 'friend'
                        : activeTab === 'received'
                          ? 'received'
                          : 'sent'
                    }
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onRemove={handleRemoveOrCancel}
                    onCancel={handleRemoveOrCancel}
                    onBlock={handleBlock}
                    isProcessing={
                      processingKeys.has(`friendship:${friendship.id}`) ||
                      processingKeys.has(`user:${friendship.otherUserId}`)
                    }
                    t={t}
                  />
                ))}
              </div>
            )}
          </PanelDePestana>
        </GrupoDePestanas>
      </div>
    </div>
  );
};

export default FriendsPage;
