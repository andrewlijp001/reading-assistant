import { useEffect, useRef, useState, useCallback } from 'react'

export default function PDFReader({ fileUrl, onTextExtracted }) {
  const canvasRef = useRef()
  const textLayerRef = useRef()
  const pdfjsRef = useRef(null)
  const pdfRef = useRef(null)
  const renderTaskRef = useRef(null)

  const [loading, setLoading] = useState(true)       // 初期PDF読み込み
  const [pageLoading, setPageLoading] = useState(false) // ページ切り替え中
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [extracting, setExtracting] = useState(false) // バックグラウンド抽出中

  // ① PDFドキュメントを読み込む（高速）
  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false

    const loadPdf = async () => {
      setLoading(true)
      setError('')

      try {
        const pdfjsLib = await import('pdfjs-dist')
        // 强制使用 npm 的 unpkg CDN 加载 worker，彻底规避 Vite 开发服务器中的由于重新打包导致的各种 404 挂起问题
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        pdfjsRef.current = pdfjsLib

        const pdfDoc = await pdfjsLib.getDocument(fileUrl).promise
        if (cancelled) return

        pdfRef.current = pdfDoc
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
        setLoading(false) // ← ここで即座に表示開始

        // ② バックグラウンドでテキスト全文抽出（全書分析用）
        setExtracting(true)
        let allText = ''
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) break
          const page = await pdfDoc.getPage(i)
          const textContent = await page.getTextContent()
          allText += textContent.items.map(item => item.str).join(' ') + '\n'
        }
        if (!cancelled) {
          onTextExtracted(allText)
          setExtracting(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError('PDF 読み込みエラー：' + e.message)
          setLoading(false)
        }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [fileUrl])

  // ③ ページをレンダリング
  const renderPage = useCallback(async (pageNum, sc) => {
    if (!pdfRef.current || !canvasRef.current) return
    setPageLoading(true)

    // 前の描画タスクをキャンセル
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch {}
    }

    try {
      const pdfjsLib = pdfjsRef.current
      const page = await pdfRef.current.getPage(pageNum)
      const viewport = page.getViewport({ scale: sc })

      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height

      const renderTask = page.render({
        canvasContext: canvas.getContext('2d'),
        viewport
      })
      renderTaskRef.current = renderTask
      await renderTask.promise

      // テキスト選択レイヤー
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = ''
        textLayerRef.current.style.width = `${viewport.width}px`
        textLayerRef.current.style.height = `${viewport.height}px`

        const textContent = await page.getTextContent()
        textContent.items.forEach((item) => {
          if (!item.str?.trim()) return
          try {
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
            const fontHeight = Math.hypot(tx[2], tx[3])
            if (fontHeight <= 0) return
            const span = document.createElement('span')
            span.textContent = item.str
            span.style.cssText = `
              position:absolute;left:${tx[4]}px;top:${tx[5] - fontHeight}px;
              font-size:${fontHeight}px;font-family:sans-serif;
              transform-origin:0% 0%;color:transparent;white-space:pre;
              cursor:text;user-select:text;
            `
            textLayerRef.current.appendChild(span)
          } catch {}
        })
      }

      setPageLoading(false)
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        setPageLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!loading && pdfRef.current) {
      renderPage(currentPage, scale)
    }
  }, [currentPage, scale, loading, renderPage])

  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  return (
    <div className="flex flex-col items-center">
      {/* 初期ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-stone-500">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-bounce">⏳</div>
            <p>PDF を読み込み中...</p>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 text-center py-10">{error}</div>}

      {!loading && !error && (
        <>
          {/* ナビゲーションバー */}
          <div className="sticky top-0 z-10 w-full bg-white border-b border-stone-200 flex items-center justify-between px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                disabled={currentPage <= 1 || pageLoading}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm disabled:opacity-40 transition"
              >
                ←
              </button>
              <span className="text-sm text-stone-600 w-28 text-center">
                {pageLoading ? '...' : `${currentPage} / ${totalPages}`}
              </span>
              <button
                onClick={goToNext}
                disabled={currentPage >= totalPages || pageLoading}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm disabled:opacity-40 transition"
              >
                →
              </button>
            </div>

            <div className="flex items-center gap-2">
              {extracting && (
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin inline-block" />
                  全文抽出中...
                </span>
              )}
              <button onClick={() => setScale(s => Math.max(0.75, s - 0.25))} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-sm">−</button>
              <span className="text-xs text-stone-500 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-sm">＋</button>
            </div>
          </div>

          {/* PDFキャンバス＋テキストレイヤー */}
          <div className="relative mt-4 shadow-md" style={{ lineHeight: 0 }}>
            {pageLoading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
              ref={textLayerRef}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', lineHeight: 1 }}
            />
          </div>

          <p className="text-xs text-stone-400 mt-4 mb-6">
            テキストを選択して右パネルのボタンを押してください
          </p>
        </>
      )}
    </div>
  )
}
