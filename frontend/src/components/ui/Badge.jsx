const CONFIG = {
  scheduled: { label: 'Abierto', className: 'text-secondary border-elevated' },
  live: { label: 'En juego', className: 'text-yellow border-yellow' },
  finished: { label: 'Finalizado', className: 'text-secondary border-elevated' },
};

export default function Badge({ status }) {
  const c = CONFIG[status] || CONFIG.scheduled;
  return (
    <span className={`text-xs border px-2 py-0.5 ${c.className}`}>
      {c.label}
    </span>
  );
}
