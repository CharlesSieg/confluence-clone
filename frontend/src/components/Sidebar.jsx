import { useState, useMemo } from 'react';

function buildTree(pages) {
  const map = {};
  const roots = [];
  pages.forEach((p) => {
    map[p.id] = { ...p, children: [] };
  });
  pages.forEach((p) => {
    if (p.parent_id && map[p.parent_id]) {
      map[p.parent_id].children.push(map[p.id]);
    } else {
      roots.push(map[p.id]);
    }
  });
  return roots;
}

function TreeNode({ node, activePage, onSelect, onCreate, onDelete, depth = 0, expanded, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.id];

  return (
    <div>
      <div
        className={`tree-item${activePage === node.id ? ' active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(node.id)}
        data-testid={`tree-item-${node.id}`}
      >
        <span
          className={`tree-toggle${hasChildren ? '' : ' empty'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(node.id);
          }}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </span>
        <span className="tree-icon">{node.icon || '📄'}</span>
        <span className="tree-title">{node.title || 'Untitled'}</span>
        <span className="tree-item-actions">
          <button
            title="Add child page"
            onClick={(e) => {
              e.stopPropagation();
              onCreate(node.id);
            }}
          >
            +
          </button>
          <button
            className="danger"
            title="Delete page"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${node.title}"?`)) {
                onDelete(node.id);
              }
            }}
          >
            ×
          </button>
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activePage={activePage}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              depth={depth + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ pages, activePage, onSelect, onCreate, onDelete, onOpenCommandPalette }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const tree = useMemo(() => buildTree(pages), [pages]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const q = searchQuery.toLowerCase();
    const matchingIds = new Set();
    pages.forEach((p) => {
      if (p.title.toLowerCase().includes(q)) {
        matchingIds.add(p.id);
        // Also include all ancestors
        let current = p;
        while (current.parent_id) {
          matchingIds.add(current.parent_id);
          current = pages.find((pp) => pp.id === current.parent_id);
          if (!current) break;
        }
      }
    });
    function filterTree(nodes) {
      return nodes
        .filter((n) => matchingIds.has(n.id))
        .map((n) => ({
          ...n,
          children: filterTree(n.children),
        }));
    }
    return filterTree(tree);
  }, [tree, searchQuery, pages]);

  return (
    <div className="sidebar" data-testid="sidebar">
      <div className="sidebar-header">
        <h1>📚 Knowledge Base</h1>
        <div className="sidebar-actions">
          <button title="Search (⌘K)" onClick={onOpenCommandPalette}>
            🔍
          </button>
          <button title="New page" onClick={() => onCreate(null)} data-testid="new-page-btn">
            ＋
          </button>
        </div>
      </div>
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Filter pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="sidebar-search"
        />
      </div>
      <div className="page-tree" data-testid="page-tree">
        {filteredTree.length === 0 ? (
          <div className="page-tree-empty">
            {pages.length === 0
              ? 'No pages yet. Click + to create one.'
              : 'No matching pages.'}
          </div>
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              activePage={activePage}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))
        )}
      </div>
    </div>
  );
}
