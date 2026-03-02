import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePoolPlayers } from '@/hooks/usePoolPlayers';
import { cn } from '@/lib/utils';
import { Trophy, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface LiveMatchesScoreProps {
    matches: any[];
    tables: any[];
    tournamentMatches?: any[];
}

export const LiveMatchesScore: React.FC<LiveMatchesScoreProps> = ({ matches, tables, tournamentMatches = [] }) => {
    const { t } = useApp();
    const { data: playersData } = usePoolPlayers({ limit: 500 });
    const players = playersData?.players || [];

    // Local state for scores
    const [scores, setScores] = useState<Record<string, { p1: number; p2: number }>>({});

    // Load initial scores from localStorage
    useEffect(() => {
        const initialScores: Record<string, { p1: number; p2: number }> = {};
        matches.forEach(match => {
            const stored = localStorage.getItem(`match_score_${match.id}`);
            if (stored) {
                try {
                    initialScores[match.id] = JSON.parse(stored);
                } catch {
                    initialScores[match.id] = { p1: 0, p2: 0 };
                }
            } else {
                initialScores[match.id] = { p1: 0, p2: 0 };
            }
        });
        setScores(initialScores);
    }, [matches]);

    const handleScoreChange = (matchId: string, playerNum: 1 | 2, increment: boolean, maxScore: number) => {
        setScores(prev => {
            const currentMatchScores = prev[matchId] || { p1: 0, p2: 0 };
            const currentScore = playerNum === 1 ? currentMatchScores.p1 : currentMatchScores.p2;

            let newScore = increment ? currentScore + 1 : currentScore - 1;
            // Clamp score between 0 and maxScore
            newScore = Math.max(0, Math.min(newScore, maxScore));

            const updatedMatchScores = {
                ...currentMatchScores,
                [playerNum === 1 ? 'p1' : 'p2']: newScore
            };

            const newScores = {
                ...prev,
                [matchId]: updatedMatchScores
            };

            // Trigger confetti if someone just won (wasn't max score before, but is now)
            if (newScore === maxScore && currentScore < maxScore) {
                let originX = playerNum === 1 ? 0.25 : 0.75;
                let originY = 0.6;

                // Get exact position of the avatar
                const avatarEl = document.getElementById(`avatar-${matchId}-p${playerNum}`);
                if (avatarEl) {
                    const rect = avatarEl.getBoundingClientRect();
                    originX = (rect.left + rect.width / 2) / window.innerWidth;
                    originY = (rect.top + rect.height / 2) / window.innerHeight;
                }

                const fireConfetti = () => {
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: originY, x: originX },
                        zIndex: 100,
                        colors: ['#22c55e', '#ffffff', '#eab308', '#3b82f6'],
                    });
                };

                fireConfetti();
                setTimeout(fireConfetti, 600);
                setTimeout(fireConfetti, 1200);
            }

            // Save to localStorage
            localStorage.setItem(`match_score_${matchId}`, JSON.stringify(updatedMatchScores));
            return newScores;
        });
    };

    const getPlayerAvatar = (name: string) => {
        const player = players.find(p => p.name.toLowerCase() === name?.toLowerCase());
        return player?.avatarUrl || 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png';
    };

    const getMatchMaxScore = (match: any) => {
        const table = tables.find(t => t.id === match.tableId);
        // Default to 5 if we can't find it, but normally it's in currentSession.challenge.mode
        const mode = table?.currentSession?.challenge?.mode || 5;
        return mode;
    };

    const getMatchSemanticLabel = (match: any) => {
        if (!tournamentMatches || tournamentMatches.length === 0 || !match.round) {
            return match.label ? `${t('MATCH', 'MATCH', 'مباراة')} ${match.label}` : '';
        }

        const totalRounds = Math.max(...tournamentMatches.map(m => m.round || 1));
        const diff = totalRounds - match.round;

        if (diff === 0) return t('FINAL', 'FINALE', 'النهائي');
        if (diff === 1) return t('SEMI-FINAL', 'DEMI-FINALE', 'نصف النهائي');
        if (diff === 2) return t('QUARTER-FINAL', 'QUART DE FINALE', 'ربع النهائي');

        return match.label ? `${t('MATCH', 'MATCH', 'مباراة')} ${match.label}` : '';
    };

    if (!matches || matches.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-950 text-white p-8">
                <div className="text-center">
                    <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-muted-foreground">{t('No Live Matches', 'Aucun match en direct', 'لا توجد مباريات حية')}</h2>
                </div>
            </div>
        );
    }

    // Determine grid layout based on number of matches
    const getGridClass = (count: number) => {
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count === 3) return "grid-cols-3";
        if (count === 4) return "grid-cols-2 grid-rows-2";
        return "grid-cols-3"; // Fallback for many matches
    };

    return (
        <div className="flex-1 bg-blue-950 p-4 h-full overflow-hidden flex flex-col pointer-events-auto">
            <div className={cn("grid gap-4 flex-1 w-full h-full", getGridClass(matches.length))}>
                {matches.map((match) => {
                    const maxScore = getMatchMaxScore(match);
                    const matchScores = scores[match.id] || { p1: 0, p2: 0 };
                    const p1Avatar = getPlayerAvatar(match.player1Name);
                    const p2Avatar = getPlayerAvatar(match.player2Name);
                    const tableLabel = tables.find(t => t.id === match.tableId)?.number;

                    const MatchPlayer = ({
                        name, avatar, score, playerNum
                    }: {
                        name: string; avatar: string; score: number; playerNum: 1 | 2;
                    }) => (
                        <div className="flex flex-col items-center justify-center flex-1 min-w-0 relative group w-full h-full p-4">
                            {/* Avatar Container with Hover Overlay */}
                            <div
                                id={`avatar-${match.id}-p${playerNum}`}
                                className="relative aspect-square w-[60%] max-w-[25vh] 2xl:max-w-[30vh] mb-4 rounded-full shadow-2xl overflow-hidden ring-4 ring-blue-800/50 transition-all duration-300"
                            >
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                                {score === maxScore && (
                                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center backdrop-blur-sm animate-[pulse_2s_ease-in-out_infinite]">
                                        <span className="text-white font-black text-2xl md:text-4xl 2xl:text-5xl uppercase tracking-widest drop-shadow-xl -rotate-12 animate-[bounce_2s_ease-in-out_infinite]">
                                            {t('WINNER', 'GAGNANT', 'الفائز')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Player Name */}
                            <h3 className="text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-medium text-white text-center uppercase tracking-wider drop-shadow-lg truncate w-full px-4 my-6">
                                {name}
                            </h3>

                            {/* Score Display */}
                            <div className="flex items-center gap-6 mt-10">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 md:h-16 md:w-16 rounded-full border-blue-900 bg-blue-950 text-white hover:bg-blue-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange(match.id, playerNum, false, maxScore);
                                    }}
                                >
                                    <Minus className="h-12 w-12 md:h-16 md:w-16" />
                                </Button>
                                <span className={cn(
                                    "text-6xl md:text-[7rem] lg:text-[8rem] font-bold leading-none tabular-nums tracking-tighter drop-shadow-2xl",
                                    score === maxScore ? "text-green-500" : "text-white"
                                )}>
                                    {score}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 md:h-16 md:w-16 rounded-full border-blue-900 bg-blue-950 text-white hover:bg-blue-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange(match.id, playerNum, true, maxScore);
                                    }}
                                >
                                    <Plus className="h-12 w-12 md:h-16 md:w-16" />
                                </Button>
                            </div>
                        </div>
                    );

                    return (
                        <div key={match.id} className="bg-blue-900 rounded-3xl border border-zinc-600 overflow-hidden shadow-2xl relative flex flex-col">
                            {/* Match Header */}
                            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 lg:p-8 flex justify-between items-start z-10 pointer-events-none">
                                <div className="flex flex-col gap-2 flex-1 items-start">
                                    <Badge variant="outline" className="bg-blue-950 border-blue-950 text-white font-mono text-sm sm:text-lg md:text-xl backdrop-blur-md px-3 sm:px-4 py-1 sm:py-2">
                                        {t('RACE TO', 'PREMIER À', 'سباق إلى')} {maxScore}
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-2 flex-1 items-center">
                                    {(match.label || match.round) && (
                                        <Badge variant="outline" className="text-white border-none text-sm sm:text-lg md:text-xl px-4 sm:px-6 py-1 sm:py-2 backdrop-blur-md font-bold tracking-widest uppercase">
                                            {getMatchSemanticLabel(match)}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2 flex-1">
                                    <div className="flex items-center gap-2 bg-red-500/20 text-red-500 border border-red-500 px-3 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-md">
                                        <div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 rounded-full animate-pulse" />
                                        <span className="font-bold text-sm sm:text-lg md:text-xl tracking-widest">{t('LIVE', 'EN DIRECT', 'مباشر')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Players Area */}
                            <div className="flex flex-1 flex-col md:flex-row relative">
                                <MatchPlayer
                                    name={match.player1Name || 'Player 1'}
                                    avatar={p1Avatar}
                                    score={matchScores.p1}
                                    playerNum={1}
                                />

                                {/* VS Divider */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="w-1 h-20 md:h-32 lg:h-40 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent my-2 hidden md:block" />
                                    <div className="flex items-center justify-center bg-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.8)] rounded-full px-3 py-1 md:px-4 md:py-2">
                                        <span className="text-xl md:text-2xl xl:text-3xl font-semibold text-zinc-300 italic">VS</span>
                                    </div>
                                    <div className="w-1 h-20 md:h-32 lg:h-40 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent my-2 hidden md:block" />
                                </div>

                                <MatchPlayer
                                    name={match.player2Name || 'Player 2'}
                                    avatar={p2Avatar}
                                    score={matchScores.p2}
                                    playerNum={2}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
