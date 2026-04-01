# 読書ツール (AI Reading Assistant)

[English](#english) | [日本語](#日本語) | [中文](#中文)

---

<h2 id="english">🇺🇸 English</h2>

A minimalist, glassmorphic, immersive bilingual e-book reading assistant built with React + Node.js + Google Gemini 2.5.

### 🌟 Core Features

1. **Native Multi-Format Support**: Embedded infinite scrolling rendering for PDF, EPUB, and HTML documents.
2. **Immersive Glassmorphism UI**: Wrapped entirely in a dark glassmorphic theme, shielding you from all visual distractions.
3. **Smart Language Detection Engine**: Fully supports English and Japanese. Automatically filters N3+ level grammar points and phrases for Japanese; provides advanced English-English dictionary style explanations for English text.
4. **Parallel Dual-Tab Details Workflow**: Analyze book summaries or decipher complex sentences while seamlessly switching to the `[📝 Notes]` tab to quickly jot down annotations on the right side.
5. **Offline Private Knowledge Base**: Introduces a debounced auto-save mechanism. All your searched vocabulary, grammar breakdowns, and reading notes are saved locally as structured Markdown files in the `history/[Book Name]/` directory. Privacy first, highly crystallized.

### 🚀 Quick Deployment Guide

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/dokusho-tool.git
cd dokusho-tool
npm install
```

#### 2. Configure Your AI Brain
Create a `.env` file in the project root and paste your Google Gemini AI service key (refer to `.env.example`):
```env
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxx
```

#### 3. Launch
```bash
npm run dev
```
> The script uses `concurrently` to spin up both the backend (port 3001) and the frontend (port 5173). Open your browser and visit `http://localhost:5173/` to start reading.

### 📚 Detailed Documentation
Check the `docs/` folder for guides on writing advanced custom prompts and logs of our refactoring phases.

### 📄 License
MIT License

---

<h2 id="日本語">🇯🇵 日本語</h2>

React + Node.js + Google Gemini 2.5 で構築された、シンプルで美しいグラスモーフィズムデザインの没入型バイリンガル読書支援ツール。

### 🌟 主な機能

1. **複数フォーマットのネイティブ表示**: PDF、EPUB、HTML ドキュメントを組み込みで無限スクロールレンダリングします。
2. **没入型 UI (Glassmorphism)**: 視覚的なノイズを排除したダークテイストのグラスモーフィズムテーマでアプリ全体を包み込みます。
3. **インテリジェント言語認識エンジン**: 英語と日本語を完全サポート。日本語の文法検索時は JLPT N3 以上の文法と慣用句を自動抽出・解説し、英語検索時は高度な英英辞典モードで詳細を出力します。
4. **パラレル 2つのタブ (非同期ワークフロー)**: AI に文書の要約や難解な文の解析を依頼しながら、右側のタブを `[📝 読書ノート]` に切り替えてシームレスにメモを取ることができます。
5. **ローカル優先のプライベートデータベース**: タイピングが止まると自動で保存される（デバウンス）仕組みを搭載。検索した単語帳、文法解析の記録、読書メモはすべて Markdown 形式で物理ファイルとして `history/[書籍名]/` フォルダにネイティブ保存されます。プライバシーを最優先にした知識の結晶化を実現。

### 🚀 クイックスタート

#### 1. クローン & 依存関係のインストール
```bash
git clone https://github.com/your-username/dokusho-tool.git
cd dokusho-tool
npm install
```

#### 2. 専用 AI のセットアップ
プロジェクトのルートに `.env` ファイルを作成し、Google Gemini API キーを貼り付けます (`.env.example` を参考にしてください):
```env
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxx
```

#### 3. アプリケーション起動
```bash
npm run dev
```
> バックグラウンドで `concurrently` が動作し、3001 番ポートのサーバーと 5173 番ポートのフロントエンドが同時起動します。ブラウザで `http://localhost:5173/` にアクセスして読書を開始してください。

### 📚 開発ドキュメント
カスタムプロンプトの作成方法や、過去のリファクタリングの記録については `docs/` フォルダ内のファイルをご覧ください。

### 📄 ライセンス
MIT License

---

<h2 id="中文">🇨🇳 中文</h2>

一款基于 React + Node.js + Google Gemini 2.5 构建的极简玻璃态双语沉浸式电子书阅读辅助工具。

### 🌟 核心功能

1. **多格式原生支持**：内嵌式无限滚动渲染 PDF、EPUB 及 HTML 文献。
2. **沉浸式玻璃 UI (Glassmorphism)**：全站包裹于深色毛玻璃暗黑主题之中，为你屏退一切视线干扰。
3. **智能语种感知引擎**：全面支持英日双语。日文查语法时自动剥除 N3+ 级别的假名及惯用句式分析；英文查阅时全境启动英英大词典的高级出单。
4. **平行双 Tab 异步工作流**：在利用 AI 翻译全书大纲或拆解长难句的同时，在右侧无缝切换到 `[📝 読書ノート]` 开始快速批注。
5. **本地私人宇宙 (Offline Knowledge Base)**：引入底层防抖 (Debounce) 自动保存机制。你查阅过的所有词汇表、语法解剖片段以及你的阅读沉思笔记，全部会以国际化的结构化原生 Markdown 格式落库到 `history/[书籍名]/` 目录下。隐私至上，高度结晶。

### 🚀 极速部署指引

#### 1. 获取最新代码并安装依赖包
```bash
git clone https://github.com/your-username/dokusho-tool.git
cd dokusho-tool
npm install
```

#### 2. 配置专属的 AI 大脑
在项目根目录下创建一个 `.env` 文件，粘贴你的 Google Gemini AI 服务密钥（请参考 `.env.example`）：
```env
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxx
```

#### 3. 一键起飞
```bash
npm run dev
```
> 底层守护脚本将通过 `concurrently` 并发跑起 3001 端口与 5173 页面，请打开浏览器访问 `http://localhost:5173/` 开始阅读。

### 📚 详尽开发文档库

关于如何撰写专属高级自定义 Prompt、本工程历代重构排雷记录，请拜访 `docs/` 文件夹下游览。

### 📄 许可说明
本项目遵循 MIT License 协议开源发布。
