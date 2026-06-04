import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile').then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  const { user, predictions, stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: user.avatar_color }}
        />
        <div>
          <h1 className="text-xl font-bold">{user.username}</h1>
          <p className="text-secondary text-xs">
            Desde {new Date(user.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-surface p-4">
          <p className="text-green text-2xl font-bold tabular-nums">
            {stats.total_points}
          </p>
          <p className="text-secondary text-xs mt-1">Puntos</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-primary text-2xl font-bold tabular-nums">
            {stats.total_predictions}
          </p>
          <p className="text-secondary text-xs mt-1">Predicciones</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-primary text-2xl font-bold tabular-nums">
            {stats.exact_results}
          </p>
          <p className="text-secondary text-xs mt-1">Exactos</p>
        </div>
      </div>

      <p className="text-secondary text-xs uppercase tracking-wider mb-4">
        Historial
      </p>

      {predictions.length === 0 && (
        <p className="text-secondary text-sm">
          Todavía no predijiste ningún partido.
        </p>
      )}

      <div>
        {predictions.map((pred) => {
          const isFinished = pred.status === 'finished';
          const isExact =
            isFinished &&
            pred.predicted_home === pred.home_score &&
            pred.predicted_away === pred.away_score;

          return (
            <div key={pred.id} className="border-b border-elevated py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {pred.home_team} vs {pred.away_team}
                  </p>
                  <p className="text-secondary text-xs mt-0.5">
                    {formatDate(pred.kickoff_at)}
                  </p>
                </div>
                {isFinished && pred.points_earned !== null && (
                  <span className="text-green font-bold text-sm tabular-nums">
                    +{pred.points_earned} pts
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-secondary text-xs">
                  Tu predicción:{' '}
                  <span className="text-primary tabular-nums">
                    {pred.predicted_home}–{pred.predicted_away}
                  </span>
                </span>
                {isFinished && pred.home_score !== null && (
                  <span className="text-secondary text-xs">
                    Resultado:{' '}
                    <span
                      className={`tabular-nums ${isExact ? 'text-green' : 'text-primary'}`}
                    >
                      {pred.home_score}–{pred.away_score}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
