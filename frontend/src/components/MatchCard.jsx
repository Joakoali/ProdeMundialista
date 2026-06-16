import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import { formatDate } from '../lib/utils';
import { goalscorerBadge } from '../lib/scorers';

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const isPredicted = match.predicted_home !== null && match.predicted_home !== undefined;
  const isLocked = match.status !== 'scheduled';
  const isDimmed = match.status === 'finished';
  const isPending = match.status === 'scheduled' && !isPredicted;
  const isFinished = match.status === 'finished';

  const scorerBadge =
    isFinished && isPredicted
      ? goalscorerBadge(match.predicted_scorers, match.home_scorers, match.away_scorers)
      : null;

  return (
    <motion.div
      whileHover={!isLocked ? { backgroundColor: '#1A1A1A' } : {}}
      onClick={() => navigate(`/match/${match.id}`)}
      className={`relative border-b border-elevated py-4 cursor-pointer transition-colors ${
        isDimmed ? 'opacity-50' : ''
      }`}
    >
      {isPending && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green" />
      )}
      <div className={`flex items-center justify-between ${isPending ? 'pl-3' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm truncate">{match.home_team}</span>
            <span className="text-secondary text-xs flex-shrink-0">vs</span>
            <span className="font-bold text-sm truncate">{match.away_team}</span>
          </div>
          <span className="text-secondary text-xs">{formatDate(match.kickoff_at)}</span>
        </div>

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4">
          <div className="flex items-center gap-2">
            {isPredicted && (
              <span className="text-secondary text-xs tabular-nums">
                {match.predicted_home}–{match.predicted_away}
              </span>
            )}
            {isFinished && match.home_score != null && (
              <span className="text-green font-bold text-sm tabular-nums">
                {match.home_score}–{match.away_score}
              </span>
            )}
            {isFinished && match.points_earned != null && (
              <span className="text-green text-xs font-bold">
                +{match.points_earned}
              </span>
            )}
            <Badge status={match.status} />
          </div>
          {scorerBadge && (
            <span className="text-green text-xs">{scorerBadge}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
