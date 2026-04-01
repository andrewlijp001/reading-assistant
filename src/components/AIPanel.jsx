import { useState, useEffect, useRef } from 'react'
import { lookupWord, analyzeGrammar, analyzeBook, analyzeText, detectLanguage } from '../utils/api'

const ACTION_META = {
  lookup:        { label: '単語を調べる', icon: '🔍', color: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-cyan-500/25',   badge: 'bg-blue-900/20 border-blue-500/30 text-blue-100'   },
  grammar:       { label: '文法解析',     icon: '📐', color: 'bg-gradient-to-r from-violet-600 to-purple-500 hover:shadow-purple-500/25', badge: 'bg-violet-900/20 border-violet-500/30 text-violet-100' },
  analyze:       { label: 'AI 分析',      icon: '✨', color: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-teal-500/25', badge: 'bg-emerald-900/20 border-emerald-500/30 text-emerald-100' },
  'book-analysis': { label: '全書分析',   icon: '📚', color: 'bg-gradient-to-r from-amber-600 to-orange-500 hover:shadow-orange-500/25',  badge: 'bg-amber-900/20 border-amber-500/30 text-amber-100'  },
}

export default function AIPanel({ selectedText, bookContent, bookTitle, onClearSelection }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [editableText, setEditableText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (selectedText) setEditableText(selectedText)
  }, [selectedText])

  const run = async (type) => {
    let payload = type === 'book-analysis' ? bookContent : editableText

    // 针对全书分析的空校验
    if (type === 'book-analysis' && !payload) {
      setResults(prev => [{
        id: Date.now(),
        type,
        input: '全書テキスト未検出',
        result: '❌ 辞書機能ではなく【全書分析】を行うには、左側に書籍をアップロードしてください。（読み込み中の場合は数秒お待ちください）',
        time: new Date().toLocaleTimeString('ja-JP')
      }, ...prev])
      return
    }

    // 常规校验
    if (!payload && type !== 'analyze') return
    if (type === 'analyze' && !payload && !customPrompt) {
       // 如果都没有填，拒绝自由分析
       return
    }

    setLoading(true)
    setLoadingType(type)
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    const lang = detectLanguage(payload || customPrompt)

    try {
      let result = ''
      if (type === 'lookup')         result = await lookupWord(payload, '', lang, bookTitle)
      else if (type === 'grammar')   result = await analyzeGrammar(payload, lang, bookTitle)
      else if (type === 'book-analysis') result = await analyzeBook(payload, customPrompt, lang, bookTitle)
      else if (type === 'analyze')   result = await analyzeText(payload, customPrompt, lang, bookTitle)

      setResults(prev => [{
        id: Date.now(),
        type,
        input: payload ? (payload.slice(0, 80) + (payload.length > 80 ? '…' : '')) : 'フリーAI分析',
        result,
        time: new Date().toLocaleTimeString('ja-JP')
      }, ...prev])
    } catch (e) {
      setResults(prev => [{
        id: Date.now(),
        type,
        input: payload ? payload.slice(0, 80) : 'フリーAI分析',
        result: '❌ ' + e.message,
        time: new Date().toLocaleTimeString('ja-JP')
      }, ...prev])
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const isDisabled = (type) => {
    if (loading) return true
    
    // 全书分析按钮永远“点亮”，如果内容为空点击后会优雅提示
    if (type === 'book-analysis') return false 
    
    // AI 自由分析按钮只要上面或下面有任意一个填了内容就点亮
    if (type === 'analyze') return !editableText.trim() && !customPrompt.trim()
    
    // 查询和语法必须有选中文本
    return !editableText.trim()
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* パネルヘッダー */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 bg-slate-900/60 shadow-sm backdrop-blur-md">
        <span className="font-bold text-slate-200 text-sm tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]"></span>
          AI アシスタント
        </span>
        {results.length > 0 && (
          <button
            onClick={() => setResults([])}
            className="text-xs font-medium text-slate-500 hover:text-red-400 transition-colors"
          >
            履歴をクリア
          </button>
        )}
      </div>

      {/* 選択中テキスト（編集可能） */}
      <div className="px-6 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
        <div className="text-xs font-medium tracking-wide text-slate-400 mb-2 flex items-center justify-between">
          <span>選択 / 入力テキスト</span>
          {editableText && (
            <button
              onClick={() => { setEditableText(''); onClearSelection() }}
              className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <span>✕</span> クリア
            </button>
          )}
        </div>
        <textarea
          value={editableText}
          onChange={e => setEditableText(e.target.value)}
          placeholder="左の本文からテキストを選択するか、ここに直接入力してください..."
          rows={4}
          className={`w-full rounded-xl px-4 py-3 text-sm border resize-y focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-inner font-medium ${
            editableText
              ? 'bg-slate-800/80 border-violet-500/30 text-slate-200'
              : 'bg-slate-900/50 border-white/5 text-slate-500'
          }`}
        />
      </div>

      {/* アクションボタン */}
      <div className="px-6 py-5 border-b border-white/5 flex-shrink-0 bg-slate-800/10 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ACTION_META).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => run(type)}
              disabled={isDisabled(type)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-white text-xs font-bold tracking-wide transition-all duration-300 shadow-md hover:-translate-y-0.5
                ${meta.color}
                disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0`}
            >
              {loading && loadingType === type ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-sm drop-shadow-md">{meta.icon}</span>
              )}
              {meta.label}
            </button>
          ))}
        </div>

        {/* カスタムプロンプト */}
        <div className="mt-4">
          <label className="text-xs font-medium tracking-wide text-slate-200 block mb-2 flex items-center gap-1.5">
            ✨ カスタムプロンプト <span className="text-violet-400 font-bold bg-violet-900/40 px-2 py-0.5 rounded">（AI 分析 ＆ 全書分析 兼用）</span>
          </label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="全書分析の要望もここに！ （例：この本の第3章の要点を中心にまとめてください...）"
            className="w-full text-xs border border-white/5 bg-slate-900/70 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-200 placeholder:text-slate-500 transition-all shadow-inner font-medium"
            rows={3}
          />
        </div>
      </div>

      {/* 全書分析のヒント */}
      {bookContent && (
        <div className="px-6 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-amber-500/20 flex-shrink-0">
          <p className="text-xs font-medium text-amber-200/80 flex items-center gap-2">
            <span className="text-base drop-shadow-sm">📖</span> 
            書籍読み込み完了（{Math.round(bookContent.length / 1000)}K 文字）
          </p>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="px-6 py-3 flex items-center gap-3 text-xs font-medium text-violet-300 border-b border-white/5 flex-shrink-0 bg-violet-900/10">
          <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          {ACTION_META[loadingType]?.label} を処理中...
        </div>
      )}

      {/* 結果リスト */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scroll-smooth relative">
        {results.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <div className="text-5xl mb-4 opacity-30 drop-shadow-lg">🤖</div>
            <p className="text-sm font-semibold text-slate-500">テキストを選択するか</p>
            <p className="text-sm text-slate-500 mt-1">ボタンを押して分析を開始します</p>
          </div>
        )}

        <div className="relative z-10 space-y-4">
          {results.map((item, index) => {
            const meta = ACTION_META[item.type]
            return (
              <div 
                key={item.id} 
                className={`border rounded-2xl p-5 shadow-lg backdrop-blur-md transition-all duration-500 
                  ${meta?.badge || 'bg-slate-800/40 border-white/10 text-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold flex items-center gap-1.5 tracking-wide">
                    <span className="drop-shadow-sm">{meta?.icon}</span> {meta?.label}
                  </span>
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{item.time}</span>
                </div>
                <div className="text-xs mb-3 italic border-l-2 pl-3 py-0.5 opacity-60 font-medium">
                  {item.input}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-loose font-medium opacity-90">
                  {item.result}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
