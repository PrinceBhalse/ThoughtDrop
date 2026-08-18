'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Heading2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-secondary/50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('bold') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('italic') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('bulletList') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('orderedList') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('blockquote') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('codeBlock') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-white/10 transition-colors text-muted-foreground"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-white/10 transition-colors text-muted-foreground"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText())
    },
  })

  return (
    <div className="border border-white/10 rounded-lg bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
