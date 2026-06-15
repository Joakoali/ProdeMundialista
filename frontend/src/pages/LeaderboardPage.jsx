import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/leaderboard').then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando ranking...</div>;
  }

  const myEntry = entries.find((e) => e.id === currentUser.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {myEntry && (
        <div className="border border-green px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-secondary text-xs w-6 text-right">
              #{myEntry.rank}
            </span>
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: myEntry.avatar_color }}
            />
            <span className="text-sm font-medium">{myEntry.username}</span>
            <span className="text-secondary text-xs">Vos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-secondary text-xs">
              {myEntry.matches_predicted} partidos
            </span>
            <span className="text-green font-bold">
              {myEntry.total_points} pts
            </span>
          </div>
        </div>
      )}

      <div>
        {entries.map((entry) => {
          const isMe = entry.id === currentUser.id;
          const isLeader = entry.rank === 1;
          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between py-3 border-b border-elevated ${
                isMe ? 'opacity-30' : ''
              } ${isLeader ? 'bg-yellow/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs w-6 text-right ${isLeader ? 'text-yellow' : 'text-secondary'}`}>
                  #{entry.rank}
                </span>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.avatar_color }}
                />
                <span className="text-sm">{entry.username}</span>
                {isLeader && <span className="text-base leading-none">👑</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-secondary text-xs">
                  {entry.matches_predicted} partidos
                </span>
                <span className="text-green font-bold text-sm tabular-nums">
                  {entry.total_points} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
