# FRD 地圖編輯器

本專案是一個適用於 project FRD (開發代號) 的地圖編輯器。  
目標是提供企劃 / 關卡設計人員簡易操作，產出遊戲可以使用的地圖集。  

專案以前端為主，使用 React 建立互動式地圖編輯介面，並透過 SVG 繪製六角格地圖。

## 使用
請透過 GitHub Pages 直接存取頁面：  
👉 [Demo Link](https://alimen.github.io/FRD-Map-Editor/) 

## 開發環境

- **React 19**：主要 UI 框架，使用 Function Components 與 Hooks 管理狀態。
- **Vite 6**：前端開發伺服器與打包工具。
- **TypeScript 5**：提供型別定義與編譯檢查。
- **Tailwind CSS 4**：樣式工具，透過 `@import "tailwindcss"` 與 `@tailwindcss/vite` 整合。
- **React DOM**：將 React App 掛載到瀏覽器 DOM。
- **lucide-react**：提供介面中的圖示，例如縮放、匯入匯出、復原重做、地圖、圖層等按鈕 icon。

本專案使用 Google AI Studio 建立六角格編輯的基礎架構，後續再由 OpenAI Codex 與人力協作而成。

