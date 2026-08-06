'use client'

import { useState, useRef, useCallback } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension, Node } from '@tiptap/core'
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Image, Link, Link2Off, Undo2, Redo2,
  Type, Palette, Highlighter, Sigma, GripHorizontal, X, Minus, Plus, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import katex from 'katex'

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize,
          renderHTML: attrs => !attrs.fontSize ? {} : { style: `font-size: ${attrs.fontSize}` },
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display })
  } catch {
    return `<span class="text-red-500">${tex}</span>`
  }
}

const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      tex: { default: '' },
    }
  },
  parseHTML() { return [{ tag: 'span[data-math-inline]' }] },
  renderHTML({ node }) {
    return [
      'span',
      { 'data-math-inline': '', class: 'math-inline' },
      renderMath(node.attrs.tex, false),
    ]
  },
  addNodeView() {
    return ({ node }) => {
      const el = document.createElement('span')
      el.className = 'math-inline px-0.5'
      el.innerHTML = renderMath(node.attrs.tex, false)
      return { dom: el }
    }
  },
})

const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      tex: { default: '' },
    }
  },
  parseHTML() { return [{ tag: 'div[data-math-block]' }] },
  renderHTML({ node }) {
    return ['div', { 'data-math-block': '', class: 'math-block my-4 text-center' }, renderMath(node.attrs.tex, true)]
  },
  addNodeView() {
    return ({ node }) => {
      const el = document.createElement('div')
      el.className = 'math-block my-4 text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg'
      el.innerHTML = renderMath(node.attrs.tex, true)
      return { dom: el }
    }
  },
})

function ImageResizeView({ node, updateAttributes, editor, getPos }: any) {
  const [width, setWidth] = useState(node.attrs.width || '')
  const [height, setHeight] = useState(node.attrs.height || '')
  const imgRef = useRef<HTMLImageElement>(null)
  const startXRef = useRef(0)
  const startWRef = useRef(0)
  const dirRef = useRef('e')

  const selected = editor.isActive('image') && editor.state.selection.from <= getPos() && getPos() <= editor.state.selection.to

  const handleMouseDown = (e: React.MouseEvent, dir: string) => {
    e.preventDefault()
    e.stopPropagation()
    const img = imgRef.current || (e.target as HTMLElement).closest('.image-resize-wrapper')?.querySelector('img') as HTMLImageElement
    if (!img) return
    dirRef.current = dir
    startXRef.current = e.clientX
    startWRef.current = img.offsetWidth

    const onMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startXRef.current
      const newW = Math.max(50, startWRef.current + (dirRef.current === 'e' ? diff : -diff))
      setWidth(String(Math.round(newW)))
      updateAttributes({ width: String(Math.round(newW)) })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <NodeViewWrapper className="image-resize-wrapper inline-block relative group" draggable="true" data-drag-handle>
      <div className="relative inline-block" style={{ width: width || undefined }}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className={`max-w-full rounded border ${selected ? 'ring-2 ring-primary' : ''}`}
          style={{ width: width || 'auto', height: height || 'auto', display: 'block' }}
          draggable={false}
        />
        {selected && (
          <>
            <div className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'w')}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white border border-gray-400 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'e')}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white border border-gray-400 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}
      </div>
      {selected && (
        <div className="absolute -top-10 left-0 flex gap-1 bg-white dark:bg-gray-800 rounded shadow-lg p-1.5 border z-20">
          <label className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-xs" title="Replace image">
            <Image className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (ev) => updateAttributes({ src: ev.target?.result as string })
                reader.readAsDataURL(file)
              }
              e.target.value = ''
            }} />
          </label>
          <input type="number" value={width} onChange={(e) => { setWidth(e.target.value); updateAttributes({ width: e.target.value }) }} className="w-14 px-1 text-xs border rounded bg-transparent" placeholder="W" min="20" />
          <input type="number" value={height} onChange={(e) => { setHeight(e.target.value); updateAttributes({ height: e.target.value }) }} className="w-14 px-1 text-xs border rounded bg-transparent" placeholder="H" min="20" />
          <button onClick={() => editor.chain().focus().deleteSelection().run()} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 text-xs" title="Delete image">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  )
}

