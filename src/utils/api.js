// 检测如果是在 Electron 中以本地文件形式（file://）加载，则需要强制补全后端服务所在的绝对地址
const BASE = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api'

// レスポンスエラーを読み取るヘルパー
async function handleResponse(res, fallbackMsg) {
  if (res.ok) return res.json()
  let errMsg = fallbackMsg
  try {
    const body = await res.json()
    if (body?.error) errMsg = body.error
  } catch {}
  throw new Error(errMsg)
}

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  return handleResponse(res, 'ファイルのアップロードに失敗しました')
}

export function getFileUrl(filename) {
  return `${BASE}/file/${filename}`
}

export async function lookupWord(word, context = '', language = 'en', bookName = '') {
  const res = await fetch(`${BASE}/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, context, language, bookName })
  })
  const data = await handleResponse(res, '単語の検索に失敗しました')
  return data.result
}

export async function analyzeGrammar(sentence, language = 'en', bookName = '') {
  const res = await fetch(`${BASE}/grammar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence, language, bookName })
  })
  const data = await handleResponse(res, '文法解析に失敗しました')
  return data.result
}

export async function analyzeBook(text, prompt = '', language = 'en', bookName = '') {
  const res = await fetch(`${BASE}/book-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt, language, bookName })
  })
  const data = await handleResponse(res, '全書分析に失敗しました')
  return data.result
}

export async function analyzeText(text, prompt = '', language = 'en', bookName = '') {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt, language, bookName })
  })
  const data = await handleResponse(res, 'AI分析に失敗しました')
  return data.result
}

export function detectLanguage(text) {
  const jaPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  return jaPattern.test(text) ? 'ja' : 'en'
}

export async function getNotes(bookName = '') {
  const res = await fetch(`${BASE}/notes?bookName=${encodeURIComponent(bookName)}`)
  const data = await handleResponse(res, 'ノートの読み込みに失敗しました')
  return data.content || ''
}

export async function saveNotes(bookName = '', content = '') {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookName, content })
  })
  return handleResponse(res, 'ノートの保存に失敗しました')
}
