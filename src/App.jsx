import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import PDFReader from './components/PDFReader'
import EPUBReader from './components/EPUBReader'
import HTMLReader from './components/HTMLReader'
import AIPanel from './components/AIPanel'
import NotesPanel from './components/NotesPanel'

export default function App() {
  const [book, setBook] = useState(null)
  const [selection, setSelection] = useState('')
  const [fullText, setFullText] = useState('')
  const [rightTab, setRightTab] = useState('ai') // 'ai' or 'notes'

  const handleFileLoaded = useCallback((fileInfo) => {
    setBook(fileInfo)
    setSelection('')
    setFullText('')
  }, [])

  const handleTextSelection = useCallback((text) => {
    if (text && text.trim().length > 0) {
      setSelection(text.trim())
    }
  }, [])

  const handleFullTextExtracted = useCallback((text) => {
    setFullText(text)
  }, [])

  const getFileType = (mimetype, originalname) => {
    if (mimetype === 'application/pdf' || originalname?.endsWith('.pdf')) return 'pdf'
    if (mimetype === 'application/epub+zip' || originalname?.endsWith('.epub')) return 'epub'
    if (mimetype === 'text/html' || originalname?.endsWith('.html') || originalname?.endsWith('.htm')) return 'html'
    return null
  }

  const fileType = book ? getFileType(book.mimetype, book.originalname) : null

  return (
    <div className="flex flex-col h-screen bg-[#0B0F19] text-slate-200 selection:bg-violet-500/30 font-sans overflow-hidden">
      {/* デスクトップ用 ヘッダー (Glassmorphism NavBar) */}
      <header className="flex items-center justify-between px-8 py-3 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex-shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="title-font text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">読書ツール</span>
          {book && (
            <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-full border border-white/10 truncate max-w-sm shadow-inner transition-all hover:bg-slate-700/60 cursor-default">
              📚 {book.originalname}
            </span>
          )}
        </div>
        <FileUpload onFileLoaded={handleFileLoaded} />
      </header>

      {!book ? (
        /* ウェルカム画面 (Premium Dark Theme Card) */
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* 背景のアンビエントライト（光斑） */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center gap-8 bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl max-w-2xl w-full transition-all duration-700 hover:border-white/20">
            <div className="text-7xl mb-1 hover:scale-110 hover:-rotate-3 transition-transform duration-500 cursor-default drop-shadow-2xl">📖</div>
            <div>
              <h2 className="title-font text-3xl font-bold mb-3 text-white tracking-wide">次世代 AI 読書アシスタント</h2>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">
                PDF・EPUB・HTML 形式のドキュメントをサポート。<br />
                Gemini 2.5 Flash による超高速・高精度の分析を体験してください。
              </p>
            </div>
            <FileUpload onFileLoaded={handleFileLoaded} large />
          </div>
        </div>
      ) : (
        /* メイン読書画面 */
        <div className="flex flex-1 overflow-hidden relative">
          {/* 左カラム：リーダー */}
          <div
            className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
            onMouseUp={() => {
              const sel = window.getSelection()?.toString()
              if (sel && sel.trim()) handleTextSelection(sel)
            }}
          >
            <div className="max-w-4xl mx-auto bg-white text-stone-900 rounded-xl shadow-2xl overflow-hidden min-h-full flex flex-col">
              {fileType === 'pdf' && (
                <PDFReader
                  fileUrl={book.url}
                  onTextExtracted={handleFullTextExtracted}
                />
              )}
              {fileType === 'epub' && (
                <EPUBReader
                  fileUrl={book.url}
                  onTextExtracted={handleFullTextExtracted}
                  onTextSelected={handleTextSelection}
                />
              )}
              {fileType === 'html' && (
                <HTMLReader
                  fileUrl={book.url}
                  onTextExtracted={handleFullTextExtracted}
                />
              )}
            </div>
          </div>

          {/* 右カラム：AI パネル (Floating Glass Panel) */}
          {/* 右カラム：AI パネル & ノート (Floating Glass Panel) */}
          <div className="w-[420px] flex-shrink-0 bg-slate-900/60 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shadow-2xl relative z-20">
            {/* 顶层 Tab 切换器 */}
            <div className="flex bg-slate-900/80">
              <button 
                onClick={() => setRightTab('ai')}
                className={`flex-1 py-3 text-xs font-bold tracking-widest transition-all ${rightTab === 'ai' ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-500/10' : 'text-slate-500 border-b-2 border-transparent hover:bg-white/5 hover:text-slate-300'}`}
              >
                ✨ AI アシスタント
              </button>
              <button 
                onClick={() => setRightTab('notes')}
                className={`flex-1 py-3 text-xs font-bold tracking-widest transition-all ${rightTab === 'notes' ? 'text-amber-300 border-b-2 border-amber-500 bg-amber-500/10' : 'text-slate-500 border-b-2 border-transparent hover:bg-white/5 hover:text-slate-300'}`}
              >
                📝 読書ノート
              </button>
            </div>

            {/* 内容区 (Stacking panels keeps selection state alive) */}
            <div className="flex-1 relative overflow-hidden">
              <div className={`absolute inset-0 transition-opacity duration-500 ${rightTab === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <AIPanel
                  selectedText={selection}
                  bookContent={fullText}
                  bookTitle={book ? book.originalname.replace(/\.[^/.]+$/, "") : ''}
                  onClearSelection={() => setSelection('')}
                />
              </div>
              <div className={`absolute inset-0 transition-opacity duration-500 ${rightTab === 'notes' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <NotesPanel bookTitle={book ? book.originalname.replace(/\.[^/.]+$/, "") : ''} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
