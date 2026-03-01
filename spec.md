# Role & Context
あなたはシニア・フルスタックエンジニアです。
以下の前提環境・技術スタック・制約を基盤として、新しいWebアプリケーションの開発を行ってください。

# Base Architecture (前提となる技術スタックと構成)
- **Frontend Core:** React + Vite
- **Styling:** Tailwind CSS (Vanilla CSSでのカスタマイズを許容)
- **PWA (Progressive Web App):** `vite-plugin-pwa` を使用したインストール対応（Android/iOS向けの `manifest.json` , Service Worker設定）

# Development Environment (開発環境の制約と考慮事項)
開発・検証は以下の環境で行われています。これらの環境特有の制約を常に考慮してコードを提案・実装してください。

1. **WSL (Windows Subsystem for Linux) 環境:**
   - バックエンドプロセスやViteの開発サーバーはWSL上で動作します。
   - Viteを使用する場合、Windows側のブラウザからアクセスできるよう、`vite.config.js` にて `server.host: true` エイリアス設定や、ファイル変更の検知のために `server.watch.usePolling: true` が必要になります。

2. **ターゲットデバイスとプラットフォーム:**
   - 主な検証・動作ターゲットは **スマートフォン（AndroidのChrome、および iPad/iOSのSafari）** になります。
   - モバイル特有の挙動（タッチイベント、Viewportのスケーリング、画面スリープ、各OS・ブラウザ特有のメディア制約やバグ）を初回実装時から考慮し、適切な対応・ポリフィルを含めてください。
   - 特にiOS Safariのエッジケースには厳重に警戒し、安全なAPIの実装方針を選択してください。

# Deployment Flow (デプロイ手順)
AWS Amplify Consoleの手動デプロイ（ドラッグ＆ドロップ）を前提とします。
成果物を作成する際は、以下のコマンド例のようにビルド結果（`dist`ディレクトリ）の中身を単一のzipファイル（例: `amplify-deploy.zip`）に固めるコマンドを提供してください。

```bash
# ビルドおよびデプロイ用zip作成コマンド例
wsl -d Ubuntu -e bash -c "npm run build && rm -f amplify-deploy.zip && cd dist && zip -r ../amplify-deploy.zip ."
```

---

# Core Requirements
1. **カメラ映像の取得と表示:**
   - Webカメラの映像を画面いっぱいに（または大きく）表示する `video` 要素を配置する。
2. **AIによる骨格検知（リアルタイム）:**
   - カメラ映像のフレームを TensorFlow.js のモデルに渡し、リアルタイムにキーポイント（関節の座標）を取得する。
   - 取得したキーポイントを、`video` に重ねた `canvas` 上にワイヤーフレームとして描画する。
3. **フルート特有の指標計算（数学的処理）:**
   - 取得した座標データから、以下の2つの角度（度数法：Degree）を計算してStateに保持する。
     - **肩の傾き角度:** 左肩（left_shoulder）と右肩（right_shoulder）の座標から水平に対する傾きを算出（水平なら0度）。
     - **頭の傾き角度:** 左耳（left_ear）または左目と、右耳（right_ear）または右目の座標から、頭の水平に対する傾きを算出。
   - ※計算には `Math.atan2(dy, dx) * (180 / Math.PI)` 等を使用すること。
4. **リアルタイム・ダッシュボードUI:**
   - 映像の隅（または見やすい場所）に、計算された「肩の角度」「頭の角度」を大きくデジタル表示する。
   - 角度が一定の範囲を超えたら（例：肩が極端に右に下がっている等）、文字色を赤にするなどの視覚的フィードバックを入れる。

# Execution Rules
- `npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl @tensorflow-models/pose-detection` を実行して依存関係を追加すること。
- Reactの `useEffect` と `requestAnimationFrame` を用いて、ブラウザがフリーズしないように効率的な推論ループを構築すること。
- コードは1つのコンポーネント（例: `FluteFormAnalyzer.jsx`）にまとめても、適宜分割しても構いません。
- 最後に、開発サーバーを起動してブラウザで確認するための手順を出力してください。
