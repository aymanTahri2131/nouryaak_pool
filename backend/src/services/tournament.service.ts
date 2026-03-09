// ============================================
// Tournament Service
// ============================================

import { PoolTournament, type IPoolTournamentDocument, type ITournamentMatch, type TournamentStatus, type ITournamentGroup } from '../models/PoolTournament.js';
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
function generateBracket(players: string[], shuffle: boolean = true, startIdCounter: number = 1): ITournamentMatch[] {
    const n = players.length;
    if (n < 2) throw new Error('At least 2 players required');

    // Shuffle players for a random draw
    const shuffledPlayers = [...players];
    if (shuffle) {
        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
        }
    }

    // Determine total slots (next power of 2)
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(n)));
    const matches: ITournamentMatch[] = [];
    let matchIdCounter = startIdCounter;

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
 * Generate League Group Stage (Round-Robin)
 */
function generateGroupStage(players: string[]): { groups: ITournamentGroup[], matches: ITournamentMatch[] } {
    if (players.length < 24 || players.length % 8 !== 0) {
        throw new Error('League mode requires at least 24 players and a multiple of 8');
    }

    // Shuffle players
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    const numGroups = 8;
    const playersPerGroup = Math.floor(shuffledPlayers.length / numGroups);
    const groups: ITournamentGroup[] = [];
    const matches: ITournamentMatch[] = [];
    let matchIdCounter = 1;

    for (let i = 0; i < numGroups; i++) {
        const groupName = `Group ${String.fromCharCode(65 + i)}`;
        const groupPlayers = shuffledPlayers.slice(i * playersPerGroup, (i + 1) * playersPerGroup);

        const standings = groupPlayers.map(p => ({
            playerName: p,
            played: 0,
            wins: 0,
            framesFor: 0,
            framesAgainst: 0,
            frameDiff: 0,
            points: 0,
            headToHead: {}
        }));

        groups.push({
            id: `group_${i}`,
            name: groupName,
            players: groupPlayers,
            status: 'pending',
            standings
        });

        if (groupPlayers.length === 3) {
            // Specific order for 3 players: 1v2, 2v3, 3v1
            const pairings = [[0, 1], [1, 2], [2, 0]];
            pairings.forEach(([x, y]) => {
                matches.push({
                    id: `match_g${i}_${matchIdCounter++}`,
                    round: 1,
                    stage: 'group',
                    groupId: `group_${i}`,
                    status: 'pending',
                    player1Name: groupPlayers[x],
                    player2Name: groupPlayers[y],
                    player1Score: 0,
                    player2Score: 0,
                    label: `${groupName}`
                });
            });
        } else {
            // Standard round robin for >3 players
            for (let x = 0; x < groupPlayers.length; x++) {
                for (let y = x + 1; y < groupPlayers.length; y++) {
                    matches.push({
                        id: `match_g${i}_${matchIdCounter++}`,
                        round: 1,
                        stage: 'group',
                        groupId: `group_${i}`,
                        status: 'pending',
                        player1Name: groupPlayers[x],
                        player2Name: groupPlayers[y],
                        player1Score: 0,
                        player2Score: 0,
                        label: `${groupName}`
                    });
                }
            }
        }
    }

    return { groups, matches };
}

/**
 * Generate Playoff Bracket for League Mode
 */
