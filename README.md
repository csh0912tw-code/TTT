# 桌球 AI Render 單服務部署版

## 部署重點
- 前端與後端合併成同一個 Node/Express 服務
- Render 上只要部署 1 個 Web Service
- 手機直接開 Render 網址即可用

## 檔案
- `server.js`：API + 靜態前端
- `public/index.html`：前端
- `render.yaml`：Render 部署設定
- `.env.example`：本機環境變數範例

## 本機啟動
```bash
npm install
node --env-file=.env server.js
```

## Render 部署
1. 把這個資料夾上傳到 GitHub
2. 到 Render 建立新的 Web Service
3. 選這個 repo
4. 若 Render 有讀到 `render.yaml`，大部分設定會自動帶入
5. 在 Render 的 Environment 新增 `YOUTUBE_API_KEY`
6. Deploy

部署完成後，前端與 API 會在同一個網址，不需要另外設定 API_BASE。
