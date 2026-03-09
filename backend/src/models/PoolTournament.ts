// ============================================
// PoolTournament Model
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export type TournamentStatus = 'draft' | 'pending' | 'in_progress' | 'completed';

export interface ITournamentMatch {
    id: string;
    round: number;
    player1Name?: string;
    player2Name?: string;
    player1Score?: number;
    player2Score?: number;
    winnerName?: string;
    tableId?: string;
    sessionId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'bye';
    nextMatchId?: string; // ID of the match the winner moves to
    nextMatchSlot?: number; // 1 or 2
    label?: string; // e.g. "A", "B", "C"
    side?: 'left' | 'right' | 'center';
    stage?: 'group' | 'knockout'; // Added for league mode
    groupId?: string; // Corresponds to ITournamentGroup.id
}

export interface ITournamentGroup {
    id: string;
    name: string;
    players: string[];
    status: 'pending' | 'in_progress' | 'completed';
    standings: {
        playerName: string;
        played: number;
        wins: number;
        framesFor: number;
        framesAgainst: number;
        frameDiff: number;
        points: number;
        headToHead?: Record<string, number>; // Maps opponentName to result wins (e.g. 1 or 0)
    }[];
}

export interface IPoolTournament {
    name: string;
    mode: 'normal' | 'league';
    status: TournamentStatus;
    players: string[];
    tableIds: mongoose.Types.ObjectId[];
    groups?: ITournamentGroup[];
    matches: ITournamentMatch[];
    winnerName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPoolTournamentDocument extends IPoolTournament, Document { }

const tournamentMatchSchema = new Schema<ITournamentMatch>(
    {
        id: { type: String, required: true },
        round: { type: Number, required: true },
        player1Name: { type: String },
        player2Name: { type: String },
        player1Score: { type: Number, default: 0 },
        player2Score: { type: Number, default: 0 },
        winnerName: { type: String },
        tableId: { type: Schema.Types.ObjectId, ref: 'PoolTable' },
        sessionId: { type: Schema.Types.ObjectId, ref: 'PoolSession' },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'bye'],
            default: 'pending',
        },
        nextMatchId: { type: String },
        nextMatchSlot: { type: Number, enum: [1, 2] },
        label: { type: String },
        side: { type: String, enum: ['left', 'right', 'center'] },
        stage: { type: String, enum: ['group', 'knockout'], default: 'knockout' },
        groupId: { type: String },
    },
    { _id: false }
);

const tournamentGroupSchema = new Schema<ITournamentGroup>(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        players: [{ type: String, trim: true }],
        status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
        standings: [{
            playerName: { type: String, required: true },
            played: { type: Number, default: 0 },
            wins: { type: Number, default: 0 },
            framesFor: { type: Number, default: 0 },
            framesAgainst: { type: Number, default: 0 },
            frameDiff: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        }]
    },
    { _id: false }
);

const poolTournamentSchema = new Schema<IPoolTournamentDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mode: {
            type: String,
            enum: ['normal', 'league'],
            default: 'normal',
        },
        status: {
            type: String,
            enum: ['draft', 'pending', 'in_progress', 'completed'],
            default: 'draft',
        },
        players: [{ type: String, trim: true }],
        tableIds: [{
            type: Schema.Types.ObjectId,
            ref: 'PoolTable',
        }],
        groups: [tournamentGroupSchema],
        matches: [tournamentMatchSchema],
        winnerName: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

export const PoolTournament = mongoose.model<IPoolTournamentDocument>('PoolTournament', poolTournamentSchema);
export default PoolTournament;
