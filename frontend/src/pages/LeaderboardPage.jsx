import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [personalEntries, setPersonalEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isPersonalUser = PERSONAL_USERS.includes(currentUser.username);

  useEffect(() => {
    const fetches = [api.get('/leaderboard')];
    if (isPersonalUser) fetches.push(api.get('/leaderboard/personal'));

    Promise.all(fetches)
      .then(([main, personal]) => {
        setEntries(main);
        if (personal) setPersonalEntries(personal);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isPersonalUser]);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando ranking...</div>;
  }

  const myEntry = entries.find((e) => e.id === currentUser.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {isPersonalUser && personalEntries && (
        <div className="mb-8">
          <p className="text-secondary text-xs uppercase tracking-wider mb-3">
            Ranking chico · desde 25 jun
          </p>
          <div className="space-y-0">
            {personalEntries.map((entry) => {
              const isMe = entry.id === currentUser.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between py-3 border-b border-elevated ${
                    isMe ? 'border-green' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-secondary text-xs w-6 text-right">
                      #{entry.rank}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.avatar_color }}
                    />
                    <span className={`text-sm ${isMe ? 'font-medium' : ''}`}>
                      {entry.username}
                    </span>
                    {isMe && <span className="text-secondary text-xs">Vos</span>}
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
      )}

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
