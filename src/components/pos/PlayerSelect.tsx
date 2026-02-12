import { useState, useEffect, useRef } from 'react';
import { useSearchPlayers } from '@/hooks/usePoolTables';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

interface PlayerSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    className?: string;
}

export const PlayerSelect = ({ value, onChange, placeholder, id, className }: PlayerSelectProps) => {
    const { t } = useApp();
    const [searchValue, setSearchValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: players = [], isLoading } = useSearchPlayers(searchValue);

    useEffect(() => {
        setSearchValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelectPlayer = (playerName: string) => {
        setSearchValue(playerName);
        onChange(playerName);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <Input
                id={id}
                value={searchValue}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder || t('Player Name', 'Nom du joueur', 'اسم اللاعب')}
                autoComplete="off"
                className="touch-target"
            />

            {isOpen && (searchValue.length >= 2) && (isLoading || players.length > 0) && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
                    {isLoading ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {t('Searching...', 'Recherche...', 'بحث...')}
                        </div>
                    ) : players.length > 0 ? (
                        players.map((player) => (
                            <button
                                key={player.id}
                                type="button"
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                onClick={() => handleSelectPlayer(player.name)}
                            >
                                {player.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {player.wins}W / {player.losses}L
                                </span>
                            </button>
                        ))
                    ) : null}
                </div>
            )}
        </div>
    );
};
