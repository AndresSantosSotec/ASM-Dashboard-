"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Heading1,
  Heading2,
  Code,
  Quote,
  Undo,
  Redo,
  Eye,
  Variable,
} from 'lucide-react'
import { useState } from 'react'
import type { Variable as VariableType } from '@/services/plantillasMailing'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  variables?: VariableType[]
  placeholder?: string
}

export function RichTextEditor({ value, onChange, variables = [], placeholder = "Escribe aquí..." }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [searchVar, setSearchVar] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  const insertVariable = (variableName: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${variableName}}}`).run()
    }
  }

  const setLink = () => {
    const url = window.prompt('URL del enlace:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const filteredVariables = variables.filter(v =>
    v.nombre.toLowerCase().includes(searchVar.toLowerCase()) ||
    v.descripcion.toLowerCase().includes(searchVar.toLowerCase())
  )

  if (!editor) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Editor principal */}
      <div className="lg:col-span-3">
        <Card>
          {/* Barra de herramientas */}
          <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
            {/* Formato de texto */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Negrita (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Cursiva (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('underline') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Subrayado (Ctrl+U)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Encabezados */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Título 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Título 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Listas */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Lista con viñetas"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Lista numerada"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Alineación */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                title="Alinear izquierda"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                title="Centrar"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                title="Alinear derecha"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Otros */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                onClick={setLink}
                title="Insertar enlace"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Cita"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                title="Bloque de código"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            {/* Deshacer/Rehacer */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Deshacer (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Rehacer (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview */}
            <Button
              type="button"
              size="sm"
              variant={showPreview ? 'default' : 'ghost'}
              onClick={() => setShowPreview(!showPreview)}
              title="Vista previa"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Área de edición o preview */}
          <div className="min-h-[400px]">
            {showPreview ? (
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-2">Vista Previa:</div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                />
              </div>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </Card>
      </div>

      {/* Panel lateral de variables */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Variable className="h-4 w-4" />
              <span className="text-sm font-medium">Variables</span>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-2 py-1 text-sm border rounded"
              value={searchVar}
              onChange={(e) => setSearchVar(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-3 space-y-2">
              {filteredVariables.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {variables.length === 0 ? "No hay variables" : "Sin resultados"}
                </p>
              ) : (
                filteredVariables.map((variable) => (
                  <div
                    key={variable.nombre}
                    className="p-2 border rounded hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => insertVariable(variable.nombre)}
                    title={`Click para insertar {{${variable.nombre}}}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {variable.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {variable.descripcion}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {`{{${variable.nombre}}}`}
                    </Badge>
                    {variable.ejemplo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ej: {variable.ejemplo}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t bg-muted/50">
            <p className="text-xs text-muted-foreground">
              💡 Haz click en una variable para insertarla en el editor
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
