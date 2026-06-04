import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalscorerPicker({ selectedScorers, onChange, disabled }) {
  const [input, setInput] = useState('');

  const addScorer = () => {
    const name = input.trim();
    if (!name) return;
    onChange([...selectedScorers, name]);
    setInput('');
  };

  const removeAt = (index) => {
    onChange(selectedScorers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addScorer();
    }
  };

  return (
    <div className="mt-8">
      <p className="text-secondary text-xs uppercase tracking-wider mb-4">
        Goleadores <span className="normal-case">(opcional)</span>
      </p>

      {!disabled && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nombre del jugador"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-surface border border-elevated text-primary placeholder:text-secondary px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
          <button
            type="button"
            onClick={addScorer}
            className="px-4 py-2 border border-elevated text-secondary text-lg hover:text-primary hover:border-secondary transition-colors"
          >
            +
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {selectedScorers.map((name, idx) => (
            <motion.div
              key={`${name}-${idx}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1 border border-green text-green text-xs px-3 py-1.5"
            >
              <span>{name}</span>
              {!disabled && (
                <button
                  onClick={() => removeAt(idx)}
                  className="ml-1 text-green hover:text-red transition-colors"
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedScorers.length === 0 && disabled && (
        <p className="text-secondary text-xs">Sin goleadores predichos.</p>
      )}
    </div>
  );
}
