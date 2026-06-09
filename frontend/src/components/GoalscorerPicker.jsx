import { motion, AnimatePresence } from 'framer-motion';

function countOccurrences(arr) {
  return arr.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

function TeamSection({ teamName, players, scorerCounts, onAdd, onRemove, disabled }) {
  return (
    <div>
      <p className="text-secondary text-xs uppercase tracking-wider mb-3">{teamName}</p>
      {players.length === 0 ? (
        <p className="text-secondary text-xs italic">Sin plantel disponible.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((player) => {
            const count = scorerCounts[player] || 0;
            const selected = count > 0;
            return (
              <motion.button
                key={player}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onAdd(player)}
                whileTap={disabled ? undefined : { scale: 0.93 }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-default ${
                  selected
                    ? 'border-green text-green'
                    : 'border-elevated text-secondary hover:border-secondary hover:text-primary'
                }`}
              >
                <span>{player}</span>
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-0.5"
                    >
                      <span className="font-bold text-green">{count}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRemove(player); }}
                          className="text-green hover:text-red transition-colors leading-none ml-0.5"
                        >
                          ×
                        </button>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GoalscorerPicker({ selectedScorers, onChange, disabled, homeSquad, awaySquad }) {
  const scorerCounts = countOccurrences(selectedScorers);

  const addScorer = (name) => onChange([...selectedScorers, name]);

  const removeOne = (name) => {
    const idx = selectedScorers.lastIndexOf(name);
    if (idx === -1) return;
    onChange(selectedScorers.filter((_, i) => i !== idx));
  };

  const homePlayers = homeSquad?.players ?? [];
  const awayPlayers = awaySquad?.players ?? [];

  return (
    <div className="mt-8 space-y-6">
      <p className="text-secondary text-xs uppercase tracking-wider">
        Goleadores <span className="normal-case">(opcional)</span>
      </p>

      <TeamSection
        teamName={homeSquad?.team ?? 'Local'}
        players={homePlayers}
        scorerCounts={scorerCounts}
        onAdd={addScorer}
        onRemove={removeOne}
        disabled={disabled}
      />

      <TeamSection
        teamName={awaySquad?.team ?? 'Visitante'}
        players={awayPlayers}
        scorerCounts={scorerCounts}
        onAdd={addScorer}
        onRemove={removeOne}
        disabled={disabled}
      />

      {selectedScorers.length === 0 && disabled && (
        <p className="text-secondary text-xs">Sin goleadores predichos.</p>
      )}
    </div>
  );
}
