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
}

export interface IPoolTournament {
    name: string;
    status: TournamentStatus;
    players: string[];
    tableIds: mongoose.Types.ObjectId[];
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
