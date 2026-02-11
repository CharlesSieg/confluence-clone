import { useState, useEffect, useRef, useMemo } from 'react';

export default function CommandPalette({ pages, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const actions = [
      { type: 'action', id: 'create', icon: '➕', title: 'Create new page', shortcut: '' },
    ];

    const q = query.toLowerCase().trim();
    const pageResults = pages
      .filter((p) => !q || p.title.toLowerCase().includes(q))
      .slice(0, 10)
      .map((p) => ({
        type: 'page',
        id: p.id,
        icon: p.icon || '📄',
        title: p.title || 'Untitled',
      }));

    if (!q) {
      return [...actions, ...pageResults];
    }
    return [...pageResults, ...actions.filter((a) => a.title.toLowerCase().includes(q))];
  }, [pages, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    if (item.type === 'page') {
      onSelect('navigate', { id: item.id });
    } else if (item.id === 'create') {
      onSelect('create');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose} data-testid="command-palette">
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pages or type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="command-palette-input"
        />
        <div className="command-palette-results">
          {results.length === 0 ? (
            <div className="command-palette-empty">No results found</div>
          ) : (
            results.map((item, i) => (
              <div
                key={item.id}
                className={`command-palette-item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => handleSelect(item)}
                data-testid={`command-palette-item-${item.id}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="title">{item.title}</span>
                {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
