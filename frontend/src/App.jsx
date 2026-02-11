import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import EditorView from './components/EditorView';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [activePageData, setActivePageData] = useState(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPages = useCallback(async () => {
    try {
      const data = await api.getPages();
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (!activePage) {
      setActivePageData(null);
      return;
    }
    let cancelled = false;
    api.getPage(activePage).then((data) => {
      if (!cancelled) setActivePageData(data);
    }).catch(() => {
      if (!cancelled) {
        setActivePage(null);
        setActivePageData(null);
      }
    });
    return () => { cancelled = true; };
  }, [activePage]);

  const handleCreatePage = useCallback(async (parentId = null) => {
    try {
      const page = await api.createPage({ title: 'Untitled', parent_id: parentId });
      await loadPages();
      setActivePage(page.id);
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  }, [loadPages]);

  const handleDeletePage = useCallback(async (id) => {
    try {
      await api.deletePage(id);
      if (activePage === id) {
        setActivePage(null);
        setActivePageData(null);
      }
      await loadPages();
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  }, [activePage, loadPages]);

  const handleUpdatePage = useCallback(async (id, data) => {
    try {
      const updated = await api.updatePage(id, data);
      setActivePageData(updated);
      // Refresh sidebar to update titles
      if (data.title !== undefined) {
        await loadPages();
      }
    } catch (err) {
      console.error('Failed to update page:', err);
    }
  }, [loadPages]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCommandSelect = useCallback((action, data) => {
    setShowCommandPalette(false);
    if (action === 'navigate') {
      setActivePage(data.id);
    } else if (action === 'create') {
      handleCreatePage();
    }
  }, [handleCreatePage]);

  return (
    <div className="app">
      <Sidebar
        pages={pages}
        activePage={activePage}
        onSelect={setActivePage}
        onCreate={handleCreatePage}
        onDelete={handleDeletePage}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />
      <div className="main-content">
        {activePageData ? (
          <EditorView
            key={activePageData.id}
            page={activePageData}
            pages={pages}
            onUpdate={handleUpdatePage}
            onSelect={setActivePage}
          />
        ) : (
          <div className="main-empty">
            <div className="icon">📚</div>
            <p>Select a page or create a new one</p>
            <p>
              Press <span className="shortcut">⌘K</span> to open command palette
            </p>
          </div>
        )}
      </div>
      {showCommandPalette && (
        <CommandPalette
          pages={pages}
          onSelect={handleCommandSelect}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
    </div>
  );
}
