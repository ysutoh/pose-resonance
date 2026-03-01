# Role & Context
あなたはシニア・コンピュータビジョン・エンジニアです。
現在開発中のフルート奏者向けAI姿勢解析PWA「Pose Resonance」に対して、音響学的に極めて重要な新しい評価指標「Embouchure Alignment（アンブシュアの平行度）」を追加実装してください。
前回のアップデートで実装した「ベースライン機能」および「時系列チャート機能」の仕組みに、この新しい指標を統合します。

# New Metric Definition (新しい指標の定義)
フルートの管体と顔（唇）の角度のズレを計測するため、以下の計算ロジックを追加してください。
1. **Face Angle (顔の傾き):** `left_eye`（または `left_ear`）と `right_eye`（または `right_ear`）の座標から、水平に対する角度を算出。
2. **Flute Angle Proxy (楽器の傾き):** `left_wrist`（左手首）と `right_wrist`（右手首）の座標から、水平に対する角度を算出。
3. **Embouchure Alignment (平行度オフセット):** 上記2つの角度の差分（`Face Angle - Flute Angle Proxy`）を算出する。

# Implementation Requirements (実装要件)
以下の3点において、既存のコードを拡張してください。

1. **Dashboard UIの拡張:**
   - リアルタイムダッシュボードに「Embouchure Alignment」の項目を追加し、現在の角度差分を表示する。
2. **Set Baseline (キャリブレーション) への統合:**
   - 「Set Baseline」ボタンを押した際、肩や首のデータに加えて、この「Embouchure Alignment」の現在の平均値も「理想の基準値」としてStateに保存する。
   - 演奏中、現在のEmbouchure Alignmentの値が、保存した基準値から「±5度」以上ズレた場合（顔に対して腕が下がりすぎた、等）に、UI上で警告（赤色表示など）を行う。
3. **Session Chart (時系列グラフ) への統合:**
   - 1秒ごとの記録配列に「Embouchure Alignmentの基準値からのズレ」を追加する。
   - 「End Session」後の折れ線グラフ（recharts等）のラインの1つとして、この推移を可視化する。

# Execution Rules
- `Math.atan2(dy, dx) * (180 / Math.PI)` を用いて正確に角度を計算すること。
- 手首（wrist）や目（eye）のキーポイントの信頼度（score）が低い場合（カメラから見切れている場合など）は、計算をスキップするか、直前の値を保持してエラーを防ぐこと。
- 全ての差分コードを適用し終えたら、動作確認を促して完了とすること。