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

  useEffect(() => {
    api.get('/matches').then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const filtered =
    stage === 'ALL' ? matches : matches.filter((m) => m.stage === stage);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando partidos...</div>;
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
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
