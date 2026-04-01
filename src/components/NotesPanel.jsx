import { useState, useEffect, useRef } from 'react'
import { getNotes, saveNotes } from '../utils/api'

export default function NotesPanel({ bookTitle }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await getNotes(bookTitle)
        if (active) {
          setContent(data)
          setSaveStatus('saved')
        }
      } catch (err) {
        if (active) setSaveStatus('error')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [bookTitle])

  const handleChange = (e) => {
    const val = e.target.value
    setContent(val)
    setSaveStatus('saving')

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveNotes(bookTitle, val)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
      }
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 bg-slate-900/60 shadow-sm backdrop-blur-md">
        <span className="font-bold text-slate-200 text-sm tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
          📝 読書ノート
        </span>
        <span className="text-xs font-medium text-slate-400">
          {loading ? '読み込み中...' : saveStatus === 'saving' ? '保存中...' : saveStatus === 'error' ? '❌ 保存失敗' : '✨ 保存済み'}
        </span>
      </div>
      
      <div className="flex-1 p-6 flex flex-col items-center">
         {loading ? (
             <div className="flex flex-col items-center justify-center flex-1 w-full text-slate-500">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-xs tracking-wide">ノートを取得しています...</p>
             </div>
         ) : (
            <textarea
              className="w-full h-full bg-slate-800/20 border border-white/5 rounded-xl p-5 text-sm leading-loose text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-600 transition-all shadow-inner font-medium scroll-smooth focus:bg-slate-800/40"
              placeholder="# 自由なアイデアを書き留めましょう...&#13;&#10;&#13;&#10;- 気づき&#13;&#10;- 要点&#13;&#10;- 疑問&#13;&#10;&#13;&#10;入力内容は自動的に保存されます。"
              value={content}
              onChange={handleChange}
            />
         )}
      </div>
    </div>
  )
}