function generatePlayoffBracket(groups: ITournamentGroup[], startMatchId: number): ITournamentMatch[] {
    // Top 16 mapping logic
    // A=0, B=1, ... H=7
    if (groups.length !== 8) throw new Error("Expected 8 groups for playoffs");

    // Ensure standings are properly sorted before extracting seeds
    groups.forEach(g => {
        g.standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.frameDiff !== a.frameDiff) return b.frameDiff - a.frameDiff;
            if (b.framesFor !== a.framesFor) return b.framesFor - a.framesFor;
            const aBeatsB = a.headToHead?.[b.playerName] || 0;
            const bBeatsA = b.headToHead?.[a.playerName] || 0;
            return bBeatsA - aBeatsB;
        });
    });

    const seeds = [
        groups[0].standings[0].playerName, groups[1].standings[1].playerName, // 1A vs 2B
        groups[2].standings[0].playerName, groups[3].standings[1].playerName, // 1C vs 2D
        groups[4].standings[0].playerName, groups[5].standings[1].playerName, // 1E vs 2F
        groups[6].standings[0].playerName, groups[7].standings[1].playerName, // 1G vs 2H
        groups[1].standings[0].playerName, groups[0].standings[1].playerName, // 1B vs 2A
        groups[3].standings[0].playerName, groups[2].standings[1].playerName, // 1D vs 2C
        groups[5].standings[0].playerName, groups[4].standings[1].playerName, // 1F vs 2E
        groups[7].standings[0].playerName, groups[6].standings[1].playerName, // 1H vs 2G
    ];

    // Use generateBracket without shuffling to map directly
    const playoffMatches = generateBracket(seeds, false, startMatchId);
    playoffMatches.forEach(m => m.stage = 'knockout');
    return playoffMatches;
}

/**
 * Create a new tournament
 */
export async function createTournament(data: {
    name: string;
    mode?: 'normal' | 'league';
    players: string[];
    tableIds: string[];
    status?: TournamentStatus;
}): Promise<IPoolTournamentDocument> {
    const status = data.status || 'pending';
    const mode = data.mode || 'normal';

    let matches: ITournamentMatch[] = [];
    let groups: ITournamentGroup[] = [];

    if (status !== 'draft') {
        if (mode === 'league') {
            const result = generateGroupStage(data.players);
            matches = result.matches;
            groups = result.groups;
        } else {
            matches = generateBracket(data.players);
        }
    }

    const tournament = await PoolTournament.create({
        name: data.name,
        mode,
        players: data.players,
        tableIds: data.tableIds,
        matches,
        groups: groups.length > 0 ? groups : undefined,
        status,
    });

    return tournament;
}

/**
 * Update a tournament (mainly for drafts)
 */
export async function updateTournament(id: string, data: {
    name?: string;
    mode?: 'normal' | 'league';
    players?: string[];
    tableIds?: string[];
}): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(id);
    if (!tournament) throw new ApiError(404, 'Tournament not found');
    if (tournament.status !== 'draft') throw new ApiError(400, 'Only drafts can be updated');

    if (data.name) tournament.name = data.name;
    if (data.mode) tournament.mode = data.mode;
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

    if (tournament.mode === 'league') {
        const result = generateGroupStage(tournament.players);
        tournament.matches = result.matches;
        tournament.groups = result.groups;
    } else {
        tournament.matches = generateBracket(tournament.players);
    }

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
 * Update players of a pending match
 */
