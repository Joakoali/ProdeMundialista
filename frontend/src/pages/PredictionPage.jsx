import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import ScorePicker from '../components/ScorePicker';
import GoalscorerPicker from '../components/GoalscorerPicker';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/matches/${id}`),
      api.get(`/matches/${id}/squads`),
    ]).then(([matchRes, squadsRes]) => {
      setMatchData(matchRes);
      setSquads(squadsRes);
      if (matchRes.prediction) {
        setHomeScore(matchRes.prediction.predicted_home);
        setAwayScore(matchRes.prediction.predicted_away);
        setScorers(matchRes.prediction.predicted_scorers || []);
      }
    });
  }, [id]);

  if (!matchData) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  const isLocked = matchData.status !== 'scheduled';

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
      setTimeout(() => setSaved(false), 2500);
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
      {isLocked && matchData.status === 'finished' && (
        <p className="text-secondary text-xs mt-4">
          Resultado final:{' '}
          <span className="text-primary font-bold">
            {matchData.home_score}–{matchData.away_score}
          </span>
          {matchData.prediction?.points_earned !== null &&
            matchData.prediction?.points_earned !== undefined && (
              <span className="text-green font-bold ml-2">
                +{matchData.prediction.points_earned} pts
              </span>
            )}
        </p>
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
