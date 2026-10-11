import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Plus,
  Loader2,
  ArrowLeft,
  Send,
  Search,
  Hammer,
  Swords,
  ShoppingBag,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useForumStore } from '../store/useForumStore';
import { Avatar } from '../components/ui/Avatar';
import { RankBadge } from '../components/forum/RankBadge';
import { CreateThreadModal } from '../components/forum/CreateThreadModal';
import { formatRelativeTime, formatFullDate } from '../lib/time';
import type { ForumThreadPreview, ForumAuthor } from '../lib/api';

type TabId = 'all' | 'new' | 'popular' | 'unanswered' | 'mine';

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'popular', label: 'Популярные' },
  { id: 'unanswered', label: 'Без ответа' },
  { id: 'mine', label: 'Мои' },
];

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  general: MessageSquare,
  guides: Hammer,
  help: Swords,
  trade: ShoppingBag,
  'off-topic': Sparkles,
};

const CATEGORY_GROUPS: { title: string; slugs: string[] }[] = [
  { title: 'Вести', slugs: [] },
  { title: 'Игра', slugs: ['guides', 'help', 'trade'] },
  { title: 'Сообщество', slugs: ['general', 'off-topic'] },
];

export function ForumScreen() {
  const categories = useForumStore((s) => s.categories);
  const threads = useForumStore((s) => s.threads);
  const activeCategory = useForumStore((s) => s.activeCategory);
  const activeThread = useForumStore((s) => s.activeThread);
  const stats = useForumStore((s) => s.stats);
  const topAuthors = useForumStore((s) => s.topAuthors);
  const loadingThreads = useForumStore((s) => s.loadingThreads);
  const loadCategories = useForumStore((s) => s.loadCategories);
  const loadThreads = useForumStore((s) => s.loadThreads);
  const loadStats = useForumStore((s) => s.loadStats);
  const loadTopAuthors = useForumStore((s) => s.loadTopAuthors);
  const setActiveCategory = useForumStore((s) => s.setActiveCategory);
  const openThread = useForumStore((s) => s.openThread);
  const closeThread = useForumStore((s) => s.closeThread);

  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    void loadCategories();
    void loadThreads();
    void loadStats();
    void loadTopAuthors();
  }, [loadCategories, loadThreads, loadStats, loadTopAuthors]);

  const filtered = useMemo(() => {
    let list = threads.slice();
    if (tab === 'popular') list.sort((a, b) => (b.reply_count + b.views) - (a.reply_count + a.views));
    if (tab === 'unanswered') list = list.filter((t) => t.reply_count === 0);
    if (tab === 'new') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.body_preview.toLowerCase().includes(q));
    }
    return list;
  }, [threads, tab, query]);

  // ВАЖНО: ранний return ТОЛЬКО после всех хуков
  if (activeThread) {
    return <ThreadView onBack={closeThread} />;
  }

  return (
    <div className="h-full flex flex-col bg-abyss/60 backdrop-blur-sm">
      {/* ==== HERO ==== */}
      <div className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-transparent to-blizzard/[0.04] pointer-events-none" />
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-mono text-[140px] leading-none text-gold/[0.04] pointer-events-none select-none">
          ᚠ
        </span>

        <div className="relative px-8 pt-7 pb-5">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 ring-1 ring-gold/25 flex items-center justify-center text-gold">
                <span className="font-mono text-2xl leading-none">ᚠ</span>
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white leading-none">
                  Тинг
                </h1>
                <p className="text-[12px] text-slate-500 mt-1.5">
                  Народное собрание Вальхейма
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_6px_#2fbf71]" />
                <span className="font-mono font-bold text-[12px]">{stats?.online ?? 0}</span>
                <span className="text-slate-500">онлайн</span>
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-slate-500">
                <span className="font-mono text-slate-300">{stats?.users ?? 0}</span> игроков
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==== TABS + SEARCH ==== */}
      <div className="px-8 py-3 border-b border-white/[0.04] flex items-center gap-3 bg-abyss/40">
        <div className="flex items-center gap-0.5">
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-gold rounded-t" />
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto relative w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по Тингу..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.1em] hover:shadow-glow-gold transition-all shrink-0"
        >
          <Plus size={14} />
          Создать
        </button>
      </div>

      {/* ==== 3-КОЛОНОЧНЫЙ LAYOUT ==== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-0 min-h-0">
        {/* Левая колонка — категории */}
        <aside className="border-r border-white/[0.04] overflow-y-auto no-scrollbar py-5 px-3">
          {CATEGORY_GROUPS.map((group) => {
            const groupCats = categories.filter((c) => group.slugs.includes(c.slug));
            if (groupCats.length === 0) return null;
            return (
              <div key={group.title} className="mb-5 last:mb-0">
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-600 px-2.5 mb-2">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {groupCats.map((cat) => (
                    <CategoryBtn
                      key={cat.slug}
                      active={activeCategory === cat.slug}
                      onClick={() => void setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                      icon={CATEGORY_ICONS[cat.slug] ?? MessageSquare}
                      title={cat.title}
                      count={cat.thread_count}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {activeCategory && (
            <button
              type="button"
              onClick={() => void setActiveCategory(null)}
              className="w-full px-2.5 py-2 text-[11px] text-slate-500 hover:text-gold transition-colors text-left font-semibold"
            >
              ← Показать все
            </button>
          )}
        </aside>

        {/* Центр — треды */}
        <div className="overflow-y-auto no-scrollbar p-5 space-y-2.5">
          {loadingThreads && (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-16 text-[11px] uppercase tracking-[0.16em] font-bold">
              <Loader2 size={14} className="animate-spin" />
              Загрузка
            </div>
          )}
          {!loadingThreads && filtered.length === 0 && (
            <EmptyThreads onCreate={() => setCreateOpen(true)} hasFilter={!!query || tab !== 'all' || !!activeCategory} />
          )}
          {!loadingThreads && filtered.map((t) => (
            <ThreadCard key={t.id} thread={t} onOpen={() => void openThread(t.id)} />
          ))}
        </div>

        {/* Правая колонка */}
        <aside className="border-l border-white/[0.04] overflow-y-auto no-scrollbar p-4 space-y-3">
          <TopAuthors authors={topAuthors} />
          <StatsBlock stats={stats} />
          <DiscordBlock />
        </aside>
      </div>

      <CreateThreadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void loadThreads();
          void loadCategories();
          void loadStats();
          void loadTopAuthors();
        }}
      />
    </div>
  );
}

/* ============================================================
   КОМПОНЕНТЫ
   ============================================================ */

function CategoryBtn({
  active, onClick, icon: Icon, title, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MessageSquare;
  title: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
        active
          ? 'bg-gold/[0.08] text-gold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
      }`}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold rounded-r" />}
      <Icon size={14} className="shrink-0" />
      <span className="text-[12px] font-semibold truncate flex-1">{title}</span>
      {count > 0 && (
        <span className={`text-[10px] font-mono shrink-0 ${active ? 'text-gold' : 'text-slate-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ThreadCard({ thread, onOpen }: { thread: ForumThreadPreview; onOpen: () => void }) {
  const author = thread.author as ForumAuthor;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left glass rounded-2xl p-4 hover:bg-white/[0.03] hover:border-gold/20 border border-transparent transition-all group"
    >
      <div className="flex items-start gap-3">
        <Avatar size={40} avatarUrl={author.avatar_url ?? null} friendId={`u${author.user_id}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-300">@{author.username}</span>
            {author.rank && <RankBadge rank={author.rank} />}
            {thread.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                <Pin size={10} /> Закреп
              </span>
            )}
            {thread.locked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blood">
                <Lock size={10} /> Закрыт
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-600">
              {formatRelativeTime(thread.updated_at)}
            </span>
          </div>

          <div className="text-[15px] font-bold text-white leading-snug mt-1.5 group-hover:text-gold transition-colors">
            {thread.title}
          </div>
          <div className="text-[12px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {thread.body_preview}
          </div>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.06]"
              >
                #{tag}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {thread.reply_count}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {thread.views}
              </span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyThreads({ onCreate, hasFilter }: { onCreate: () => void; hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <div className="glass rounded-2xl py-12 text-center">
        <Search size={24} className="mx-auto text-slate-700 mb-3" />
        <p className="text-[13px] text-slate-400 font-semibold">Ничего не найдено</p>
        <p className="text-[11px] text-slate-600 mt-1">Попробуй изменить фильтры</p>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl py-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/[0.06] ring-1 ring-gold/15 flex items-center justify-center text-gold/50 mb-4">
        <MessageSquare size={22} />
      </div>
      <p className="text-[14px] text-slate-300 font-bold">Тредов пока нет</p>
      <p className="text-[11px] text-slate-600 mt-1">Стань первым, кто начнёт обсуждение</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.1em] hover:shadow-glow-gold transition-all"
      >
        <Plus size={13} />
        Создать тему
      </button>
    </div>
  );
}

function TopAuthors({ authors }: { authors: import('../lib/api').ForumTopAuthor[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-3">
        Топ авторов
      </div>
      {authors.length === 0 ? (
        <p className="text-[11px] text-slate-600 py-1">Пока пусто</p>
      ) : (
        <div className="space-y-2">
          {authors.map((a, i) => (
            <div key={a.user_id} className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-600 w-3 shrink-0">
                {i + 1}
              </span>
              <span className="text-[12px] font-bold text-slate-300 truncate flex-1 min-w-0">
                @{a.username}
              </span>
              <RankBadge rank={a.rank} />
              <span className="text-[11px] font-mono text-gold shrink-0 w-7 text-right">
                {a.reputation}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsBlock({ stats }: { stats: import('../lib/api').ForumStats | null }) {
  const rows = [
    { label: 'Тем', value: stats?.threads ?? 0 },
    { label: 'Постов', value: stats?.posts ?? 0 },
    { label: 'Игроков', value: stats?.users ?? 0 },
    { label: 'Онлайн', value: stats?.online ?? 0, accent: true },
  ];
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-3">
        Статистика
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">{r.label}</span>
            <span
              className={`text-[12px] font-mono font-bold ${
                r.accent ? 'text-emerald' : 'text-slate-300'
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscordBlock() {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-blizzard mb-2">
        Discord
      </div>
      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
        Быстрое общение с игроками
      </p>
      <a
        href="https://discord.gg/valheim-rouge"
        target="_blank"
        rel="noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-blizzard/30 text-blizzard hover:bg-blizzard/10 font-bold text-[11px] uppercase tracking-[0.1em] transition-all"
      >
        Присоединиться
      </a>
    </div>
  );
}

/* ============================================================
   ПРОСМОТР ТРЕДА
   ============================================================ */

function ThreadView({ onBack }: { onBack: () => void }) {
  const activeThread = useForumStore((s) => s.activeThread);
  const createPost = useForumStore((s) => s.createPost);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  if (!activeThread) return null;
  const author = activeThread.author as ForumAuthor;

  const handleReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setBusy(true);
    try {
      await createPost(activeThread.id, text);
      setReply('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-abyss/60 backdrop-blur-sm">
      <div className="px-8 py-4 border-b border-white/[0.05] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-[11px] uppercase tracking-[0.1em] font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Назад
        </button>
        <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-600">
          {activeThread.category.title}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <div className="glass rounded-2xl p-5 mb-3">
            <div className="flex items-start gap-3.5">
              <Avatar size={48} avatarUrl={author.avatar_url ?? null} friendId={`u${author.user_id}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-white">@{author.username}</span>
                  {author.rank && <RankBadge rank={author.rank} size="md" />}
                  <span className="text-[11px] text-slate-600">
                    {formatFullDate(activeThread.created_at)}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
                    <Eye size={11} />
                    {activeThread.views}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-white mt-2 leading-tight">
                  {activeThread.title}
                </h2>
                <div className="text-[13px] text-slate-300 leading-relaxed mt-3 whitespace-pre-wrap">
                  {activeThread.body}
                </div>
                {activeThread.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {activeThread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeThread.posts.length > 0 && (
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-600">
                Ответы · {activeThread.posts.length}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
          )}

          <div className="space-y-2.5">
            {activeThread.posts.map((post) => (
              <div key={post.id} className="glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Avatar size={36} avatarUrl={post.author.avatar_url ?? null} friendId={`u${post.author.user_id}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-white">@{post.author.username}</span>
                      {post.author.rank && <RankBadge rank={post.author.rank} />}
                      <span className="text-[11px] text-slate-600">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                    <div className="text-[13px] text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap">
                      {post.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!activeThread.locked ? (
            <div className="glass rounded-2xl p-4 mt-4">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={5000}
                rows={3}
                disabled={busy}
                placeholder="Написать ответ..."
                className="w-full bg-transparent text-[13px] text-white placeholder-slate-600 outline-none resize-none disabled:opacity-50"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-slate-600">
                  {reply.length} / 5000
                </span>
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={busy || reply.trim().length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.1em] hover:shadow-glow-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Ответить
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-4 mt-4 text-center text-[11px] uppercase tracking-[0.16em] font-bold text-slate-500 flex items-center justify-center gap-2">
              <Lock size={12} />
              Тред закрыт
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
