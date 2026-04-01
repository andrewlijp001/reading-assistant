import { useRef, useState } from 'react'
import { uploadFile, getFileUrl } from '../utils/api'

const ACCEPTED = '.pdf,.epub,.html,.htm'

export default function FileUpload({ onFileLoaded, large = false }) {
  const inputRef = useRef()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const info = await uploadFile(file)
      onFileLoaded({ ...info, url: getFileUrl(info.filename) })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onInputChange = (e) => {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  if (large) {
    return (
      <div
        className="group relative overflow-hidden border-2 border-dashed border-white/20 rounded-3xl p-16 text-center cursor-pointer hover:border-violet-400/50 hover:bg-violet-900/20 transition-all duration-500 w-full max-w-md mx-auto bg-slate-800/20"
        onClick={() => inputRef.current.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onInputChange} />
        <div className="text-5xl mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 drop-shadow-md cursor-pointer">📥</div>
        <p className="text-slate-200 font-semibold tracking-wide">
          {loading ? 'アップロード処理中...' : 'クリックまたはドラッグ＆ドロップ'}
        </p>
        <p className="text-slate-500 text-sm mt-2 font-medium">PDF・EPUB・HTML 対応</p>
        {error && <p className="text-red-400 text-sm mt-3 font-medium bg-red-500/10 px-3 py-1.5 rounded-lg inline-block">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onInputChange} />
      {error && <span className="text-red-400 text-xs font-medium bg-red-500/10 px-2 py-1 rounded">{error}</span>}
      <button
        onClick={() => inputRef.current.click()}
        disabled={loading}
        className="text-sm px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 font-medium tracking-wide flex items-center gap-2"
      >
        <span>{loading ? '⏳' : '📥'}</span>
        {loading ? '処理中...' : 'ファイルを開く'}
      </button>
    </div>
  )
}
