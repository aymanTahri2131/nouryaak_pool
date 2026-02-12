// ============================================
// Tournament Service
// ============================================

import { PoolTournament, type IPoolTournamentDocument, type ITournamentMatch, type TournamentStatus } from '../models/PoolTournament.js';
import { PoolSession } from '../models/PoolSession.js';
import { PoolTable } from '../models/PoolTable.js';
import { ApiError } from '../middleware/error.middleware.js';
import { broadcast, socketEvents } from '../config/socket.js';
import mongoose from 'mongoose';

/**
 * Generate a single-elimination bracket
 */
/**
 * Generate a symmetric single-elimination bracket
 */
function generateBracket(players: string[]): ITournamentMatch[] {
    const n = players.length;
    if (n < 2) throw new Error('At least 2 players required');

    // Shuffle players for a random draw
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    // Determine total slots (next power of 2)
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(n)));
    const matches: ITournamentMatch[] = [];
    let matchIdCounter = 1;

    // Helper to create the tree structure
    function buildSubTree(
        leafs: (string | ITournamentMatch)[],
        round: number,
        side: 'left' | 'right'
    ): ITournamentMatch {
        const currentRoundMatches: ITournamentMatch[] = [];
        const nextLeafs: (string | ITournamentMatch)[] = [];

        for (let i = 0; i < leafs.length; i += 2) {
            const p1 = leafs[i];
            const p2 = leafs[i + 1];

            // If both are empty strings (byes), don't create a match
            if (p1 === "" && p2 === "") {
                nextLeafs.push("");
                continue;
            }

            const match: ITournamentMatch = {
                id: `match_${matchIdCounter++}`,
                round,
                side,
                status: 'pending',
                player1Score: 0,
                player2Score: 0
            };

            // Round 1 labels (A, B, C...)
            if (round === 1) {
                const labelIndex = (side === 'left' ? 0 : (totalSlots / 4)) + Math.floor(i / 2);
                match.label = String.fromCharCode(65 + labelIndex); // A, B, C...
            }

            // Link P1
            if (typeof p1 === 'string') {
                match.player1Name = p1 || undefined;
            } else {
                p1.nextMatchId = match.id;
                p1.nextMatchSlot = 1;
            }

            // Link P2
            if (typeof p2 === 'string') {
                match.player2Name = p2 || undefined;
            } else {
                p2.nextMatchId = match.id;
                p2.nextMatchSlot = 2;
            }

            // Handle BYE logic: if one player is missing, they advance
            if (match.player1Name && !match.player2Name) {
                match.status = 'bye';
                match.winnerName = match.player1Name;
            } else if (!match.player1Name && match.player2Name) {
                match.status = 'bye';
                match.winnerName = match.player2Name;
            }

            currentRoundMatches.push(match);
            nextLeafs.push(match);
        }

        matches.push(...currentRoundMatches);
        if (nextLeafs.length > 1) {
            return buildSubTree(nextLeafs, round + 1, side);
        }
        return nextLeafs[0] as ITournamentMatch;
    }

    // Pad players and split for symmetry
    const paddedPlayers = [...shuffledPlayers];
    while (paddedPlayers.length < totalSlots) {
        paddedPlayers.push("");
    }

    const leftHalf = paddedPlayers.slice(0, totalSlots / 2);
    const rightHalf = paddedPlayers.slice(totalSlots / 2);

    const leftChamp = buildSubTree(leftHalf, 1, 'left');
    const rightChamp = buildSubTree(rightHalf, 1, 'right');

    const finalRound = Math.log2(totalSlots);

    // Create the Final
    const finalMatch: ITournamentMatch = {
        id: 'match_final',
        round: finalRound,
        side: 'center',
        status: 'pending',
        player1Score: 0,
        player2Score: 0
    };

    leftChamp.nextMatchId = 'match_final';
    leftChamp.nextMatchSlot = 1;
    rightChamp.nextMatchId = 'match_final';
    rightChamp.nextMatchSlot = 2;

    // Propagate winners if final has only one side or byes
    if (leftChamp.winnerName) finalMatch.player1Name = leftChamp.winnerName;
    if (rightChamp.winnerName) finalMatch.player2Name = rightChamp.winnerName;

    matches.push(finalMatch);
    return matches;
}

/**
 * Create a new tournament
 */
