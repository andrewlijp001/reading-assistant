import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  }
})
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } })

const historyDir = path.join(__dirname, 'history')
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir)

const saveHistory = async (bookName, feature, input, output) => {
  try {
    const safeBookName = (bookName || "未命名书籍").replace(/[/\\?%*:|"<>]/g, '_')
    const dirPath = path.join(historyDir, safeBookName)
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
    
    const filePath = path.join(dirPath, `${feature}.md`)
    const timestamp = new Date().toLocaleString('ja-JP')
    
    // Make blockquote nice
    const formattedInput = typeof input === 'string' ? input.trim().split('\n').join('\n> ') : JSON.stringify(input)
    
    const content = `\n## 🕒 ${timestamp}\n\n> **原文 / 输入**：\n> ${formattedInput}\n\n**🤖 解析结果**：\n\n${output}\n\n---\n`
    
    await fs.promises.appendFile(filePath, content, 'utf-8')
  } catch (err) {
    console.error('保存历史记录失败:', err)
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// 上传文件
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' })
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  })
})

// 获取上传的文件（供前端渲染）
app.get('/api/file/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' })
  res.sendFile(filePath)
})

// 单词查询
app.post('/api/lookup', async (req, res) => {
  const { word, context, language, bookName } = req.body
  if (!word) return res.status(400).json({ error: '缺少单词' })

  const langNote = language === 'ja'
    ? 'これは日本語の単語です。以下の内容を日本語で出力してください：\n1. 読み方（ふりがな）\n2. 意味（2〜3個）\n3. 例文（原文と解説）\n※ 簡潔なフォーマットで出力し、余分な説明は省いてください。'
    : 'This is an English word. Please output the following in English:\n1. Phonetic symbols (IPA)\n2. Definitions (2-3 items)\n3. Example sentences (original and explanation)\nNote: Keep the format concise and avoid redundant descriptions.'

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${langNote}\n\n対象：${word}${context ? `\nコンテキスト / Context：${context}` : ''}`
    })
    
    const resultText = response.text
    res.json({ result: resultText })
    
    // 异步保存记录
    saveHistory(bookName, 'Vocabulary', word, resultText)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 语法解析
app.post('/api/grammar', async (req, res) => {
  const { sentence, language, bookName } = req.body
  if (!sentence) return res.status(400).json({ error: '缺少句子' })

  const langNote = language === 'ja'
    ? '以下の日本語の文を日本語で解析してください。要件：\n1. 【JLPT N3以上】の応用的な文法、動詞の形態、または重要な表現のみを抽出し、初歩的な文法は直接無視してください。\n2. 以下の構造に従い、2つの部分に分けて出力してください：\n\n### 📖 応用文法解析\n（文中の重要な構文、助詞の難点、または動詞の形態などの解説）\n\n### 🧱 頻出表現・コロケーション\n（頻出するフレーズや慣用句を抽出。※必ず抽出したフレーズに【ふりがな】を振り、文脈での具体的な意味を解説すること）'
    : 'Please analyze the following English sentence in English. Requirements:\n1. Focus strictly on extracting and analyzing advanced knowledge at the 【CET-4 (Undergraduate) level and above】, completely ignoring elementary vocabulary and basic grammar.\n2. Output stringently in two sections according to the structure below:\n\n### 📖 Core Grammar & Structures\n(Analyze complex tenses, types of clauses, and special syntactic features in the sentence)\n\n### 🧱 Common Phrases & Collocations\n(Extract advanced phrases or authentic collocations. Note: You MUST provide pronunciation using IPA phonetic symbols for the extracted phrases, and explain their specific usage in the current context)'

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${langNote}\n\n対象 / Target Sentence：${sentence}`
    })
    
    const resultText = response.text
    res.json({ result: resultText })
    
    saveHistory(bookName, 'Grammar', sentence, resultText)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 整本书分析（核心观点 + 主要人物）
app.post('/api/book-analysis', async (req, res) => {
  const { text, prompt, language, bookName } = req.body
  if (!text) return res.status(400).json({ error: '缺少文本' })

  let sysPrompt = language === 'ja' 
    ? `以下は日本語の書籍の内容です。日本語で分析し、以下の構成で出力してください：\n\n## 💡 核心となる主張\n（3～7つの主要な論点をリストアップ）\n\n## 👥 主要人物 / 概念\n（主要人物とその紹介。ノンフィクションの場合は重要概念をリスト）\n\n## 📝 あらすじ\n（100〜200文字で概要を説明）`
    : `The following is the content of an English book. Please analyze it in English and output using this structure:\n\n## 💡 Core Insights\n(List 3-7 main arguments or concepts)\n\n## 👥 Key Figures / Concepts\n(List main characters with brief intros, or core concepts if non-fiction)\n\n## 📝 Summary\n(100-200 words overview)`

  if (prompt) {
    sysPrompt += `\n\n【ユーザーからの特別指示】：\n${prompt}`
  }

  sysPrompt += `\n\n---\n書籍の内容：\n${text.slice(0, 500000)}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: sysPrompt
    })
    
    const resultText = response.text
    res.json({ result: resultText })
    
    saveHistory(bookName, 'Book_Analysis', `[已读取 ${Math.round(text.length / 1000)}K 字书籍内容]\n\n[特别指示]\n${prompt || '无额外指示'}`, resultText)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 即时AI分析（自由分析选中文本）
app.post('/api/analyze', async (req, res) => {
  const { text, prompt, language, bookName } = req.body
  if (!text && !prompt) return res.status(400).json({ error: '请提供文本或提示词' })

  const sysPrompt = language === 'ja'
    ? (prompt ? prompt + '\n（※日本語で回答してください）' : '以下の内容について、意味、背景、要点などを日本語で解析・説明してください。')
    : (prompt ? prompt + '\n(※Please reply in English)' : 'Please analyze and explain the following content in English, including its meaning, background, and key points.')

  const contentBlock = text ? `\n\n対象 / Content：\n${text}` : ''

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${sysPrompt}${contentBlock}`
    })
    
    const resultText = response.text
    res.json({ result: resultText })
    
    saveHistory(bookName, 'AI_Analysis', `[文本]\n${text || '无'}\n\n[提示词]\n${prompt || '默认自由解析'}`, resultText)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === 获取书籍专属笔记 ===
app.get('/api/notes', async (req, res) => {
  const { bookName } = req.query
  try {
    const safeBookName = (bookName || "未命名书籍").replace(/[/\\?%*:|"<>]/g, '_')
    const dirPath = path.join(historyDir, safeBookName)
    const filePath = path.join(dirPath, 'Notes.md')

    if (!fs.existsSync(filePath)) {
      return res.json({ content: '' })
    }
    const content = await fs.promises.readFile(filePath, 'utf-8')
    res.json({ content })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === 自动保存书籍专属笔记 ===
app.post('/api/notes', async (req, res) => {
  const { bookName, content } = req.body
  try {
    const safeBookName = (bookName || "未命名书籍").replace(/[/\\?%*:|"<>]/g, '_')
    const dirPath = path.join(historyDir, safeBookName)
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
    
    const filePath = path.join(dirPath, 'Notes.md')
    await fs.promises.writeFile(filePath, content || '', 'utf-8')
    
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`)
})
