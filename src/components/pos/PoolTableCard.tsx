import { PoolTable } from '@/types';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Timer, DollarSign, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/contexts/AppContext';

interface PoolTableCardProps {
  table: PoolTable;
  onClick?: () => void;
  selected?: boolean;
}

export const PoolTableCard = ({ table, onClick, selected }: PoolTableCardProps) => {
  const { t, language } = useApp();
  const session = table.currentSession;

  return (
    <div
      onClick={onClick}
      className={cn(
        'pos-card-interactive flex flex-col gap-3 border-2 transition-all duration-200',
        table.status === 'available'
          ? 'border-pool/50 hover:border-pool'
          : 'border-status-occupied/50 hover:border-status-occupied',
        selected && 'ring-2 ring-pool ring-offset-2'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pool/10">
            <Circle className="h-6 w-6 text-pool" fill="currentColor" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground">
              {t('Pool', 'Billard', 'بلياردو')} #{table.number}
            </span>
            <p className="text-sm text-muted-foreground">
              {table.pricePerPiece.toFixed(2)} DH / {t('piece', 'pièce', 'قطعة')}
            </p>
          </div>
        </div>
        <StatusBadge status={table.status} size="sm" language={language} />
      </div>

      {/* Session Info */}
      {session && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize text-foreground">
              {session.type === 'pieces' ? t('Pieces Mode', 'Mode Pièces', 'وضع القطع') : t('Challenge Mode', 'Mode Défi', 'وضع التحدي')}
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>{formatDistanceToNow(session.startedAt, { addSuffix: false })}</span>
            </div>
          </div>

          {/* Pieces info */}
          {session.type === 'pieces' && session.pieces && (
            <div className="text-sm text-muted-foreground">
              {session.pieces.reduce((sum, p) => sum + p.count, 0)} {t('pieces', 'pièces', 'قطع')}
            </div>
          )}

          {/* Challenge info */}
          {session.type === 'challenge' && session.challenge && (
            <div className="text-sm text-muted-foreground">
              {session.challenge.player1Name} vs {session.challenge.player2Name}
              <br />
              {session.challenge.player1Score} - {session.challenge.player2Score}
            </div>
          )}

          {/* Total */}
          <div className="flex items-center gap-1 text-lg font-bold text-foreground">
            <span>{session.totalCost.toFixed(2)} DH</span>
          </div>
        </div>
      )}

      {/* Available state */}
      {!session && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          {t('Ready to play', 'Prêt à jouer', 'جاهز لللعب')}
        </div>
      )}
    </div>
  );
};