export async function updateMatchPlayers(
    tournamentId: string,
    matchId: string,
    data: { player1Name?: string; player2Name?: string }
): Promise<IPoolTournamentDocument> {
    const tournament = await PoolTournament.findById(tournamentId);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) throw new ApiError(404, 'Match not found');

    if (match.status !== 'pending') {
        throw new ApiError(400, 'Can only edit players for a pending match');
    }

    // Process player additions to tournament roster if they are new
    const addedPlayers: string[] = [];

    if (data.player1Name !== undefined) {
        // Prevent setting identical names
        if (data.player1Name && data.player1Name === (data.player2Name ?? match.player2Name)) {
            throw new ApiError(400, 'Player names cannot be the same');
        }

        match.player1Name = data.player1Name || undefined; // allow removing a player (bye)

        // Add to main players list if new and truthy
        if (match.player1Name && !tournament.players.includes(match.player1Name)) {
            addedPlayers.push(match.player1Name);
        }
    }

    if (data.player2Name !== undefined) {
        if (data.player2Name && data.player2Name === (data.player1Name ?? match.player1Name)) {
            throw new ApiError(400, 'Player names cannot be the same');
        }

        match.player2Name = data.player2Name || undefined; // allow removing a player (bye)

        // Add to main players list if new and truthy
        if (match.player2Name && !tournament.players.includes(match.player2Name) && !addedPlayers.includes(match.player2Name)) {
            addedPlayers.push(match.player2Name);
        }
    }

    if (addedPlayers.length > 0) {
        tournament.players = [...tournament.players, ...addedPlayers];
    }

    // Automatically resolve "byes" if one player is missing after an edit and the other isn't
    if (match.player1Name && !match.player2Name) {
        match.status = 'bye';
        match.winnerName = match.player1Name;
    } else if (!match.player1Name && match.player2Name) {
        match.status = 'bye';
        match.winnerName = match.player2Name;
    } else if (match.player1Name && match.player2Name) {
        // Revert a bye if both are now filled
        match.status = 'pending';
        match.winnerName = undefined;
    }

    await tournament.save();
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

    if (match.stage === 'group' && match.groupId && tournament.groups) {
        // --- GROUP STAGE LOGIC ---
        const group = tournament.groups.find(g => g.id === match.groupId);
        if (group) {
            const p1Standing = group.standings.find(s => s.playerName === match.player1Name);
            const p2Standing = group.standings.find(s => s.playerName === match.player2Name);

            if (p1Standing && p2Standing) {
                p1Standing.played += 1;
                p2Standing.played += 1;

                p1Standing.framesFor += score1;
                p1Standing.framesAgainst += score2;
                p1Standing.frameDiff = p1Standing.framesFor - p1Standing.framesAgainst;

                p2Standing.framesFor += score2;
                p2Standing.framesAgainst += score1;
                p2Standing.frameDiff = p2Standing.framesFor - p2Standing.framesAgainst;

                if (winnerName === match.player1Name) {
                    p1Standing.wins += 1;
                    p1Standing.points += 1; // 1 point per win
                    if (!p1Standing.headToHead) p1Standing.headToHead = {};
                    p1Standing.headToHead[match.player2Name || ''] = (p1Standing.headToHead[match.player2Name || ''] || 0) + 1;
                } else if (winnerName === match.player2Name) {
                    p2Standing.wins += 1;
                    p2Standing.points += 1;
                    if (!p2Standing.headToHead) p2Standing.headToHead = {};
                    p2Standing.headToHead[match.player1Name || ''] = (p2Standing.headToHead[match.player1Name || ''] || 0) + 1;
                }

                // Check if this single group is fully completed
                const groupMatches = tournament.matches.filter(m => m.groupId === group.id);
                if (groupMatches.every(m => m.status === 'completed')) {
                    group.status = 'completed';
                }

                // Sort standings based on tie-breakers: Points > FrameDiff > FramesFor > HeadToHead
                group.standings.sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.frameDiff !== a.frameDiff) return b.frameDiff - a.frameDiff;
                    if (b.framesFor !== a.framesFor) return b.framesFor - a.framesFor;

                    const aBeatsB = a.headToHead?.[b.playerName] || 0;
                    const bBeatsA = b.headToHead?.[a.playerName] || 0;
                    return bBeatsA - aBeatsB;
                });

                // Check if all groups are completed
                if (tournament.groups.every(g => g.status === 'completed')) {
                    try {
                        const startMatchId = tournament.matches.length + 1;
                        const playoffMatches = generatePlayoffBracket(tournament.groups, startMatchId);
                        tournament.matches.push(...playoffMatches);
                    } catch (e) {
                        console.error('Failed to generate playoffs', e);
                    }
                }
            }
        }
    } else {
        // --- KNOCKOUT STAGE LOGIC ---
        // Move winner to next match if exists
        if (match.nextMatchId && match.nextMatchSlot) {
            const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
            if (nextMatch) {
                if (match.nextMatchSlot === 1) {
                    nextMatch.player1Name = winnerName;
                } else if (match.nextMatchSlot === 2) {
                    nextMatch.player2Name = winnerName;
                }
                // Handle BYEs in knockout spontaneously if opponent is missing?
                // Actually they are propagated during generateBracket, so usually we just wait for the other player.
            }
        } else {
            // This was the final!
            tournament.status = 'completed';
            tournament.winnerName = winnerName;
        }
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
    updateMatchPlayers,
};
