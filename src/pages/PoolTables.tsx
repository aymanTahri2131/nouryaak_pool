import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  usePoolTables,
  useStartPiecesSession,
  useStartChallengeSession,
  useAddPieces,
  useEndPoolSession,
  useUnpaidSessions,
  useMarkAsPaid,
} from '@/hooks/usePoolTables';
import { PoolTableCard } from '@/components/pos/PoolTableCard';
import { UnpaidSessions } from '@/components/pos/UnpaidSessions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PoolSessionType, PoolTable } from '@/types';
import { toast } from 'sonner';
import { Plus, Trophy, Circle, DollarSign, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChallengeResultDialog } from '@/components/pos/ChallengeResultDialog';
import { PlayerSelect } from '@/components/pos/PlayerSelect';
import { TournamentDialog } from '@/components/pos/TournamentDialog';

const PoolTables = () => {
  const { t } = useApp();
  const { data: poolTables = [], isLoading } = usePoolTables();
  const startPiecesMutation = useStartPiecesSession();
  const startChallengeMutation = useStartChallengeSession();
  const addPiecesMutation = useAddPieces();
  const endSessionMutation = useEndPoolSession();
  const { data: unpaidSessions = [], isLoading: isLoadingUnpaid } = useUnpaidSessions();
  const markAsPaidMutation = useMarkAsPaid();

  const [selectedTable, setSelectedTable] = useState<PoolTable | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addPiecesDialogOpen, setAddPiecesDialogOpen] = useState(false);
  const [challengeResultOpen, setChallengeResultOpen] = useState(false);
  const [sessionType, setSessionType] = useState<PoolSessionType>('pieces');

  const [piecesCount, setPiecesCount] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [challengeMode, setChallengeMode] = useState<3 | 5 | 7>(3);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleStartSession = async () => {
    if (!selectedTable) return;

    try {
      if (sessionType === 'pieces') {
        await startPiecesMutation.mutateAsync({
          tableId: selectedTable.id,
          pieces: piecesCount,
          playerName: playerName || undefined,
        });
      } else {
        await startChallengeMutation.mutateAsync({
          tableId: selectedTable.id,
          mode: challengeMode,
          player1Name,
          player2Name,
          pricePerGame: selectedTable.pricePerPiece,
        });
      }
      toast.success(t('Session started!', 'Session démarrée!', 'بدأت الجلسة!'));
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to start session', 'Échec du démarrage', 'فشل بدء الجلسة'));
    }
  };

  const handleAddPieces = async (table: PoolTable) => {
    if (!table.currentSession || table.currentSession.type !== 'pieces') return;

    try {
      await addPiecesMutation.mutateAsync({
        tableId: table.id,
        pieces: piecesCount,
        playerName: playerName || undefined,
      });
      toast.success(t('Pieces added!', 'Pièces ajoutées!', 'تم إضافة القطع!'));
      setAddPiecesDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to add pieces', 'Échec de l\'ajout', 'فشل إضافة القطع'));
    }
  };

  const handleEndSession = async (table: PoolTable) => {
    try {
      if (table.currentSession?.type === 'challenge') {
        setSelectedTable(table);
        setChallengeResultOpen(true);
        return;
      }

      await endSessionMutation.mutateAsync({ tableId: table.id });
      toast.success(t('Session ended!', 'Session terminée!', 'انتهت الجلسة!'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to end session', 'Échec de la fin', 'فشل إنهاء الجلسة'));
    }
  };

  const handleMarkAsPaid = async (sessionId: string) => {
    try {
      await markAsPaidMutation.mutateAsync(sessionId);
      toast.success(t('Session marked as paid!', 'Session marquée comme payée!', 'تم وضع علامة على الجلسة كمدفوعة!'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to mark as paid', 'Échec du paiement', 'فشل وضع علامة كمدفوعة'));
    }
  };

  const resetForm = () => {
    setPiecesCount(1);
    setPlayerName('');
    setPlayer1Name('');
    setPlayer2Name('');
    setChallengeMode(3);
    setSessionType('pieces');
    setSelectedTable(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('Pool Tables', 'Tables de Billard', 'طاولات البلياردو')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('Manage pool table sessions', 'Gérer les sessions de billard', 'إدارة جلسات البلياردو')}
        </p>
      </div>

      <TournamentDialog>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="text-start">
              <h3 className="font-bold">{t('Tournament Mode', 'Mode Tournoi', 'وضع البطولة')}</h3>
              <p className="text-xs text-muted-foreground">{t('Organize and track matches', 'Organiser et suivre les matchs', 'تنظيم ومتابعة المباريات')}</p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Play className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </TournamentDialog>

      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {poolTables.map((table) => (
          <div key={table.id} className="space-y-3 w-full max-w-full overflow-hidden mx-auto sm:mx-0">
            <PoolTableCard table={table} />

            <div className="flex gap-2">
              {table.status === 'available' ? (
                <Dialog
                  open={dialogOpen && selectedTable?.id === table.id}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) setSelectedTable(table);
                    else resetForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex-1 touch-target" variant="default">
                      <Plus className="me-2 h-4 w-4" />
                      {t('Start Session', 'Démarrer', 'بدء')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {t('Start New Session', 'Nouvelle Session', 'بدء لعبة جديدة')} - Pool #{table.number}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      <div className="space-y-3">
                        <Label>{t('Session Type', 'Type de session', 'نوع اللعبة')}</Label>
                        <RadioGroup value={sessionType} onValueChange={(v) => setSessionType(v as PoolSessionType)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pieces" id="pieces" />
                            <Label htmlFor="pieces" className="flex items-center gap-2 cursor-pointer">
                              <Circle className="h-4 w-4" />
                              {t('Pieces Mode', 'Mode Pièces', 'وضع القطع')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="challenge" id="challenge" />
                            <Label htmlFor="challenge" className="flex items-center gap-2 cursor-pointer">
                              <Trophy className="h-4 w-4" />
                              {t('Challenge Mode', 'Mode défi', 'وضع التحدي')}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {sessionType === 'pieces' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="pieces-count">{t('Number of Pieces', 'Nombre de pièces', 'عدد القطع')}</Label>
                            <Input
                              id="pieces-count"
                              type="number"
                              min={1}
                              value={piecesCount}
                              onChange={(e) => setPiecesCount(parseInt(e.target.value) || 1)}
                              className="touch-target"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="player-name">{t('Player Name (optional)', 'Nom du joueur (optionnel)', 'اسم اللاعب (اختياري)')}</Label>
                            <PlayerSelect
                              id="player-name"
                              value={playerName}
                              onChange={setPlayerName}
                              placeholder={t('Enter name', 'Entrer le nom', 'أدخل الاسم')}
                            />
                          </div>
                          <div className="rounded-lg bg-secondary p-3">
                            <p className="text-sm text-muted-foreground">{t('Total', 'Total', 'المجموع')}</p>
                            <p className="text-2xl font-bold text-foreground">
                              {(piecesCount * table.pricePerPiece).toFixed(2)} DH
                            </p>
                          </div>
                        </div>
                      )}

                      {sessionType === 'challenge' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{t('Challenge Mode', 'Mode défi', 'وضع التحدي')}</Label>
                            <RadioGroup
                              value={challengeMode.toString()}
                              onValueChange={(v) => setChallengeMode(parseInt(v) as 3 | 5 | 7)}
                              className="flex gap-4"
                            >
                              {[3, 5, 7].map((mode) => (
                                <div key={mode} className="flex items-center space-x-2">
                                  <RadioGroupItem value={mode.toString()} id={`mode-${mode}`} />
                                  <Label htmlFor={`mode-${mode}`} className="cursor-pointer">
                                    {t(`First to ${mode}`, `Premier à ${mode}`, `الاول الى ${mode}`)}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="player1">{t('Player 1', 'Joueur 1', 'اللاعب 1')}</Label>
                              <PlayerSelect
                                id="player1"
                                value={player1Name}
                                onChange={setPlayer1Name}
                                placeholder={t('Name', 'Nom', 'الاسم')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="player2">{t('Player 2', 'Joueur 2', 'اللاعب 2')}</Label>
                              <PlayerSelect
                                id="player2"
                                value={player2Name}
                                onChange={setPlayer2Name}
                                placeholder={t('Name', 'Nom', 'الاسم')}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleStartSession}
                        className="w-full touch-target"
                        disabled={sessionType === 'challenge' && (!player1Name || !player2Name)}
                      >
                        {t('Start Session', 'Démarrer la session', 'بدء اللعبة')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <>
                  {table.currentSession?.type === 'pieces' && (
                    <Dialog
                      open={addPiecesDialogOpen && selectedTable?.id === table.id}
                      onOpenChange={(open) => {
                        setAddPiecesDialogOpen(open);
                        if (open) setSelectedTable(table);
                        else resetForm();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 touch-target"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Plus className="me-2 h-4 w-4" />
                          {t('Add Pieces', 'Ajouter', 'أضف قطع')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('Add More Pieces', 'Ajouter des pièces', 'أضف قطع')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>{t('Number of Pieces', 'Nombre de pièces', 'عدد القطع')}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={piecesCount}
                              onChange={(e) => setPiecesCount(parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <Button onClick={() => handleAddPieces(table)} className="w-full">
                            {t('Add', 'Ajouter', 'أضف')} ({(piecesCount * table.pricePerPiece).toFixed(2)} DH)
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    className="flex-1 touch-target bg-status-preparing hover:bg-status-preparing/90"
                    onClick={() => handleEndSession(table)}
                  >
                    <Circle className="me-2 h-4 w-4" />
                    {t('End Session', 'Terminer', 'إنهاء اللعبة')}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ChallengeResultDialog
        open={challengeResultOpen}
        onOpenChange={setChallengeResultOpen}
        table={selectedTable}
      />

      <div className="pt-8 border-t">
        <UnpaidSessions
          sessions={unpaidSessions}
          isLoading={isLoadingUnpaid}
          onMarkPaid={handleMarkAsPaid}
        />
      </div>
    </div>
  );
};

export default PoolTables;