const CustomImage = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView)
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: el => el.getAttribute('width'), renderHTML: attrs => !attrs.width ? {} : { width: attrs.width } },
      height: { default: null, parseHTML: el => el.getAttribute('height'), renderHTML: attrs => !attrs.height ? {} : { height: attrs.height } },
    }
  },
})

interface RichTextEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48']

const MATH_SYMBOLS = [
  { cat: 'Greek', items: ['\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta', '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda', '\\mu', '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma', '\\tau', '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega', '\\Gamma', '\\Delta', '\\Theta', '\\Lambda', '\\Xi', '\\Pi', '\\Sigma', '\\Phi', '\\Psi', '\\Omega'] },
  { cat: 'Operators', items: ['+', '-', '\\times', '\\div', '\\pm', '\\mp', '\\cdot', '\\ast', '\\star', '\\circ', '\\bullet', '\\oplus', '\\otimes', '\\odot', '\\vee', '\\wedge', '\\cap', '\\cup', '\\subset', '\\supset', '\\subseteq', '\\supseteq', '\\in', '\\notin', '\\ni', '\\emptyset', '\\nabla', '\\partial', '\\propto', '\\infty'] },
  { cat: 'Relations', items: ['=', '<', '>', '\\leq', '\\geq', '\\equiv', '\\approx', '\\neq', '\\sim', '\\cong', '\\prec', '\\succ', '\\preceq', '\\succeq', '\\mid', '\\parallel', '\\perp'] },
  { cat: 'Arrows', items: ['\\to', '\\rightarrow', '\\Rightarrow', '\\leftarrow', '\\Leftarrow', '\\Leftrightarrow', '\\mapsto', '\\longmapsto', '\\nearrow', '\\searrow', '\\uparrow', '\\downarrow', '\\leftrightarrow', '\\rightleftharpoons'] },
  { cat: 'Integrals & Sums', items: ['\\int', '\\iint', '\\iiint', '\\oint', '\\sum', '\\prod', '\\coprod', '\\bigcup', '\\bigcap', '\\bigoplus', '\\bigotimes'] },
  { cat: 'Functions', items: ['\\sin', '\\cos', '\\tan', '\\cot', '\\sec', '\\csc', '\\log', '\\ln', '\\lim', '\\exp', '\\sinh', '\\cosh', '\\tanh', '\\arcsin', '\\arccos', '\\arctan', '\\sqrt', '\\sqrt[3]', '\\frac'] },
  { cat: 'Symbols', items: ['\\forall', '\\exists', '\\nexists', '\\angle', '\\measuredangle', '\\triangle', '\\square', '\\blacksquare', '\\spadesuit', '\\heartsuit', '\\clubsuit', '\\diamondsuit', '\\therefore', '\\because', '\\Box', '\\Diamond', '\\sharp', '\\natural', '\\flat', '\\prime', '\\hbar', '\\ell', '\\wp', '\\Re', '\\Im', '\\aleph', '\\partial'] },
  { cat: 'Brackets', items: ['(', ')', '[', ']', '\\{', '\\}', '\\langle', '\\rangle', '\\lceil', '\\rceil', '\\lfloor', '\\rfloor', '|', '\\|', '\\ulcorner', '\\urcorner'] },
]

