'use client'

import { useCallback, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
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
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

interface RichTextEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-secondary/50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('bold') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('italic') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Heading"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('bulletList') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('orderedList') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('blockquote') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', editor.isActive('codeBlock') ? 'bg-white/10 text-primary' : 'text-muted-foreground')}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Add Image */}
      <ImageUploadButton editor={editor} />

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-white/10 transition-colors text-muted-foreground"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-white/10 transition-colors text-muted-foreground"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

function ImageUploadButton({ editor }: { editor: Editor | null }) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = useCallback(async (file: File) => {
    if (!editor) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      // Insert image at current position
      editor.chain().focus().setImage({ src: data.url }).run()
      toast('Image uploaded', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }, [editor, toast])

  return (
    <label className="p-2 rounded hover:bg-white/10 transition-colors text-muted-foreground cursor-pointer">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading || !editor}
        className="hidden"
        id="image-upload"
      />
      <button
        type="button"
        onClick={() => document.getElementById('image-upload')?.click()}
        disabled={uploading || !editor}
        className={cn('p-2 rounded hover:bg-white/10 transition-colors', uploading ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground')}
        title={uploading ? 'Uploading...' : 'Add Image'}
      >
        <ImageIcon className="w-4 h-4" />
        {uploading && <span className="ml-1 text-xs">Uploading...</span>}
      </button>
    </label>
  )
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
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