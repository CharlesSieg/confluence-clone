export default function Toolbar({ editor, onShowVersions }) {
  if (!editor) return null;

  const items = [
    {
      icon: 'B',
      title: 'Bold (⌘B)',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: 'I',
      title: 'Italic (⌘I)',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
      style: { fontStyle: 'italic' },
    },
    {
      icon: 'U',
      title: 'Underline (⌘U)',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
      style: { textDecoration: 'underline' },
    },
    {
      icon: 'S',
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
      style: { textDecoration: 'line-through' },
    },
    {
      icon: 'M',
      title: 'Highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
      style: { background: '#fef08a', padding: '0 2px', borderRadius: '2px' },
    },
    'divider',
    {
      icon: 'H1',
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
      style: { fontSize: '12px', fontWeight: 700 },
    },
    {
      icon: 'H2',
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
      style: { fontSize: '11px', fontWeight: 600 },
    },
    {
      icon: 'H3',
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
      style: { fontSize: '11px', fontWeight: 600 },
    },
    'divider',
    {
      icon: '•',
      title: 'Bullet list',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      icon: '1.',
      title: 'Ordered list',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
      style: { fontSize: '11px' },
    },
    {
      icon: '☑',
      title: 'Task list',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList'),
    },
    'divider',
    {
      icon: '❝',
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      icon: '</>',
      title: 'Code block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock'),
      style: { fontSize: '10px', fontFamily: 'var(--font-mono)' },
    },
    {
      icon: '—',
      title: 'Horizontal rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    'divider',
    {
      icon: '🔗',
      title: 'Add link',
      action: () => {
        const url = window.prompt('Enter URL');
        if (url) {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
      },
      isActive: () => editor.isActive('link'),
    },
    {
      icon: '📷',
      title: 'Add image',
      action: () => {
        const url = window.prompt('Enter image URL');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    },
    {
      icon: '▦',
      title: 'Insert table',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    'divider',
    {
      icon: '↩',
      title: 'Undo (⌘Z)',
      action: () => editor.chain().focus().undo().run(),
    },
    {
      icon: '↪',
      title: 'Redo (⌘⇧Z)',
      action: () => editor.chain().focus().redo().run(),
    },
    'divider',
    {
      icon: '🕓',
      title: 'Version history',
      action: onShowVersions,
    },
  ];

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      {items.map((item, i) => {
        if (item === 'divider') {
          return <div key={i} className="toolbar-divider" />;
        }
        return (
          <button
            key={i}
            className={`toolbar-btn${item.isActive?.() ? ' active' : ''}`}
            onClick={item.action}
            title={item.title}
            style={item.style}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
