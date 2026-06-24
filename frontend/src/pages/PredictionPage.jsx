import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import ScorePicker from '../components/ScorePicker';
import GoalscorerPicker from '../components/GoalscorerPicker';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';
import { goalscorerBadge } from '../lib/scorers';

export default function PredictionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [squads, setSquads] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const redirectTimerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/matches/${id}`),
      api.get(`/matches/${id}/squads`),
    ])
      .then(([matchRes, squadsRes]) => {
        setMatchData(matchRes);
        setSquads(squadsRes);
        if (matchRes.prediction) {
          setHomeScore(matchRes.prediction.predicted_home);
          setAwayScore(matchRes.prediction.predicted_away);
          setScorers(matchRes.prediction.predicted_scorers || []);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar el partido');
      });
  }, [id]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  if (!matchData && !error) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  if (error && !matchData) {
    return <div className="text-red text-sm">{error}</div>;
  }

  const isLocked = matchData.status !== 'scheduled';
  const isFinished = matchData.status === 'finished';

  const scorerBadge = isFinished
    ? goalscorerBadge(
        matchData.prediction?.predicted_scorers,
        matchData.home_scorers,
        matchData.away_scorers
      )
    : null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post('/predictions', {
        match_id: id,
        predicted_home: homeScore,
        predicted_away: awayScore,
        predicted_scorers: scorers,
      });
      setSaved(true);
      redirectTimerRef.current = setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="text-secondary text-xs mb-6 hover:text-primary transition-colors"
      >
        ← Volver
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">
            {matchData.home_team} vs {matchData.away_team}
          </h2>
          <p className="text-secondary text-xs mt-1">
            {formatDate(matchData.kickoff_at)}
          </p>
        </div>
        <Badge status={matchData.status} />
      </div>

      {isLocked && matchData.status === 'live' && (
        <p className="text-yellow text-xs mt-4">Partido en juego — predicción cerrada.</p>
      )}

      {isFinished && (
        <div className="text-center mt-6 mb-4">
          <p className="text-secondary text-xs mb-1">Resultado final</p>
          <p className="text-green text-3xl font-bold tabular-nums">
            {matchData.home_score} – {matchData.away_score}
          </p>
          {matchData.prediction && (
            <p className="text-secondary text-xs mt-2">
              Tu predicción: {matchData.prediction.predicted_home}–{matchData.prediction.predicted_away}
            </p>
          )}
          {(scorerBadge || matchData.prediction?.points_earned != null) && (
            <p className="text-green text-xs mt-1">
              {[
                scorerBadge,
                matchData.prediction?.points_earned != null
                  ? `+${matchData.prediction.points_earned} pts`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      <div className={isLocked ? 'opacity-50 pointer-events-none' : ''}>
        <ScorePicker
          homeScore={homeScore}
          awayScore={awayScore}
          onHomeChange={setHomeScore}
          onAwayChange={setAwayScore}
          disabled={isLocked}
        />

        <div className="flex justify-center gap-16 text-xs text-secondary -mt-4 mb-8">
          <span>{matchData.home_team}</span>
          <span>{matchData.away_team}</span>
        </div>

        <GoalscorerPicker
          selectedScorers={scorers}
          onChange={setScorers}
          disabled={isLocked}
          homeSquad={squads?.home}
          awaySquad={squads?.away}
        />
      </div>

      {!isLocked && (
        <div className="mt-10">
          {error && <p className="text-red text-xs mb-3">{error}</p>}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              saved
                ? 'bg-green text-base'
                : 'bg-surface border border-elevated text-primary hover:bg-elevated'
            }`}
          >
            {saved
              ? '✓ Predicción guardada'
              : saving
              ? 'Guardando...'
              : matchData.prediction
              ? 'Actualizar predicción'
              : 'Confirmar predicción'}
          </motion.button>
        </div>
      )}
    </div>
  );
}