export async function createTournament(data: {
    name: string;
    players: string[];
    tableIds: string[];
    status?: TournamentStatus;
}): Promise<IPoolTournamentDocument> {
    const status = data.status || 'pending';
    const matches = status === 'draft' ? [] : generateBracket(data.players);

    const tournament = await PoolTournament.create({
        name: data.name,
        players: data.players,
        tableIds: data.tableIds,
        matches,
        status,
    });

    return tournament;
}

/**
 * Update a tournament (mainly for drafts)
 */
export async function updateTournament(id: string, data: {
    name?: string;
    players?: string[];
    tableIds?: string[];
}): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(id);
    if (!tournament) throw new ApiError(404, 'Tournament not found');
    if (tournament.status !== 'draft') throw new ApiError(400, 'Only drafts can be updated');

    if (data.name) tournament.name = data.name;
    if (data.players) tournament.players = data.players;
    if (data.tableIds) tournament.tableIds = data.tableIds as any;

    await tournament.save();
    return tournament;
}

/**
 * Finalize a draft tournament (generate bracket)
 */
export async function finalizeTournament(id: string): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(id);
    if (!tournament) throw new ApiError(404, 'Tournament not found');
    if (tournament.status !== 'draft') throw new ApiError(400, 'Only drafts can be finalized');
    if (tournament.players.length < 2) throw new ApiError(400, 'At least 2 players required to finalize');

    const matches = generateBracket(tournament.players);
    tournament.matches = matches;
    tournament.status = 'pending';

    await tournament.save();
    return tournament;
}

/**
 * Get all tournaments
 */
export async function getAllTournaments(): Promise<IPoolTournamentDocument[]> {
    return PoolTournament.find().sort({ createdAt: -1 });
}

/**
 * Get tournament by ID
 */
export async function getTournamentById(id: string): Promise<IPoolTournamentDocument | null> {
    return PoolTournament.findById(id).populate('tableIds');
}

/**
 * Start a match
 */
export async function startMatch(
    tournamentId: string,
    matchId: string,
    tableId: string,
    mode: number = 3
): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(tournamentId);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) throw new ApiError(404, 'Match not found');

    if (match.status !== 'pending') throw new ApiError(400, 'Match is not ready to start');
    if (!match.player1Name || !match.player2Name) throw new ApiError(400, 'Match missing players');

    const table = await PoolTable.findById(tableId);
    if (!table || table.status !== 'available') throw new ApiError(400, 'Table not available');

    // Start pool session
    const session = await PoolSession.create({
        tableId,
        type: 'challenge',
        challenge: {
            mode: mode,
            player1Name: match.player1Name,
            player2Name: match.player2Name,
            player1Score: 0,
            player2Score: 0,
            pricePerGame: table.pricePerPiece,
        },
        tournamentId: tournament._id,
        matchId: match.id,
        isPaid: false,
        startedAt: new Date(),
    });

    // Update table status
    table.status = 'occupied';
    table.currentSessionId = session._id;
    await table.save();

    // Update match status
    match.status = 'in_progress';
    match.tableId = tableId as any;
    match.sessionId = session._id as any;
    tournament.status = 'in_progress';

    await tournament.save();

    // Broadcast
    broadcast(socketEvents.POOL_SESSION_STARTED, {
        table: table.toJSON(),
        session: session.toJSON(),
    });

    return tournament;
}

/**
 * Resolve match result
 * This is called when a pool session linked to a tournament match ends
 */
export async function resolveMatch(
    tournamentId: string,
    matchId: string,
    winnerName: string,
    score1: number,
    score2: number
): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(tournamentId);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) throw new ApiError(404, 'Match not found');

    match.status = 'completed';
    match.winnerName = winnerName;
    match.player1Score = score1;
    match.player2Score = score2;

    // Move winner to next match if exists
    if (match.nextMatchId && match.nextMatchSlot) {
        const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
            if (match.nextMatchSlot === 1) {
                nextMatch.player1Name = winnerName;
            } else if (match.nextMatchSlot === 2) {
                nextMatch.player2Name = winnerName;
            }
        }
    } else {
        // This was the final!
        tournament.status = 'completed';
        tournament.winnerName = winnerName;
    }

    await tournament.save();
    return tournament;
}

export default {
    createTournament,
    updateTournament,
    finalizeTournament,
    getAllTournaments,
    getTournamentById,
    startMatch,
    resolveMatch,
};
