import { useEffect, useState } from 'react'

export default function HTMLReader({ fileUrl, onTextExtracted }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error('ファイルの読み込みに失敗しました')
        const text = await res.text()
        if (cancelled) return

        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        doc.querySelectorAll('script, style, link').forEach(el => el.remove())

        setHtml(doc.body?.innerHTML || text)
        onTextExtracted(doc.body?.innerText || doc.body?.textContent || '')
        setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError('HTML 読み込みエラー：' + e.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [fileUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce">⏳</div>
          <p>HTML を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>
  }

  return (
    <div>
      <p className="text-xs text-stone-400 text-center mb-4">
        HTML ファイル ・ テキストを選択して右パネルのボタンを押してください
      </p>
      <div
        className="bg-white rounded-xl shadow-sm p-8 prose prose-stone max-w-none"
        style={{ lineHeight: '1.8', fontSize: '16px' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
