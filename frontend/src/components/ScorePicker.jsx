import { AnimatePresence, motion } from 'framer-motion';

function ScoreDigit({ value }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ scale: 1.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="text-6xl font-bold tabular-nums w-16 text-center inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export default function ScorePicker({
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  disabled,
}) {
  if (disabled) {
    return (
      <div className="flex items-center justify-center gap-8 py-10">
        <span className="text-6xl font-bold tabular-nums">{homeScore}</span>
        <span className="text-secondary text-3xl">–</span>
        <span className="text-6xl font-bold tabular-nums">{awayScore}</span>
      </div>
    );
  }

  const btn = 'w-9 h-9 flex items-center justify-center text-secondary hover:text-primary transition-colors text-2xl leading-none';

  return (
    <div className="flex items-center justify-center gap-8 py-10">
      <div className="flex flex-col items-center gap-3">
        <button className={btn} onClick={() => onHomeChange(homeScore + 1)}>+</button>
        <ScoreDigit value={homeScore} />
        <button className={btn} onClick={() => onHomeChange(Math.max(0, homeScore - 1))}>−</button>
      </div>

      <span className="text-secondary text-3xl">–</span>

      <div className="flex flex-col items-center gap-3">
        <button className={btn} onClick={() => onAwayChange(awayScore + 1)}>+</button>
        <ScoreDigit value={awayScore} />
        <button className={btn} onClick={() => onAwayChange(Math.max(0, awayScore - 1))}>−</button>
      </div>
    </div>
  );
}
