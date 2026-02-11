import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Toolbar from './Toolbar';
import Breadcrumbs from './Breadcrumbs';
import VersionHistory from './VersionHistory';

const lowlight = createLowlight(common);

export default function EditorView({ page, pages, onUpdate, onSelect }) {
  const [title, setTitle] = useState(page.title);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showVersions, setShowVersions] = useState(false);
  const saveTimeout = useRef(null);
  const titleRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: page.content || '',
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      debouncedSave(page.id, { content: editor.getHTML() });
    },
  });

  const debouncedSave = useCallback((id, data) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onUpdate(id, data);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  }, [onUpdate]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');
    debouncedSave(page.id, { title: newTitle });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus('start');
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const handleRestoreVersion = useCallback(async (version) => {
    setTitle(version.title);
    editor?.commands.setContent(version.content || '');
    setSaveStatus('unsaved');
    debouncedSave(page.id, { title: version.title, content: version.content || '' });
    setShowVersions(false);
  }, [editor, page.id, debouncedSave]);

  return (
    <>
      <Breadcrumbs page={page} pages={pages} onSelect={onSelect} />
      <Toolbar editor={editor} onShowVersions={() => setShowVersions(true)} />
      <div className="editor-area">
        <input
          ref={titleRef}
          className="page-title-input"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          data-testid="page-title-input"
        />
        <div className="page-meta">
          <span>
            Last updated: {new Date(page.updated_at).toLocaleString()}
          </span>
          <span
            className={`save-indicator ${saveStatus}`}
            data-testid="save-status"
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
              ? 'Saved'
              : saveStatus === 'error'
              ? 'Save failed'
              : 'Unsaved changes'}
          </span>
        </div>
        <EditorContent editor={editor} data-testid="editor-content" />
      </div>
      {showVersions && (
        <VersionHistory
          pageId={page.id}
          onClose={() => setShowVersions(false)}
          onRestore={handleRestoreVersion}
        />
      )}
    </>
  );
}
