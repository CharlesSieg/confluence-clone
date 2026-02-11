import { useMemo } from 'react';

export default function Breadcrumbs({ page, pages, onSelect }) {
  const trail = useMemo(() => {
    const result = [];
    let current = page;
    while (current) {
      result.unshift({ id: current.id, title: current.title });
      if (current.parent_id) {
        current = pages.find((p) => p.id === current.parent_id);
      } else {
        break;
      }
    }
    return result;
  }, [page, pages]);

  if (trail.length <= 1) return null;

  return (
    <div className="breadcrumbs" data-testid="breadcrumbs">
      {trail.map((item, i) => (
        <span key={item.id}>
          {i > 0 && <span className="separator"> / </span>}
          <span
            onClick={() => onSelect(item.id)}
            style={i === trail.length - 1 ? { fontWeight: 500, color: 'var(--color-text)' } : {}}
          >
            {item.title || 'Untitled'}
          </span>
        </span>
      ))}
    </div>
  );
}
