import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FloatingTopBar, type ConnectionState } from '../components/layout/FloatingTopBar';
import { IconRail, type TabId } from '../components/layout/IconRail';
import { CornerWidgets } from '../components/layout/CornerWidgets';
import { FloatingStatusBar } from '../components/layout/FloatingStatusBar';
import { HeroSection } from '../components/hero/HeroSection';
import { NewsGrid } from '../components/news/NewsGrid';
import { NewsDetailModal } from '../components/news/NewsDetailModal';
import { FriendContextMenu, type ContextMenuState } from '../components/friends/FriendContextMenu';
import { AddFriendModal } from '../components/friends/AddFriendModal';
import { ChatPanel } from '../components/chat/ChatPanel';
import { RightPanel } from '../components/rightpanel/RightPanel';
import { FriendsRail } from '../components/layout/FriendsRail';
import { Onboarding } from '../components/onboarding/Onboarding';
import { ProfileScreen } from './ProfileScreen';
import { ChangelogScreen } from './ChangelogScreen';
import { ForumScreen } from './ForumScreen';
import { EventsScreen } from './EventsScreen';
import { ModsScreen } from './ModsScreen';
import { useLauncherStore } from '../store/useLauncherStore';
import { useFriendsStore } from '../store/useFriendsStore';
import { useChatStore } from '../store/useChatStore';
import { toast } from '../store/useToastStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useProfileViewStore } from '../store/useProfileViewStore';
import { useLauncherUpdateStore } from '../store/useLauncherUpdateStore';
import { useAppSettingsStore } from '../store/useAppSettingsStore';
import type { NewsItem } from '../data/news';

interface Props {
  connection: ConnectionState;
  onConnectionChange: (status: ConnectionState) => void;
}

const REFRESH_MS = 15000;

export function HomeScreen({ connection, onConnectionChange }: Props) {
  const config = useLauncherStore((s) => s.config);
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [openNews, setOpenNews] = useState<NewsItem | null>(null);
  const timerRef = useRef<number | null>(null);
  const removeFriend = useFriendsStore((s) => s.removeFriend);

  const openDmWith = useChatStore((s) => s.openDmWith);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const profileOpen = useProfileViewStore((s) => s.open);
  const profileUserId = useProfileViewStore((s) => s.userId);
  const closeProfile = useProfileViewStore((s) => s.close);
  const openProfile = useProfileViewStore((s) => s.openProfile);
  const startOnboarding = useOnboardingStore((s) => s.start);
  const checkLauncherUpdate = useLauncherUpdateStore((s) => s.check);
  const checkUpdatesOnStart = useAppSettingsStore((s) => s.checkUpdatesOnStart);

  // Автозапуск онбординга при первом входе
  useEffect(() => {
    if (!onboardingCompleted) {
      const t = window.setTimeout(() => startOnboarding(), 800);
      return () => window.clearTimeout(t);
    }
  }, [onboardingCompleted, startOnboarding]);

  // Проверка обновления лаунчера при старте
  useEffect(() => {
    if (!checkUpdatesOnStart) return;
    void checkLauncherUpdate();
  }, [checkLauncherUpdate, checkUpdatesOnStart]);

  const check = useCallback(async () => {
    try {
      const result = await invoke<string>('ping_server', { address: config.server_address });
      if (result === 'online' || result === 'active' || result === 'offline') {
        onConnectionChange(result);
      } else {
        onConnectionChange('offline');
      }
    } catch {
      onConnectionChange('offline');
    }
  }, [config.server_address, onConnectionChange]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  const handleRailContextAction = (
    action: 'play' | 'chat' | 'remove',
    friendId: string
  ) => {
    const friend = useFriendsStore.getState().friends.find((f) => f.id === friendId);
    if (!friend) {
      setContextMenu(null);
      return;
    }

    if (action === 'play') {
      toast.success(`Приглашение отправлено ${friend.name}`);
    } else if (action === 'chat') {
      openDmWith(friend.userId, friend.name);
    } else if (action === 'remove') {
      removeFriend(friend.userId);
      toast.info(`${friend.name} удалён из друзей`);
    }
    setContextMenu(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'url(/assets/svg/pattern-noise.svg)',
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'url(/assets/svg/pattern-grid.svg)',
          backgroundSize: '40px 40px',
        }}
      />

      <FloatingTopBar connection={connection} />
      <IconRail activeTab={activeTab} onChange={setActiveTab} />
      <CornerWidgets />

      <div className={`relative z-10 h-full ${activeTab === 'forum' ? 'overflow-hidden' : 'overflow-y-auto vr-scroll'}`}>
        <div className={activeTab === 'forum' ? 'float-center-wide h-full pt-24 pb-24 flex flex-col' : 'float-center pt-28 pb-32'}>
          {activeTab === 'news' && (
            <div className="flex flex-col gap-6">
              <HeroSection />
              <NewsGrid onOpenNews={setOpenNews} />
            </div>
          )}
          {activeTab === 'events' && <EventsScreen />}
          {activeTab === 'mods' && <ModsScreen />}
          {activeTab === 'forum' && <ForumScreen />}
          {activeTab === 'changelog' && <ChangelogScreen />}
          {activeTab === 'account' && <ProfileScreen userId={null} />}
        </div>
      </div>

      <RightPanel onOpenFriendProfile={(userId) => openProfile(userId)} />

      <FriendsRail
        onOpenProfile={(userId) => openProfile(userId)}
        onOpenContextMenu={setContextMenu}
        onOpenAddFriend={() => setAddFriendOpen(true)}
      />
      {profileOpen && (
        <ProfileScreen userId={profileUserId} onClose={closeProfile} />
      )}
      <FloatingStatusBar />

      <ChatPanel />
      <FriendContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onAction={handleRailContextAction}
      />
      <AddFriendModal open={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
      <NewsDetailModal item={openNews} onClose={() => setOpenNews(null)} />

      <Onboarding />
    </div>
  );
}
