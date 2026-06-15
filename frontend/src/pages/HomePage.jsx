import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import MatchCard from '../components/MatchCard';

const STAGES = [
  { key: 'ALL',            label: 'Todos' },
  { key: 'GROUP_STAGE',    label: 'Grupos' },
  { key: 'LAST_32',        label: '16avos' },
  { key: 'LAST_16',        label: 'Octavos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS',    label: 'Semis' },
  { key: 'THIRD_PLACE',    label: '3er puesto' },
  { key: 'FINAL',          label: 'Final' },
];

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [stage, setStage] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/matches')
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar los partidos');
        setLoading(false);
      });
  }, []);

  const filtered =
    stage === 'ALL' ? matches : matches.filter((m) => m.stage === stage);

  const sorted = [...filtered].sort((a, b) => {
    const aNeedsPred = a.status === 'scheduled' && a.predicted_home == null;
    const bNeedsPred = b.status === 'scheduled' && b.predicted_home == null;
    if (aNeedsPred !== bNeedsPred) return aNeedsPred ? -1 : 1;
    return new Date(a.kickoff_at) - new Date(b.kickoff_at);
  });

  if (loading) {
    return <div className="text-secondary text-sm">Cargando partidos...</div>;
  }

  if (error) {
    return <div className="text-red text-sm">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Partidos</h1>

      <div className="flex gap-6 mb-6 overflow-x-auto pb-1">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            className={`text-xs whitespace-nowrap transition-colors pb-1 ${
              stage === s.key
                ? 'text-primary border-b border-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-secondary text-sm">
          No hay partidos en esta fase todavía.
        </p>
      ) : (
        <div>
          {sorted.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
