// ============================================
// Tournament Dialog
// ============================================

import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useTournaments,
    useCreateTournament,
    useTournament,
    useStartTournamentMatch,
    useUpdateTournament,
    useFinalizeTournament,
    useUpdateTournamentMatchPlayers,
} from '@/hooks/useTournaments';
import { usePoolTables } from '@/hooks/usePoolTables';
import {
    Trophy, Plus, Users, Layout,
    Play, CheckCircle2, X, Maximize2,
    Minimize2, Download, FileImage, Printer, Pen, Radio
} from 'lucide-react';
import { PlayerSelect } from './PlayerSelect';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';
import { LiveMatchesScore } from './LiveMatchesScore';

export const TournamentDialog = ({ children }: { children?: React.ReactNode }) => {
    const { t } = useApp();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'list' | 'info' | 'players' | 'active'>('list');
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [players, setPlayers] = useState<string[]>([]);
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [newPlayer, setNewPlayer] = useState('');
    const [startingMatchId, setStartingMatchId] = useState<string | null>(null);
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [editPlayer1, setEditPlayer1] = useState('');
    const [editPlayer2, setEditPlayer2] = useState('');
    const [editingMatchLabel, setEditingMatchLabel] = useState<string>('');
    const [showLiveScore, setShowLiveScore] = useState(false);

    const { data: tournaments = [], isLoading: isLoadingList } = useTournaments();
    const { data: poolTables = [] } = usePoolTables();
    const { data: activeTournament, isLoading: isLoadingActive } = useTournament(selectedTournamentId || '');

    useEffect(() => {
        if (activeTournament) {
            const completedMatches = activeTournament.matches.filter(m => m.status === 'completed');
            completedMatches.forEach(match => {
                localStorage.removeItem(`match_score_${match.id}`);
            });
            // If there are no live matches, turn off live score view
            if (!activeTournament.matches.some(m => m.status === 'in_progress')) {
                setShowLiveScore(false);
            }
        }
    }, [activeTournament]);

    const createMutation = useCreateTournament();
    const updateMutation = useUpdateTournament();
    const finalizeMutation = useFinalizeTournament();
    const startMatchMutation = useStartTournamentMatch();
    const updatePlayersMutation = useUpdateTournamentMatchPlayers();

    // ... (keep handlers as is, they are inside the component)

    const handleCreate = async (asDraft: boolean = false) => {
        if (!name) return;
        if (!asDraft && players.length < 2) {
            toast.error(t('At least 2 players required', 'Au moins 2 joueurs requis', 'مطلوب لاعبان على الأقل'));
            return;
        }

        try {
            const tournament = await createMutation.mutateAsync({
                name,
                players,
                tableIds: selectedTableIds,
                status: asDraft ? 'draft' : 'pending',
            });

            if (asDraft) {
                setStep('list');
                toast.success(t('Draft saved!', 'Brouillon enregistré!', 'تم حفظ المسودة!'));
            } else {
                setSelectedTournamentId(tournament.id);
                setStep('active');
                toast.success(t('Tournament created!', 'Tournoi créé!', 'تم إنشاء البطولة!'));
            }
        } catch (err) {
            toast.error(t('Failed to create tournament', 'Échec de la création', 'فشل إنشاء البطولة'));
        }
    };

    // ... (keep all other handlers) 
    // I need to be careful with replace_file_content not to delete the handlers. 
    // The safest way is to replace only the beginning and the render part, OR use multi_replace.
    // Since the file is large, I will use multi_replace to target the signature and the render.

    const handleUpdateDraft = async () => {
        if (!selectedTournamentId) return;
        try {
            await updateMutation.mutateAsync({
                id: selectedTournamentId,
                data: {
                    name,
                    players,
                    tableIds: selectedTableIds,
                },
            });
            toast.success(t('Draft updated!', 'Brouillon mis à jour!', 'تم تحديث المسودة!'));
        } catch (err) {
            toast.error(t('Failed to update draft', 'Échec de la mise à jour', 'فشل تحديث المسودة'));
        }
    };

    const handleFinalize = async () => {
        if (!selectedTournamentId) return;
        if (players.length < 2) {
            toast.error(t('At least 2 players required', 'Au moins 2 joueurs requis', 'مطلوب لاعبان على الأقل'));
            return;
        }

        try {
            await finalizeMutation.mutateAsync(selectedTournamentId);
            toast.success(t('Tournament finalized!', 'Tournoi finalisé!', 'تم تأكيد البطولة!'));
            setStep('active');
        } catch (err) {
            toast.error(t('Failed to finalize tournament', 'Échec de la finalisation', 'فشل تأكيد البطولة'));
        }
    };

    const handleStartMatch = async (matchId: string, mode: number = 3) => {
        if (!selectedTournamentId) return;

        // Refresh available table check
        const availableTable = poolTables.find((t) => {
            if (t.status !== 'available') return false;
            if (!activeTournament?.tableIds || activeTournament.tableIds.length === 0) return true;

            return activeTournament.tableIds.some(id => {
                const idStr = typeof id === 'string' ? id : (id as any)._id || (id as any).id;
                return idStr === t.id;
            });
        });

        if (!availableTable) {
            toast.error(t('All assigned tables are currently occupied', 'Toutes les tables assignées sont occupées', 'جميع الطاولات المختارة مشغولة حالياً'));
            return;
        }

        try {
            await startMatchMutation.mutateAsync({
                tournamentId: selectedTournamentId,
                matchId,
                tableId: availableTable.id,
                mode,
            });
            setStartingMatchId(null);
            toast.success(t('Match started!', 'Match démarré!', 'بدأت المباراة!'));
        } catch (err) {
            toast.error(t('Failed to start match', 'Échec du démarrage', 'فشل بدء المباراة'));
        }
    };

    const handleUpdatePlayers = async (matchId: string) => {
        if (!selectedTournamentId) return;

        try {
            await updatePlayersMutation.mutateAsync({
                tournamentId: selectedTournamentId,
                matchId,
                data: {
                    player1Name: editPlayer1 || undefined,
                    player2Name: editPlayer2 || undefined,
                }
            });
            setEditingMatchId(null);
            toast.success(t('Match updated!', 'Match mis à jour!', 'تم تحديث المباراة!'));
        } catch (err: any) {
            toast.error(err.message || t('Failed to update players', 'Échec de la mise à jour', 'فشل تحديث اللاعبين'));
        }
    };

    const bracketRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportImage = async (orientation: 'landscape' | 'portrait') => {
        if (!bracketRef.current) return;

        setIsExporting(true);
        try {
            const element = bracketRef.current;
            const originalStyle = element.getAttribute('style') || '';

            // Temporary adjustments for high-quality export
            if (orientation === 'portrait') {
                element.style.width = '1000px';
                element.style.height = '1400px';
            } else {
                element.style.width = '1920px';
                element.style.height = '1080px';
            }

            element.style.padding = '40px';
            element.style.background = 'white';

            const dataUrl = await toPng(element, {
                quality: 0.95,
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: '#ffffff',
            });

            // Restore original style
            element.setAttribute('style', originalStyle);

            const link = document.createElement('a');
            link.download = `Tournament_${activeTournament?.name}_${orientation}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to export image:', error);
            toast.error(t('Failed to export image', 'Échec de l\'exportation', 'فشل تصدير الصورة'));
        } finally {
            setIsExporting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setPlayers([]);
        setSelectedTableIds([]);
        setStep('list');
        setSelectedTournamentId(null);
    };

    // Helper Components for Bracket
    const MatchCard = ({ match }: { match: any }) => (
        <div
            className={cn(
                "rounded-lg border-2 p-4 bg-yellow-50/50 shadow-lg group relative overflow-hidden w-full backdrop-blur-sm",
                match.status === 'completed' ? 'border-status-ready/50 bg-status-ready/30' : 'border-amber-200/50',
                match.status === 'in_progress' ? 'border-primary/60 ring-2 ring-primary/20 bg-primary/20' : '',
                match.status === 'bye' ? 'opacity-90 border-dashed border-muted-foreground/40' : ''
            )}
        >
            {match.label && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[30px] font-black text-muted-foreground/20 select-none uppercase tracking-widest">
                        {match.label}
                    </span>
                </div>
            )}

            {match.status === 'pending' && !startingMatchId && editingMatchId !== match.id && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditPlayer1(match.player1Name || '');
                        setEditPlayer2(match.player2Name || '');
                        setEditingMatchLabel(match.label || '');
                        setEditingMatchId(match.id);
                    }}
                >
                    <Pen className="h-3 w-3" />
                </Button>
            )}

            <div className="space-y-1.5 pt-2">
                <div className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded-md",
                    match.winnerName === match.player1Name ? 'bg-status-ready/20 ring-1 ring-status-ready/30' : 'bg-muted/60 border border-muted-foreground/10'
                )}>
                    <span className={cn(
                        "text-xs font-bold truncate",
                        match.winnerName === match.player1Name ? 'text-status-ready' : ''
                    )}>
                        {match.player1Name || (match.status === 'pending' ? '???' : '')}
                    </span>
                    {match.status === 'completed' && <span className="font-mono font-bold text-[10px] ml-2 text-muted-foreground">{match.player1Score}</span>}
                </div>
                <div className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded-md",
                    match.winnerName === match.player2Name ? 'bg-status-ready/20 ring-1 ring-status-ready/30' : 'bg-muted/60 border border-muted-foreground/10'
                )}>
                    <span className={cn(
                        "text-xs font-bold truncate",
                        match.winnerName === match.player2Name ? 'text-status-ready' : ''
                    )}>
                        {match.player2Name || (match.status === 'bye' ? 'BYE' : match.status === 'pending' ? '???' : '')}
                    </span>
                    {match.status === 'completed' && <span className="font-mono font-bold text-[10px] ml-2 text-muted-foreground">{match.player2Score}</span>}
                </div>
            </div>

            {match.status === 'pending' && match.player1Name && match.player2Name && editingMatchId !== match.id && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 rounded-lg z-10">
                    {startingMatchId === match.id ? (
                        <div className="flex flex-col gap-2 p-1 w-full scale-90">
                            <span className="text-[8px] font-black uppercase text-center text-muted-foreground">{t('Select Mode', 'Choisir Mode', 'اختر النمط')}</span>
                            <div className="grid grid-cols-2 gap-1 px-1">
                                {[3, 5, 6, 7, 9].map(mode => (
                                    <Button
                                        key={mode}
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-[9px] font-black hover:bg-primary hover:text-white"
                                        onClick={(e) => { e.stopPropagation(); handleStartMatch(match.id, mode); }}
                                    >
                                        {t(`First to ${mode}`, `Premier à ${mode}`, `أول من يصل إلى ${mode}`)}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[8px] mt-1"
                                onClick={(e) => { e.stopPropagation(); setStartingMatchId(null); }}
                            >
                                {t('Cancel', 'Annuler', 'إلغاء')}
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" className="h-7 gap-1 font-bold text-[10px]" onClick={(e) => { e.stopPropagation(); setStartingMatchId(match.id); }}>
                            <Play className="h-3 w-3 fill-current" />
                            {t('Start', 'Lancer', 'بدء')}
                        </Button>
                    )}
                </div>
            )}

            {match.status === 'in_progress' && (
                <div className="mt-1 flex items-center gap-1.5 justify-center text-[8px] font-black text-primary animate-pulse uppercase">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {t('LIVE', 'EN DIRECT', 'مباشر')}
                </div>
            )}

            {match.status === 'completed' && (
                <div className="absolute top-1 right-1">
                    <CheckCircle2 className="h-3 w-3 text-status-ready" />
                </div>
            )}
        </div>
    );

    const Connector = ({ isRight = false, isFinal = false }: { isRight?: boolean; isFinal?: boolean }) => (
        <div className={cn("relative h-full w-full", isFinal ? "flex-1" : "w-10")}>
            <svg
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d={isFinal
                        ? (isRight ? "M 100 50 L 0 50" : "M 0 50 L 100 50")
                        : (isRight
                            ? "M 100 25 L 50 25 L 50 75 L 100 75 M 50 50 L 0 50"
                            : "M 0 25 L 50 25 L 50 75 L 0 75 M 50 50 L 100 50"
                        )
                    }
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2 touch-target">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="hidden sm:inline">
                            {t('Tournament', 'Tournoi', 'البطولة')}
                        </span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={cn(
                "flex flex-col p-0 overflow-hidden transition-all duration-300",
                // Always full screen on mobile, constrained on desktop unless maximized
                "w-screen h-screen max-w-none rounded-none border-none inset-0 translate-x-0 translate-y-0 sm:w-[95vw] sm:h-[90vh] sm:max-w-[1000px] sm:rounded-lg sm:border sm:left-[50%] sm:top-[50%] sm:right-auto sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%]",
                isMaximized && "sm:max-w-none sm:w-screen sm:h-screen sm:rounded-none sm:border-none sm:inset-0 sm:translate-x-0 sm:translate-y-0"
            )}>
                <DialogHeader className="p-4 border-b relative flex items-center justify-center min-h-[64px]">
                    <DialogTitle className="flex items-center gap-2 text-2xl absolute left-1/2 -translate-x-1/2 w-full justify-center pointer-events-none">
                        <Trophy className="h-6 w-6 text-primary flex-shrink-0" />
                        <span className="truncate max-w-[60%]">
                            {step === 'list' && t('Pool Tournaments', 'Tournois de Billard', 'بطولات البلياردو')}
                            {step === 'info' && t('Create New Tournament', 'Nouveau Tournoi', 'إنشاء بطولة جديدة')}
                            {step === 'players' && t('Add Players', 'Ajouter des joueurs', 'إضافة لاعبين')}
                            {step === 'active' && activeTournament?.name}
                        </span>
                    </DialogTitle>
                    <div className="flex items-center px-0 sm:px-0 md:px-8 justify-between w-full justify-end">
                        {step === 'active' && activeTournament?.matches.some(m => m.status === 'in_progress') && (
                            <Button
                                variant={showLiveScore ? "default" : "outline"}
                                size="sm"
                                className="h-8 gap-2 mr-2"
                                onClick={() => setShowLiveScore(!showLiveScore)}
                            >
                                <Radio className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('Live', 'En Direct', 'مباشر')}</span>
                            </Button>
                        )}
                        {step === 'active' && (!showLiveScore && activeTournament?.status === 'completed') && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-white/50 border-green-200 text-green-700 hover:bg-green-50" disabled={isExporting}>
                                        <Download className="h-4 w-4" />
                                        {isExporting ? t('Export...', 'Export...', 'تحميل...') : t('Download', 'Télécharger', 'تحميل')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleExportImage('landscape')} className="gap-2 cursor-pointer">
                                        <FileImage className="h-4 w-4" />
                                        <span>{t('Landscape PNG', 'Paysage PNG', 'عرضي (Landscape)')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted hidden sm:flex"
                            onClick={() => setIsMaximized(!isMaximized)}
                        >
                            {isMaximized ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {step === 'list' && (
                        <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
                            <Button onClick={() => setStep('info')} className="w-full gap-2 py-6 text-lg">
                                <Plus className="h-5 w-5" />
                                {t('New Tournament', 'Nouveau Tournoi', 'بطولة جديدة')}
                            </Button>

                            <ScrollArea className="flex-1 -mx-2 px-2">
                                <div className="space-y-3 pb-4">
                                    {tournaments.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground italic">
                                            {t('No tournaments found', 'Aucun tournoi trouvé', 'لا يوجد بطولات')}
                                        </div>
                                    ) : (
                                        tournaments.map((tourney) => (
                                            <div
                                                key={tourney.id}
                                                className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group"
                                                onClick={() => {
                                                    setSelectedTournamentId(tourney.id);
                                                    if (tourney.status === 'draft') {
                                                        setName(tourney.name);
                                                        setPlayers(tourney.players);
                                                        setSelectedTableIds(tourney.tableIds?.map((id: any) => typeof id === 'string' ? id : id._id || id.id) || []);
                                                        setStep('players');
                                                    } else {
                                                        setStep('active');
                                                    }
                                                }}
                                            >
                                                <div>
                                                    <h3 className="font-bold text-lg">{tourney.name}</h3>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <Badge
                                                            variant={
                                                                tourney.status === 'completed' ? 'secondary' :
                                                                    tourney.status === 'in_progress' ? 'default' :
                                                                        tourney.status === 'draft' ? 'outline' : 'default'
                                                            }
                                                            className={cn(
                                                                "text-[10px]",
                                                                tourney.status === 'draft' && "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                            )}
                                                        >
                                                            {tourney.status === 'draft' ? t('DRAFT', 'BROUILLON', 'مسودة') : tourney.status.replace('_', ' ').toUpperCase()}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {tourney.players.length} {t('Players', 'Joueurs', 'لاعبين')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                                                    <Play className="h-5 w-5 text-primary" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {step === 'info' && (
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>{t('Tournament Name', 'Nom du tournoi', 'اسم البطولة')}</Label>
                                <Input
                                    placeholder={t('Super Cup 2024', 'Super Coupe 2024', 'كأس السوبر 2024')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-lg py-6"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>{t('Assigned Tables', 'Tables assignées', 'الطاولات المختارة')}</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {poolTables.map((table) => (
                                        <Button
                                            key={table.id}
                                            variant={selectedTableIds.includes(table.id) ? 'default' : 'outline'}
                                            className="h-12 text-lg font-bold"
                                            onClick={() => {
                                                setSelectedTableIds((prev) =>
                                                    prev.includes(table.id)
                                                        ? prev.filter((id) => id !== table.id)
                                                        : [...prev, table.id]
                                                );
                                            }}
                                        >
                                            #{table.number}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    {t('Leave empty to use all tables', 'Laisser vide pour utiliser toutes les tables', 'اتركها فارغة لاستخدام جميع الطاولات')}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setStep('list')}>
                                    {t('Cancel', 'Annuler', 'إلغاء')}
                                </Button>
                                <Button className="flex-2" disabled={!name} onClick={() => setStep('players')}>
                                    {t('Next: Players', 'Suivant: Joueurs', 'التالي: اللاعبين')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'players' && (
                        <div className="p-6 space-y-6 flex-1 flex flex-col overflow-hidden">
                            <div className="space-y-2">
                                <Label>{t('Add Players', 'Ajouter des joueurs', 'إضافة لاعبين')}</Label>
                                <div className="flex gap-2">
                                    <PlayerSelect
                                        value={newPlayer}
                                        onChange={setNewPlayer}
                                        placeholder={t('Player name', 'Nom du joueur', 'اسم اللاعب')}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => {
                                            if (newPlayer && !players.includes(newPlayer)) {
                                                setPlayers([...players, newPlayer]);
                                                setNewPlayer('');
                                            }
                                        }}
                                        disabled={!newPlayer}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 border rounded-lg p-2 bg-muted/30">
                                <div className="space-y-1">
                                    {players.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-card border shadow-sm group">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                                                <span className="font-medium">{p}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}
                                            >
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    {players.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground italic text-sm">
                                            {t('No players added yet', 'Aucun joueur ajouté', 'لم يتم إضافة لاعبين بعد')}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setStep('info')}>
                                    {t('Back', 'Retour', 'رجوع')}
                                </Button>
                                {activeTournament?.status === 'draft' ? (
                                    <div className="flex-1 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-yellow-500/50 text-yellow-700 hover:bg-yellow-50"
                                            onClick={() => handleUpdateDraft()}
                                            disabled={updateMutation.isPending}
                                        >
                                            {updateMutation.isPending ? t('Saving...', 'Enregistrement...', 'جاري الحفظ...') : t('Save Changes', 'Enregistrer', 'حفظ التعديلات')}
                                        </Button>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleFinalize()}
                                            disabled={finalizeMutation.isPending || players.length < 2}
                                        >
                                            {finalizeMutation.isPending ? t('Starting...', 'Démarrage...', 'جاري البدء...') : t('Start Tournament', 'Démarrer le tournoi', 'بدء البطولة')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-yellow-500/50 text-yellow-700 hover:bg-yellow-50"
                                            onClick={() => handleCreate(true)}
                                            disabled={createMutation.isPending || !name}
                                        >
                                            {t('Save as Draft', 'Enregistrer en brouillon', 'حفظ كمسودة')}
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            disabled={players.length < 2 || createMutation.isPending}
                                            onClick={() => handleCreate(false)}
                                        >
                                            {t('Start Tournament', 'Démarrer le tournoi', 'بدء البطولة')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'active' && activeTournament && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {showLiveScore ? (
                                <LiveMatchesScore
                                    matches={activeTournament.matches.filter(m => m.status === 'in_progress')}
                                    tables={poolTables}
                                    tournamentMatches={activeTournament.matches}
                                />
                            ) : (
                                <>
                                    <div className="px-6 sm:px-6 md:px-12 py-2 bg-muted/50 border-y flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] uppercase text-muted-foreground font-bold">{activeTournament.players.length} {t('Players', 'Joueurs', 'لاعبين')}</span>
                                        </div>
                                        {activeTournament.winnerName && (
                                            <div className="flex items-center gap-2 bg-status-ready/10 px-3 py-1 rounded-full border border-status-ready/30">
                                                <Trophy className="h-4 w-4 text-status-ready" />
                                                <span className="text-xs font-bold text-status-ready">{activeTournament.winnerName}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <Badge variant="outline" className="text-xs px-2 py-0 bg-background border-primary/20">{activeTournament.status.toUpperCase()}</Badge>
                                        </div>
                                    </div>


                                    <div ref={bracketRef} className="flex-1 overflow-x-auto overflow-y-auto bg-muted/5 min-h-0 relative m-0 mobile-iso-scroll">
                                        {/* Background Watermark - Centered on content */}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-[0.1]"
                                            style={{
                                                backgroundImage: "url('/NooryakBg.png')",
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundSize: '1200px',
                                                // Ensure it moves with content
                                                width: '100%',
                                                height: '100%',
                                                minWidth: '1200px',
                                            }}
                                        />
                                        <div className="p-4 min-w-[1200px] h-full relative z-10">
                                            {(() => {
                                                const matches = activeTournament.matches;
                                                const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
                                                const leftMatches = matches.filter(m => m.side === 'left');
                                                const rightMatches = matches.filter(m => m.side === 'right');
                                                const centerMatch = matches.find(m => m.side === 'center');
                                                const leftRounds = [...rounds.slice(0, -1)];
                                                const rightRounds = [...leftRounds];

                                                return (
                                                    <div className="flex justify-between items-stretch gap-0 h-full">
                                                        {/* Left Side Hierarchy */}
                                                        <div className="flex flex-1 justify-start gap-0">
                                                            {leftRounds.map((round, idx) => {
                                                                const roundMatches = leftMatches.filter(m => m.round === round);
                                                                const isSemiFinal = idx === leftRounds.length - 1;
                                                                return (
                                                                    <div key={`left-group-${round}`} className={cn("flex flex-col", isSemiFinal && "flex-1")}>
                                                                        <div className="h-32 flex flex-col justify-center items-center text-center">
                                                                            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">{t(`Round ${round}`, `Tour ${round}`, `الجولة ${round}`)}</span>
                                                                        </div>
                                                                        <div className="flex flex-1">
                                                                            <div className="flex flex-col justify-around gap-4 w-[180px]">
                                                                                {roundMatches.map(m => <MatchCard key={m.id} match={m} />)}
                                                                            </div>
                                                                            {idx < leftRounds.length - 1 && (
                                                                                <div className="flex flex-col justify-around w-10">
                                                                                    {Array.from({ length: roundMatches.length / 2 }).map((_, i) => (
                                                                                        <Connector key={i} />
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {isSemiFinal && (
                                                                                <div className="flex flex-col justify-around flex-1">
                                                                                    <Connector isFinal />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Final */}
                                                        <div className="flex flex-col w-[220px]">
                                                            <div className="h-32 flex flex-col items-center justify-center text-center">
                                                                <Trophy className="h-16 w-16 text-green-700 mx-auto mb-2 animate-bounce" />
                                                                <span className="text-md font-black uppercase tracking-widest text-green-700">{t('FINAL', 'FINALE', 'النهائي')}</span>
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center gap-6 relative">
                                                                {centerMatch && <div className="w-full scale-110 shadow-xl ring-2 ring-primary/20 rounded-xl z-10"><MatchCard match={centerMatch} /></div>}
                                                                {activeTournament.winnerName && (
                                                                    <div className="absolute -bottom-4 left-0 right-0 p-4 rounded-2xl bg-gradient-to-br from-status-ready/30 to-status-ready/5 border border-status-ready/30 text-center animate-in zoom-in duration-500">
                                                                        <span className="text-[10px] font-black uppercase text-green-800 block mb-1">{t('WINNER', 'VAINQUEUR', 'الفائز')}</span>
                                                                        <span className="text-lg font-black text-green-800 drop-shadow-sm">{activeTournament.winnerName}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Side Hierarchy */}
                                                        <div className="flex flex-1 justify-end gap-0">
                                                            {[...rightRounds].reverse().map((round, idx) => {
                                                                const roundMatches = rightMatches.filter(m => m.round === round);
                                                                const isSemiFinal = idx === 0;
                                                                return (
                                                                    <div key={`right-group-${round}`} className={cn("flex flex-col", isSemiFinal && "flex-1")}>
                                                                        <div className="h-32 flex flex-col justify-center items-center text-center">
                                                                            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">{t(`Round ${round}`, `Tour ${round}`, `الجولة ${round}`)}</span>
                                                                        </div>
                                                                        <div className="flex flex-1">
                                                                            {isSemiFinal && (
                                                                                <div className="flex flex-col justify-around flex-1">
                                                                                    <Connector isRight isFinal />
                                                                                </div>
                                                                            )}
                                                                            {idx > 0 && (
                                                                                <div className="flex flex-col justify-around w-10">
                                                                                    {Array.from({ length: roundMatches.length / 2 }).map((_, i) => (
                                                                                        <Connector key={i} isRight />
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            <div className="flex flex-col justify-around gap-4 w-[180px]">
                                                                                {roundMatches.map(m => <MatchCard key={m.id} match={m} />)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Centralized Edit Match Players Popover */}
                                        {editingMatchId && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm pointer-events-auto">
                                                <div className="w-full max-w-sm space-y-4 bg-background border p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex flex-col text-center space-y-1">
                                                        <h3 className="font-bold text-lg">{t('Edit Match Players', 'Modifier les Joueurs du Match', 'تعديل لاعبي المباراة')}</h3>
                                                        {editingMatchLabel && (
                                                            <span className="text-sm text-muted-foreground font-black uppercase tracking-wider">{t('Match', 'Match', 'المباراة')} {editingMatchLabel}</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-4 py-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">{t('Player 1', 'Joueur 1', 'اللاعب 1')}</Label>
                                                            <PlayerSelect
                                                                value={editPlayer1}
                                                                onChange={setEditPlayer1}
                                                                placeholder={t('Select Player 1', 'Sélectionner Joueur 1', 'اختر اللاعب 1')}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">{t('Player 2', 'Joueur 2', 'اللاعب 2')}</Label>
                                                            <PlayerSelect
                                                                value={editPlayer2}
                                                                onChange={setEditPlayer2}
                                                                placeholder={t('Select Player 2', 'Sélectionner Joueur 2', 'اختر اللاعب 2')}
                                                            />
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        let error = null;
                                                        const otherMatches = activeTournament?.matches.filter(m => m.id !== editingMatchId) || [];

                                                        if (editPlayer1 && editPlayer2 && editPlayer1 === editPlayer2) {
                                                            error = t('Players must be different', 'Les joueurs doivent être différents', 'يجب أن يكون اللاعبون مختلفين');
                                                        } else if (editPlayer1 && otherMatches.some(m => m.player1Name === editPlayer1 || m.player2Name === editPlayer1)) {
                                                            error = t(`${editPlayer1} is already in another match`, `${editPlayer1} est déjà dans un autre match`, `${editPlayer1} موجود بالفعل في مباراة أخرى`);
                                                        } else if (editPlayer2 && otherMatches.some(m => m.player1Name === editPlayer2 || m.player2Name === editPlayer2)) {
                                                            error = t(`${editPlayer2} is already in another match`, `${editPlayer2} est déjà dans un autre match`, `${editPlayer2} موجود بالفعل في مباراة أخرى`);
                                                        }

                                                        return (
                                                            <>
                                                                {error && <div className="text-red-500 text-xs font-bold text-center px-2 bg-red-50 py-1.5 rounded-md border border-red-200">{error}</div>}
                                                                <div className="flex gap-2 pt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="flex-1"
                                                                        onClick={(e) => { e.stopPropagation(); setEditingMatchId(null); }}
                                                                        disabled={updatePlayersMutation.isPending}
                                                                    >
                                                                        {t('Cancel', 'Annuler', 'إلغاء')}
                                                                    </Button>
                                                                    <Button
                                                                        className="flex-1"
                                                                        onClick={(e) => { e.stopPropagation(); handleUpdatePlayers(editingMatchId); }}
                                                                        disabled={updatePlayersMutation.isPending || !!error}
                                                                    >
                                                                        {updatePlayersMutation.isPending ? t('Saving...', 'Enregistrement...', 'جاري الحفظ...') : t('Save Changes', 'Enregistrer', 'حفظ التعديلات')}
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>


                                    <div className="p-3 border-t bg-background mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                        <Button variant="outline" className="w-full h-10 font-bold" onClick={() => { setStep('list'); setShowLiveScore(false); }}>
                                            {t('Back to List', 'Retour à la liste', 'العودة للقائمة')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
};
