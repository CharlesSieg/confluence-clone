import { useState, useEffect } from 'react';
import { api } from '../api';

export default function VersionHistory({ pageId, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVersions(pageId)
      .then(setVersions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleRestore = async (versionId) => {
    try {
      const version = await api.getVersion(pageId, versionId);
      onRestore(version);
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  };

  return (
    <div className="version-panel" data-testid="version-panel">
      <div className="version-panel-header">
        <span>Version History</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="version-list">
        {loading ? (
          <div className="command-palette-empty">Loading...</div>
        ) : versions.length === 0 ? (
          <div className="command-palette-empty">No previous versions</div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className="version-item"
              onClick={() => handleRestore(v.id)}
              data-testid={`version-item-${v.id}`}
            >
              <div className="version-title">{v.title}</div>
              <div className="version-date">
                {new Date(v.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