function ToolbarButton({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active
        ? 'bg-primary/10 text-primary'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
}

function ColorPicker({ label, Icon, value, onChange }: { label: string; Icon: any; value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={label}
        className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-0.5"
      >
        <Icon className="w-3.5 h-3.5" />
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => { onChange(e.target.value); setOpen(false) }}
                className="w-8 h-8 p-0 border rounded cursor-pointer"
              />
              <button
                onClick={() => { onChange(''); setOpen(false) }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function RichTextEditor({ content, onChange, placeholder = 'Write your content here...', minHeight = 200 }: RichTextEditorProps) {
  const [mathOpen, setMathOpen] = useState(false)
  const [mathTex, setMathTex] = useState('')
  const [mathMode, setMathMode] = useState<'inline' | 'block'>('inline')
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [tableOpen, setTableOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CustomImage,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder }),
      MathInline,
      MathBlock,
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-3 py-2 editor-content',
      },
    },
  })

  const insertImage = useCallback(() => {
    const input = fileInputRef.current
    if (!input) return
    input.click()
  }, [])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      editor.chain().focus().setImage({ src: url }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [editor])

  const insertTable = useCallback((rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setTableOpen(false)
  }, [editor])

  const insertMath = useCallback(() => {
    if (!mathTex.trim() || !editor) return
    if (mathMode === 'inline') {
      editor.chain().focus().insertContent({ type: 'mathInline', attrs: { tex: mathTex.trim() } }).run()
    } else {
      editor.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: mathTex.trim() } }).run()
    }
    setMathTex('')
    setMathOpen(false)
  }, [mathTex, mathMode, editor])

  const addMathSymbol = useCallback((sym: string) => {
    setMathTex(prev => prev + sym + ' ')
  }, [])

  const toggleLink = useCallback(() => {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const prev = editor.getAttributes('link').href || ''
    setLinkUrl(prev)
    setLinkOpen(true)
  }, [editor])

  const saveLink = useCallback(() => {
    if (!linkUrl.trim() || !editor) return
    editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
    setLinkOpen(false)
    setLinkUrl('')
  }, [linkUrl, editor])

  if (!editor) return null

  const currentFont = editor.getAttributes('textStyle').fontSize || ''
  const currentColor = editor.getAttributes('textStyle').color || ''
  const currentHighlight = editor.getAttributes('highlight').color || ''

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">

        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="w-3.5 h-3.5" /></ToolbarButton>

        <ToolbarDivider />

        {/* Bold / Italic / Underline */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setFontOpen(!fontOpen)}
            title="Font Size"
            className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-0.5 text-xs"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[10px]">{currentFont ? currentFont.replace('px', '') : '16'}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {fontOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFontOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border py-1 max-h-48 overflow-y-auto min-w-[60px]">
                {FONT_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => { editor.chain().focus().setFontSize(`${size}px`).run(); setFontOpen(false) }}
                    className={`block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${currentFont === `${size}px` ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {size}
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                  <button
                    onClick={() => { editor.chain().focus().unsetFontSize().run(); setFontOpen(false) }}
                    className="block w-full text-left px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Default
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Color */}
        <ColorPicker
          label="Text Color"
          Icon={Palette}
          value={currentColor}
          onChange={(c) => c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run()}
        />

        {/* Highlight */}
        <ColorPicker
          label="Highlight Color"
          Icon={Highlighter}
          value={currentHighlight}
          onChange={(c) => c ? editor.chain().focus().toggleHighlight({ color: c }).run() : editor.chain().focus().toggleHighlight().run()}
        />

        <ToolbarDivider />

        {/* Insert Table */}
        <div className="relative">
          <ToolbarButton onClick={() => setTableOpen(!tableOpen)} title="Insert Table">
            <TableIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          {tableOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTableOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2">
                <div className="text-xs text-gray-500 mb-1 text-center">Insert Table</div>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(rows => (
                    <div key={rows} className="flex flex-col gap-0.5 items-center">
                      {[2, 3, 4, 5, 6].map(cols => (
                        <button
                          key={cols}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertTable(rows, cols)}
                          className="w-5 h-5 bg-gray-200 dark:bg-gray-600 hover:bg-primary/30 rounded-sm text-[8px] font-medium text-gray-500 flex items-center justify-center"
                          title={`${rows}x${cols}`}
                        >
                          {rows}x{cols}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Image */}
        <ToolbarButton onClick={insertImage} title="Insert Image">
          <Image className="w-3.5 h-3.5" />
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Link */}
        <div className="relative">
          <ToolbarButton onClick={toggleLink} active={editor.isActive('link')} title={editor.isActive('link') ? 'Remove Link' : 'Insert Link'}>
            {editor.isActive('link') ? <Link2Off className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
          </ToolbarButton>
          {linkOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setLinkOpen(false); setLinkUrl('') }} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 flex gap-1 min-w-[200px]">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 text-xs border rounded bg-transparent"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveLink()}
                />
                <Button size="sm" onClick={saveLink} className="text-xs h-7 px-2">Add</Button>
              </div>
            </>
          )}
        </div>

        <ToolbarDivider />

        {/* Math */}
        <div className="relative">
          <ToolbarButton onClick={() => setMathOpen(!mathOpen)} title="Insert Math Symbol">
            <Sigma className="w-3.5 h-3.5" />
          </ToolbarButton>
          {mathOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setMathOpen(false); setMathTex('') }} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 min-w-[320px] max-h-[400px] overflow-y-auto">
                <div className="flex gap-2 mb-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMathMode('inline')}
                      className={`px-2 py-0.5 text-xs rounded ${mathMode === 'inline' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      Inline $x$
                    </button>
                    <button
                      onClick={() => setMathMode('block')}
                      className={`px-2 py-0.5 text-xs rounded ${mathMode === 'block' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      Block $$x$$
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
                  {MATH_SYMBOLS.map(cat => (
                    <div key={cat.cat}>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">{cat.cat}</div>
                      <div className="flex flex-wrap gap-0.5">
                        {cat.items.map(sym => (
                          <button
                            key={sym}
                            onClick={() => addMathSymbol(sym)}
                            className="px-1.5 py-0.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono min-w-[24px] text-center"
                            title={sym}
                          >
                            {sym.replace('\\', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t dark:border-gray-700 pt-2">
                  <input
                    type="text"
                    value={mathTex}
                    onChange={(e) => setMathTex(e.target.value)}
                    placeholder="e.g. x^2 + y^2 = z^2"
                    className="flex-1 px-2 py-1 text-xs border rounded bg-transparent font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && insertMath()}
                  />
                  <Button size="sm" onClick={insertMath} className="text-xs h-7 px-2">Insert</Button>
                </div>
                {mathTex && (
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-center text-sm">
                    <PreviewMath tex={mathTex} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <EditorContent editor={editor} className="[&_.ProseMirror]:min-h-[200px]" style={{ minHeight }} />
      <style>{`
        .ProseMirror { outline: none; min-height: ${minHeight}px; padding: 8px 12px; }
        .ProseMirror > * + * { margin-top: 0.5em; }
        .ProseMirror p { margin: 0.25em 0; }
        .ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; }
        .ProseMirror h2 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0 0.25em; }
        .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; }
        .ProseMirror ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 0.3em 0 !important; }
        .ProseMirror ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 0.3em 0 !important; }
        .ProseMirror li { display: list-item !important; margin: 0.1em 0; }
        .ProseMirror ul ul, .ProseMirror ol ul { list-style-type: circle !important; }
        .ProseMirror ol ol, .ProseMirror ul ol { list-style-type: lower-alpha !important; }
        .ProseMirror table { width: 100%; border-collapse: collapse !important; margin: 0.5em 0; overflow: hidden; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #d1d5db !important; padding: 6px 10px !important; vertical-align: top; min-width: 40px; }
        .ProseMirror th { background: #f3f4f6; font-weight: 600; }
        .ProseMirror td p, .ProseMirror th p { margin: 0; }
        .dark .ProseMirror td, .dark .ProseMirror th { border-color: #4b5563 !important; }
        .dark .ProseMirror th { background: #374151; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 4px; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .dark .ProseMirror a { color: #60a5fa; }
        .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; margin: 0.5em 0; color: #6b7280; }
        .dark .ProseMirror blockquote { border-color: #4b5563; }
        .ProseMirror p.is-editor-empty:first-child::before { color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .ProseMirror pre { background: #f3f4f6; border-radius: 4px; padding: 0.75em; font-family: monospace; overflow-x: auto; }
        .dark .ProseMirror pre { background: #1f2937; }
        .ProseMirror code { background: #f3f4f6; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
        .dark .ProseMirror code { background: #374151; }
        .ProseMirror hr { border: none; border-top: 1px solid #d1d5db; margin: 1em 0; }
        .dark .ProseMirror hr { border-color: #4b5563; }
        .ProseMirror .math-inline { display: inline; padding: 0 2px; }
        .ProseMirror .math-block { margin: 0.5em 0; text-align: center; }
        .ProseMirror .math-block .katex-display { margin: 0.3em 0; }
        .ProseMirror table .selectedCell { background: #bfdbfe; }
        .dark .ProseMirror table .selectedCell { background: #1e3a5f; }
        .ProseMirror .column-resize-handle { background: #3b82f6; width: 2px; position: absolute; pointer-events: none; }
      `}</style>
    </div>
  )
}

function PreviewMath({ tex }: { tex: string }) {
  try {
    const html = katex.renderToString(tex, { throwOnError: false, displayMode: true })
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    return <span className="text-red-400 text-xs">{tex}</span>
  }
}
