import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useReports } from '@/hooks/useReports';
import { usePoolLeaderboard, useChallengeHistory, usePiecesHistory, useTournamentHistory } from '@/hooks/usePoolTables';
import { useOrdersHistory } from '@/hooks/useOrders';
import { StatCard } from '@/components/pos/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  ShoppingBag,
  Circle,
  TrendingUp,
  Coffee,
  Clock,
  Trophy,
  History,
  Medal,
  Award,
  Search,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

const ChallengeHistory = () => {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useChallengeHistory({
    page,
    limit: 10,
    search,
    startDate,
    endDate,
  });

  const sessions = data?.sessions || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Search Players', 'Rechercher Joueurs', 'البحث عن لاعبين')}
            </Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search name...', 'Rechercher nom...', 'البحث عن اسم...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Start Date', 'Date Début', 'تاريخ البدء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('End Date', 'Date Fin', 'تاريخ الانتهاء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">{t('Date', 'Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Players', 'Joueurs', 'اللاعبون')}</TableHead>
              <TableHead className="text-center">{t('Score', 'Score', 'النتيجة')}</TableHead>
              <TableHead>{t('Winner', 'Gagnant', 'الفائز')}</TableHead>
              <TableHead className="text-end">{t('Revenue', 'Revenu', 'الإيرادات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  {t('No history found', 'Aucun historique trouvé', 'لم يتم العثور على سجل')}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s: any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">
                    {new Date(s.startedAt).toLocaleDateString()}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className={cn(Number(s.challenge?.winnerId) === 1 ? "font-bold text-primary" : "text-foreground/70")}>
                        {s.challenge?.player1Name}
                      </span>
                      <span className={cn(Number(s.challenge?.winnerId) === 2 ? "font-bold text-primary" : "text-foreground/70")}>
                        {s.challenge?.player2Name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {s.challenge?.player1Score} - {s.challenge?.player2Score}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {s.challenge?.winnerName || '-'}
                  </TableCell>
                  <TableCell className="text-end font-semibold text-primary">
                    {s.totalCost.toFixed(2)} DH
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
          >
            {t('Previous', 'Précédent', 'السابق')}
          </Button>
          <span className="text-sm font-medium bg-muted px-4 py-1.5 rounded-full">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
          >
            {t('Next', 'Suivant', 'التالي')}
          </Button>
        </div>
      )}
    </div>
  );
};

const TournamentHistory = () => {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useTournamentHistory({
    page,
    limit: 10,
    search,
    startDate,
    endDate,
  });

  const sessions = data?.sessions || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Search Players', 'Rechercher Joueurs', 'البحث عن لاعبين')}
            </Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search name...', 'Rechercher nom...', 'البحث عن اسم...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Start Date', 'Date Début', 'تاريخ البدء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('End Date', 'Date Fin', 'تاريخ الانتهاء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">{t('Date', 'Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Tournament / Players', 'Tournoi / Joueurs', 'البطولة / اللاعبون')}</TableHead>
              <TableHead className="text-center">{t('Score', 'Score', 'النتيجة')}</TableHead>
              <TableHead>{t('Winner', 'Gagnant', 'الفائز')}</TableHead>
              <TableHead className="text-end">{t('Revenue', 'Revenu', 'الإيرادات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  {t('No history found', 'Aucun historique trouvé', 'لم يتم العثور على سجل')}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s: any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">
                    {new Date(s.startedAt).toLocaleDateString()}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-primary font-semibold text-xs mb-1">
                        {s.tournamentId?.name || t('Pool Tournament', 'Tournoi de Billard', 'بطولة البلياردو')}
                      </span>
                      <div className="flex flex-col opacity-80">
                        <span className={cn(Number(s.challenge?.winnerId) === 1 ? "font-bold" : "")}>
                          {s.challenge?.player1Name}
                        </span>
                        <span className={cn(Number(s.challenge?.winnerId) === 2 ? "font-bold" : "")}>
                          {s.challenge?.player2Name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {s.challenge?.player1Score} - {s.challenge?.player2Score}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {s.challenge?.winnerName || '-'}
                  </TableCell>
                  <TableCell className="text-end font-semibold text-primary">
                    {s.totalCost.toFixed(2)} DH
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
          >
            {t('Previous', 'Précédent', 'السابق')}
          </Button>
          <span className="text-sm font-medium bg-muted px-4 py-1.5 rounded-full">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
          >
            {t('Next', 'Suivant', 'التالي')}
          </Button>
        </div>
      )}
    </div>
  );
};

const PiecesHistory = () => {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = usePiecesHistory({
    page,
    limit: 10,
    search,
    startDate,
    endDate,
  });

  const sessions = data?.sessions || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Search Players', 'Rechercher Joueurs', 'البحث عن لاعبين')}
            </Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search name...', 'Rechercher nom...', 'البحث عن اسم...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Start Date', 'Date Début', 'تاريخ البدء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="ps-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('End Date', 'Date Fin', 'تاريخ الانتهاء')}
            </Label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">{t('Date', 'Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Player', 'Joueur', 'اللاعب')}</TableHead>
              <TableHead className="text-center">{t('Pieces', 'Pièces', 'قطع')}</TableHead>
              <TableHead className="text-end">{t('Revenue', 'Revenu', 'الإيرادات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  {t('No history found', 'Aucun historique trouvé', 'لم يتم العثور على سجل')}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s: any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">
                    {new Date(s.startedAt).toLocaleDateString()}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {s.pieces?.[0]?.playerName || '-'}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {s.pieces?.reduce((sum: number, p: any) => sum + p.count, 0) || 0}
                  </TableCell>
                  <TableCell className="text-end font-semibold text-primary">
                    {s.totalCost.toFixed(2)} DH
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
          >
            {t('Previous', 'Précédent', 'السابق')}
          </Button>
          <span className="text-sm font-medium bg-muted px-4 py-1.5 rounded-full">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
          >
            {t('Next', 'Suivant', 'التالي')}
          </Button>
        </div>
      )}
    </div>
  );
};

const LeaderboardSection = () => {
  const { t } = useApp();
  const { data: poolPlayers = [], isLoading } = usePoolLeaderboard(10);
  const sortedPlayers = [...poolPlayers].sort((a, b) => b.wins - a.wins);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden w-full">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          {t('Top Players', 'Meilleurs Joueurs', 'أفضل اللاعبين')}
        </h3>
      </div>
      <div className="grid grid-cols-[50px_1fr_80px_80px] gap-4 px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/10 border-b">
        <div className="text-center">{t('Rank', 'Rang', 'الرتبة')}</div>
        <div>{t('Player', 'Joueur', 'اللاعب')}</div>
        <div className="text-center">{t('Wins', 'Vics', 'الانتصارات')}</div>
        <div className="text-center">{t('Rate', 'Taux', 'المعدل')}</div>
      </div>
      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground italic text-sm">
          {t('No data available', 'Aucune donnée disponible', 'لا توجد بيانات متاحة')}
        </div>
      ) : (
        <div className="divide-y">
          {sortedPlayers.map((player, index) => {
            const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;
            return (
              <div key={player.id} className="grid grid-cols-[50px_1fr_80px_80px] gap-4 px-6 py-3 items-center hover:bg-muted/30 transition-colors">
                <div className="flex justify-center">{getRankIcon(index + 1)}</div>
                <div className="font-medium truncate">{player.name}</div>
                <div className="text-center font-bold text-primary">{player.wins}</div>
                <div className="text-center text-xs font-semibold text-muted-foreground">{winRate}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OrdersHistory = ({ range }: { range: 'daily' | 'weekly' | 'monthly' }) => {
  const { t, currentUser } = useApp();
  const [page, setPage] = useState(1);

  // Calculate date ranges
  const getDateRange = (filterRange: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const endDate = new Date(now.setHours(23, 59, 59, 999));
    let startDate = new Date();

    switch (filterRange) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  const dateRange = getDateRange(range);
  // If role is waiter, only show their own orders. If admin, show all (waiterId undefined).
  const waiterId = currentUser?.role === 'waiter' ? currentUser?.id : undefined;

  const { data, isLoading } = useOrdersHistory({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    waiterId,
    page,
    limit: 10
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-4">

      {/* Orders Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">{t('Order #', 'Commande #', 'طلب #')}</TableHead>
              <TableHead className="w-[180px]">{t('Date', 'Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Waiter', 'Serveur', 'النادل')}</TableHead>
              <TableHead>{t('Table', 'Table', 'الطاولة')}</TableHead>
              <TableHead className="text-center">{t('Status', 'Statut', 'الحالة')}</TableHead>
              <TableHead className="text-end">{t('Total', 'Total', 'الإجمالي')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  {t('No orders found', 'Aucune commande trouvée', 'لم يتم العثور على طلبات')}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: Order) => (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    #{order.orderNumber || order.id.slice(-6)}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell>{order.waiterName}</TableCell>
                  <TableCell>
                    {(order.tableId as any)?.number ?? '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      order.status === 'paid' && "bg-green-100 text-green-800",
                      order.status === 'served' && "bg-blue-100 text-blue-800",
                      order.status === 'ready' && "bg-orange-100 text-orange-800",
                      order.status === 'preparing' && "bg-yellow-100 text-yellow-800",
                      order.status === 'new' && "bg-gray-100 text-gray-800"
                    )}>
                      {t(order.status, order.status, order.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end font-semibold text-primary">
                    {order.total.toFixed(2)} DH
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
          >
            {t('Previous', 'Précédent', 'السابق')}
          </Button>
          <span className="text-sm font-medium bg-muted px-4 py-1.5 rounded-full">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
          >
            {t('Next', 'Suivant', 'التالي')}
          </Button>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const { t } = useApp();
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  // Calculate date ranges for API
  const getDateRange = (filterRange: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const endDate = new Date(now.setHours(23, 59, 59, 999));
    let startDate = new Date();

    switch (filterRange) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  const dateParams = getDateRange(range);
  const { data: reportData, isLoading: loadingReports } = useReports(range, dateParams.startDate, dateParams.endDate);

  const stats = reportData?.stats;
  const popularProducts = reportData?.popularProducts || [];
  const { currentUser } = useApp();
  const role = currentUser?.role;

  const renderStats = () => {
    if (loadingReports || !stats) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      );
    }

    const showCafe = role === 'admin' || role === 'waiter';
    const showPool = role === 'admin' || role === 'pool_manager';

    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('Total Revenue', 'Revenu Total', 'إجمالي الإيرادات')}
            value={`${stats.totalRevenue.toFixed(2)} DH`}
            icon={DollarSign}
            variant="primary"
          />
          {showCafe && (
            <StatCard
              title={t('Café Revenue', 'Revenu Café', 'إيرادات المقهى')}
              value={`${stats.cafe.revenue.toFixed(2)} DH`}
              icon={Coffee}
              variant="default"
            />
          )}
          {showPool && (
            <StatCard
              title={t('Pool Revenue', 'Revenu Billard', 'إيرادات البلياردو')}
              value={`${stats.pool.revenue.toFixed(2)} DH`}
              icon={Circle}
              variant="default"
            />
          )}
          {showCafe && (
            <StatCard
              title={t('Avg Order', 'Commande Moy.', 'متوسط الطلب')}
              value={`${stats.cafe.avgOrderValue.toFixed(2)} DH`}
              icon={TrendingUp}
              variant="default"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showCafe && (
            <StatCard
              title={t('Orders Count', 'Nombre de Commandes', 'عدد الطلبات')}
              value={stats.cafe.orderCount}
              icon={ShoppingBag}
              variant="default"
            />
          )}
          {showPool && (
            <StatCard
              title={t('Pool Sessions', 'Sessions Billard', 'جلسات البلياردو')}
              value={stats.pool.sessionCount}
              subtitle={t(
                `${stats.pool.metrics.piecesCount} pieces, ${stats.pool.metrics.challengeCount} challenges`,
                `${stats.pool.metrics.piecesCount} pièces, ${stats.pool.metrics.challengeCount} défis`,
                `${stats.pool.metrics.piecesCount} قطعة، ${stats.pool.metrics.challengeCount} تحدي`
              )}
              icon={Clock}
              variant="default"
            />
          )}
          {showPool && (
            <StatCard
              title={t('Avg Pool Session', 'Session Billard Moy.', 'متوسط جلسة البلياردو')}
              value={`${stats.pool.avgSessionValue.toFixed(2)} DH`}
              icon={TrendingUp}
              variant="default"
            />
          )}
        </div>
      </div>
    );
  };

  const showPoolSection = role === 'admin' || role === 'pool_manager';

  return (
    <div className="space-y-10 pb-10">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('Reports & Statistics', 'Rapports et Statistiques', 'التقارير والإحصائيات')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {range === 'daily' && t("Today's performance overview", "Aperçu des performances du jour", "نظرة عامة على أداء اليوم")}
            {range === 'weekly' && t("This week's performance overview", "Aperçu des performances de la semaine", "نظرة عامة على أداء هذا الأسبوع")}
            {range === 'monthly' && t("This month's performance overview", "Aperçu des performances du mois", "نظرة عامة على أداء هذا الشهر")}
          </p>
        </div>

        <div className="flex p-1 bg-muted rounded-lg w-fit shadow-inner">
          <Button
            variant={range === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRange('daily')}
            className="rounded-md"
          >
            {t('Daily', 'Quotidien', 'يومي')}
          </Button>
          <Button
            variant={range === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRange('weekly')}
            className="rounded-md"
          >
            {t('Weekly', 'Hebdo', 'أسبوعي')}
          </Button>
          <Button
            variant={range === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRange('monthly')}
            className="rounded-md"
          >
            {t('Monthly', 'Mensuel', 'شهري')}
          </Button>
        </div>
      </div>

      {/* Main Stats Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t('Overview', 'Aperçu', 'نظرة عامة')}
        </h2>
        {renderStats()}
      </section>

      <div className="grid grid-cols-1 gap-8">

        {/* Orders History Section */}
        {(role === 'admin' || role === 'waiter') && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t('Orders History', 'Historique des Commandes', 'سجل الطلبات')}
            </h2>
            <OrdersHistory range={range} />
          </section>
        )}

        {/* Pool History - Full Width */}
        {showPoolSection && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {t('Pool History', 'Historique Billard', 'سجل البلياردو')}
            </h2>
            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="bg-muted p-1">
                <TabsTrigger value="challenges" className="px-6 py-2">
                  {t('Challenges', 'Défis', 'التحديات')}
                </TabsTrigger>
                <TabsTrigger value="pieces" className="px-6 py-2">
                  {t('Pieces', 'Pièces', 'القطع')}
                </TabsTrigger>
                <TabsTrigger value="tournaments" className="px-6 py-2">
                  {t('Tournaments', 'Tournois', 'البطولات')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="challenges" className="mt-4 animate-in fade-in duration-300">
                <ChallengeHistory />
              </TabsContent>
              <TabsContent value="pieces" className="mt-4 animate-in fade-in duration-300">
                <PiecesHistory />
              </TabsContent>
              <TabsContent value="tournaments" className="mt-4 animate-in fade-in duration-300">
                <TournamentHistory />
              </TabsContent>
            </Tabs>
          </section>
        )}

        {showPoolSection && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {t('Pool Leaderboard', 'Classement Billard', 'لوحة صدارة البلياردو')}
            </h2>
            <LeaderboardSection />
          </section>
        )}
      </div>


    </div>
  );
};

export default Reports;
