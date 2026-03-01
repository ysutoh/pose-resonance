# Role & Context
あなたはシニア・フロントエンドエンジニアです。
現在開発中のフルート奏者向けAI姿勢解析PWA「Pose Resonance」に対して、セッション中の「音声録音」と、終了後の「グラフと音声の同期再生機能」を追加実装してください。
ユーザーが「姿勢が崩れた瞬間の実際の音色」を耳で確認できるようにすることが目的です。

# Implementation Requirements (実装要件)

以下の3つのステップで機能を既存のコードに統合してください。

## 1. 楽器に最適化したマイク録音機能
- セッション開始（Start Session）と同時に、`navigator.mediaDevices.getUserMedia` を使用してマイク入力を取得し、`MediaRecorder` で録音を開始する。
- **重要:** 以前の実装と同様に、フルートの音色を劣化させないため、音声トラックの `constraints` にて以下を必ず無効化（`false`）すること。
  - `echoCancellation: false`
  - `noiseSuppression: false`
  - `autoGainControl: false`
- セッション終了（End Session）時に録音を停止し、音声データを `Blob` として保存し、再生用の `URL.createObjectURL` を生成する。

## 2. プレイバックUIの追加
- セッション終了後に表示されるグラフ（Chart）の付近に、録音した音声を再生するための `<audio controls>` 要素を配置する。

## 3. グラフと音声再生の同期（Synchronized Playback）
- `<audio>` 要素の `onTimeUpdate` イベントを利用し、現在の再生時間（`currentTime`）をStateとして取得する。
- チャートライブラリ（recharts等）の機能を利用し、グラフ上に「現在の再生時間」を示す縦線（`ReferenceLine` 等）を動的に描画する。
- これにより、音声が再生されるのに合わせて、グラフ上の縦線が左から右へと移動し、「今鳴っている音が、グラフのどの姿勢データの時のものか」が視覚的にリンクするようにする。
- （可能であれば）グラフ上をクリックした際、そのX軸の時間に合わせて `<audio>` の `currentTime` を変更（シーク）できるようにする。

# Execution Rules
- `MediaRecorder` や `Audio` 関連のState管理が複雑になるため、必要に応じてカスタムフック（例: `useAudioRecorder.js`）等にロジックを分離してコンポーネントをクリーンに保つこと。
- Reactの再レンダリングによるパフォーマンス低下を防ぐため、`currentTime` の更新頻度は適切に制御すること。
- コードの追加が完了したら、ホストPC側からマイクを許可して動作確認を行うための手順を案内して完了とすること。