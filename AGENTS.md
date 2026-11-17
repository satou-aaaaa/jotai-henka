# AGENTS.md

状態変化あて：身のまわりの場面を見て、物質のすがたの変わり方（融解・凝固・蒸発・凝縮・昇華）を当てる1日5問の学習ゲーム。正解したら「もとのすがたは？」（固体・液体・気体）も選ぶ。`index.html` と `data.js`（問題の種類）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（15種類×3000問：選び肢・答えは1つ・答えと2段目とどう変わったが状態変化の表どおり・出典）・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 中身は大阪府教育委員会「中学1年理科 状態変化」補充プリント（解答。<https://www.pref.osaka.lg.jp/documents/25639/jyotai_hoju_kai_01_1.pdf>）・群馬県・熊本県の教育委員会の指導案・広島県教育委員会の調査問題の解説・岩手県の教材・日本化学会「化学と教育」・宮城県総合教育センター・気象庁仙台管区気象台・札幌市教育委員会・香川大学の指導案で確かめたことだけ（2026-11-17 に読んだ）。場面を足すときも出典に書いてあることだけにし、`qa/run.mjs` の `TB`（別に書いた表）にも足す。出典メモは共有フォルダ games/jotai-research.md。
- 問いに変わり方の名前（融解・凝固・蒸発・凝縮・昇華）を書かない（QA が見る）。気体から固体への変化（資料で呼び名が昇華・凝結に分かれる）は扱わない。沸騰の場面は蒸発と分けにくいので出さない（沸点のまめ知識はよい）。
- 答えの決まり（2段目・どこで・決め手）は `data.js` の `RULE` だけに書き、種類はそこから読む。`qa/run.mjs` の `CL` が別に書いた表で確かめる。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目「もとのすがたは？」・復習（1→3→7日後）。記録 `jth-v1`・文字 `jth-fs`・復習 `jth-depth`。
- 画面の土台は光の進み方あて（hikari-susumi。もとは無脊椎動物なかま分け・力の種類あて・季節の天気あて・気体あて・液性よみ・植物なかま分け・動物なかま分け・なに税？）から写した。写し元の言葉が残っていないかを QA が見る。
- 問題は、やさしいが選び肢3つ、ふつう・むずかしいが4つ（5つから）。2回目のヒントはまちがいを消して2つにしぼり、決め手（`key`）も見せる。
- 今日の5問（やさしい2・ふつう2・むずかしい1、種類は重ねない）・上級（むずかしい3、今日のむずかしいと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。乱数は `sort` の比較の中で引かない。`KINDS`・言い回しの並びは最後に足すだけ（QA の `PIN` が第1回の1問目を見る）。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。感想は Issue フォーム（`.github/ISSUE_TEMPLATE/feedback.yml`）を開くだけ。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）と引き継ぎ（`transfer.js`・`qa/transfer-check.mjs`）は shared-workflows `template/` の写しで、ここでは直さない。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
