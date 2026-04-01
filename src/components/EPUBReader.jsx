import { useEffect, useRef, useState } from 'react'

export default function EPUBReader({ fileUrl, onTextExtracted, onTextSelected }) {
  const viewerRef = useRef()
  const bookRef = useRef(null)
  const renditionRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [extracting, setExtracting] = useState(false)

  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false

    const init = async () => {
      setLoading(true)
      setError('')

      try {
        const ePub = (await import('epubjs')).default

        if (bookRef.current) bookRef.current.destroy()

        const book = ePub(fileUrl)
        bookRef.current = book

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none'
        })
        renditionRef.current = rendition

        await rendition.display()
        if (cancelled) return

        // ← ここで即座にローディング終了（book.ready 完了を待たない）
        setLoading(false)

        // テキスト選択イベント
        rendition.on('selected', (cfiRange, contents) => {
          const text = contents.window.getSelection()?.toString().trim()
          if (text && onTextSelected) onTextSelected(text)
        })

        rendition.on('rendered', (section, view) => {
          const iframe = view?.iframe || view?.element?.querySelector('iframe')
          if (!iframe) return
          const attach = () => {
            try {
              iframe.contentDocument?.addEventListener('mouseup', () => {
                const sel = iframe.contentWindow?.getSelection()?.toString().trim()
                if (sel && onTextSelected) onTextSelected(sel)
              })
            } catch {}
          }
          iframe.addEventListener('load', attach)
          attach()
        })

        rendition.on('locationChanged', (loc) => {
          if (book.locations.total > 0) {
            setCurrentPage(Math.floor(
              book.locations.percentageFromCfi(loc.start.cfi) * book.locations.total
            ))
          }
        })

        // ← バックグラウンドでロケーション生成とテキスト抽出（UIをブロックしない）
        book.ready.then(async () => {
          if (cancelled) return

          // ロケーション生成（ページ番号表示用）
          book.locations.generate(1024).then(() => {
            if (!cancelled) setTotalPages(book.locations.total)
          }).catch(() => {})

          // テキスト全文抽出（全書分析用）
          setExtracting(true)
          try {
            let allText = ''
            for (const item of book.spine.items) {
              if (cancelled) break
              try {
                // epub.js の様々なバージョンに対応する堅牢なテキスト抽出
                const doc = await book.load(item.href)
                let text = ''
                if (doc && doc.body) {
                  text = doc.body.textContent || doc.body.innerText || ''
                } else if (doc && doc.textContent) {
                  text = doc.textContent
                } else if (typeof doc === 'string') {
                  text = doc.replace(/<[^>]*>?/g, ' ')
                }
                allText += text + '\n'
              } catch (err) {
                console.warn('Failed to extract section:', err)
              }
            }
            
            if (!cancelled) {
              // 抽出できなくても、空文字ではなくダミーテキストを渡してボタンを活性化させる
              const finalContent = allText.trim() ? allText : '[テキストの自動抽出対象外のフォーマット、または画像ベースの書籍です]'
              onTextExtracted(finalContent)
            }
          } catch (e) {
            console.error('Extraction completely failed:', e)
            if (!cancelled) onTextExtracted('[テキスト抽出で重大なエラーが発生しました]')
          } finally {
            if (!cancelled) setExtracting(false)
          }
        }).catch(() => {})

      } catch (e) {
        if (!cancelled) {
          setError('EPUB 読み込みエラー：' + e.message)
          setLoading(false)
        }
      }
    }

    init()
    return () => {
      cancelled = true
      if (bookRef.current) {
        bookRef.current.destroy()
        bookRef.current = null
      }
    }
  }, [fileUrl])

  const prev = () => renditionRef.current?.prev()
  const next = () => renditionRef.current?.next()

  return (
    <div className="flex flex-col relative w-full h-full min-h-[80vh]">
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin drop-shadow-lg">⚙️</div>
            <p className="text-slate-600 font-bold tracking-wide">EPUB ドキュメントを解析中...</p>
            <p className="text-slate-400 text-xs mt-2">しばらくお待ちください</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 rounded-xl">
          <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <div className="text-red-500 text-lg font-bold mb-2">エラーが発生しました</div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* viewerRef 必须具有确定的宽高以防 epubjs 的 display() 计算挂起 */}
      <div
        ref={viewerRef}
        className={`w-full bg-white rounded-xl shadow-2xl overflow-hidden transition-opacity duration-700 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ height: '80vh' }}
      />

      {!loading && !error && (
        <div className="flex items-center justify-between px-6 py-4 mt-2 bg-slate-50 border-t border-slate-200 rounded-b-xl">
          <button onClick={prev} className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-100 hover:shadow rounded-lg transition-all active:scale-95">
            ← 前のページ
          </button>

          <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
            {extracting && (
              <span className="flex items-center gap-1.5 text-violet-600 bg-violet-100 px-2 py-1 rounded-md">
                <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin inline-block" />
                全文抽出中...
              </span>
            )}
            {totalPages > 0
              ? `${currentPage} / ${totalPages} ・ テキストを選択して右パネルのボタンを押してください`
              : 'テキストを選択して右パネルのボタンを押してください'
            }
          </span>

          <button onClick={next} className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-100 hover:shadow rounded-lg transition-all active:scale-95">
            次のページ →
          </button>
        </div>
      )}
    </div>
  )
}
