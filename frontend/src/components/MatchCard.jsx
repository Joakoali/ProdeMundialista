import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import { formatDate } from '../lib/utils';

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const isPredicted =
    match.predicted_home !== null && match.predicted_home !== undefined;
  const isLocked = match.status !== 'scheduled';
  const isDimmed = match.status === 'finished';

  return (
    <motion.div
      whileHover={!isLocked ? { backgroundColor: '#1A1A1A' } : {}}
      onClick={() => navigate(`/match/${match.id}`)}
      className={`border-b border-elevated py-4 cursor-pointer transition-colors ${
        isDimmed ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm truncate">{match.home_team}</span>
            <span className="text-secondary text-xs flex-shrink-0">vs</span>
            <span className="font-bold text-sm truncate">{match.away_team}</span>
          </div>
          <span className="text-secondary text-xs">{formatDate(match.kickoff_at)}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {isPredicted && (
            <span className="text-secondary text-xs tabular-nums">
              {match.predicted_home}–{match.predicted_away}
            </span>
          )}
          {match.status === 'finished' && match.points_earned !== null && (
            <span className="text-green text-sm font-bold tabular-nums">
              +{match.points_earned}
            </span>
          )}
          <Badge status={match.status} />
        </div>
      </div>
    </motion.div>
  );
}
