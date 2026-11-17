// 状態変化あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、大阪府教育委員会の中学1年理科プリント（解答）・群馬県・熊本県の教育委員会の指導案・広島県教育委員会の調査問題の解説・岩手県の教材・日本化学会「化学と教育」・宮城県総合教育センター・気象庁仙台管区気象台・札幌市教育委員会・香川大学の指導案（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、身のまわりの場面を見て、物質のすがたの変わり方（融解・凝固・蒸発・凝縮・昇華）を選ぶ。正解したら2段目「もとのすがたは？」を選ぶ。
// 気体から固体への変化は、資料によって呼び名（昇華・凝結など）が分かれるので扱わない。沸騰も扱わない。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    osaka: ["大阪府教育委員会「中学1年理科 状態変化」補充プリント（解答）", "https://www.pref.osaka.lg.jp/documents/25639/jyotai_hoju_kai_01_1.pdf"],
    gunma: ["群馬県教育委員会 中学1年理科「物質の状態変化」の学習指導案", "https://gunma-boe.gsn.ed.jp/wysiwyg/file/download/506/1530"],
    kuma: ["熊本県教育委員会 中学1年理科「状態変化」の学習構想案", "https://www.pref.kumamoto.jp/uploaded/attachment/125749.pdf"],
    hiro: ["広島県教育委員会 調査問題「状態変化のグラフ」の解説", "https://www.pref.hiroshima.lg.jp/uploaded/attachment/262893.pdf"],
    iwate: ["岩手県 化学基礎の教材「2-メチル-2-プロパノールの三態とヨウ素の昇華」", "https://www1.iwate-ed.jp/07tantou/kagaku/kagakukiso/kagakukiso%202/sapoto08.pdf"],
    csj: ["日本化学会「化学と教育」64巻7号 口絵「ナフタレンの昇華」", "https://edu.csj.jp/chemedu/colorimage/64/64_k26.pdf"],
    miyagi: ["宮城県総合教育センター 実験教室「−196℃の世界（液体窒素・その2）」", "https://www.edu-c.pref.miyagi.jp/midori/science/kagaku-junkai/junkaikyouzai/ekitaitisso_no2.pdf"],
    gunmak: ["群馬県教育委員会 オンラインサポート授業 理科「雲のでき方」要点資料", "https://www.pref.gunma.jp/uploaded/attachment/41452.pdf"],
    jma: ["気象庁 仙台管区気象台「雲ができる仕組み」", "https://www.data.jma.go.jp/sendai/knowledge/kyouiku/yoho/kumo_ws.pdf"],
    sapporo: ["札幌市教育委員会 中学2年理科 学習課題「大気中の水の変化」", "https://www.city.sapporo.jp/kyoiku/shido/documents/2_2_4_24new.pdf"],
    kagawa: ["香川大学教育学部附属坂出小学校 4年理科「すがたを変える水のゆくえ」の学習指導案", "https://www.ed.kagawa-u.ac.jp/~sakasho/takarabakotop/sidouanrika2.pdf"],
  };

  // 答えになる5つ
  const CLASSES = ["融解", "凝固", "蒸発", "凝縮", "昇華"];

  // 2段目「もとのすがたは？」の3つ（岩手県の教材の説明。水にも当てはまる言い方にする。CodeRabbit jotai-henka#1）
  const GROUPS = {
    ko: { name: "固体", sub: "粒子が決まった位置にある" },
    eki: { name: "液体", sub: "形は変わるが、体積はほとんど変わらない" },
    ki: { name: "気体", sub: "粒子の間が広く、体積が液体よりずっと大きい" },
  };
  // どう変わった（「なぜ」に出す）
  const CATS = { kotoeki: "固体→液体", ekitoko: "液体→固体", ekitoki: "液体→気体", kitoeki: "気体→液体", kotoki: "固体→気体（液体にならずに）" };
  // 答えごとの決まり。2段目・どう変わった・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "融解": { grp: "ko", cat: "kotoeki", key: "固体が液体に変わることを融解といいます。とけ始める温度が融点で、水の融点は0℃です。" },
    "凝固": { grp: "eki", cat: "ekitoko", key: "液体が固体に変わることを凝固といいます。" },
    "蒸発": { grp: "eki", cat: "ekitoki", key: "液体が気体に変わることを蒸発といいます。水は沸騰させなくても蒸発します。" },
    "凝縮": { grp: "ki", cat: "kitoeki", key: "気体が液体に変わることを凝縮といいます。雲や霧の学習では、水蒸気が水滴に変わることを凝結とよびます。" },
    "昇華": { grp: "ko", cat: "kotoki", key: "固体が液体にならずに、直接気体に変わることを昇華といいます。" },
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["実験した。", "観察した。", "身のまわりで。", "こんな場面。", "見つけた。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　すがたはどう変わった？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("y_kori", 0, "融解", "氷がとける", ["osaka", "hiro"], "かたい氷が、どうなったか。",
      "氷（固体）から水（液体）に状態が変化します（大阪府のプリント）。小さな氷ほど早くとけます（広島県の解説）。",
      ["コップに入れた氷が、とけて水になった。", "部屋に置いておいた氷が、少しずつとけて水になった。"]),
    K("g_kori", 0, "凝固", "水がこおる", ["kuma"], "水が冷やされました。",
      "水が氷に変わるのも状態変化です（熊本県の学習構想案）。液体が固体になる変化です。",
      ["水を冷凍庫に入れておくと、こおって氷になった。"]),
    K("j_sentaku", 0, "蒸発", "洗濯物がかわく", ["kagawa"], "ぬれていた水はどこへ行ったか。",
      "ぬれた洗濯物がかわくのは、水が蒸発して水蒸気になるからです（香川大学の指導案）。",
      ["ぬれた洗濯物を干しておくと、かわいた。"]),
    K("n_cup", 0, "凝縮", "冷たいグラスの水滴", ["gunmak", "jma"], "水滴は中の飲み物ではありません。",
      "冷たい飲み物を入れたグラスの水滴は、空気中の水蒸気が水滴になったものです（群馬県の要点資料・気象庁の教材）。",
      ["冷たい飲み物を入れたグラスの表面に、水滴がついた。", "冷蔵庫から出したコップのまわりに、水がついた。"]),
    K("s_dry", 0, "昇華", "ドライアイスが小さくなる", ["csj", "miyagi"], "液体のすがたは見えましたか。",
      "ドライアイス（固体の二酸化炭素）は、液体にならずに気体に変わります（日本化学会「化学と教育」・宮城県総合教育センター）。",
      ["皿に置いたドライアイスが、液体にならずに小さくなっていった。"]),
    // ---- ふつう ----
    K("y_rou", 1, "融解", "ろうを温める", ["csj", "iwate"], "かたいろうが温められました。",
      "ろうを加熱すると融解し、冷やすと凝固します（日本化学会「化学と教育」・岩手県の教材）。",
      ["固体のろうを温めると、とけて液体になった。"]),
    K("g_rou", 1, "凝固", "とけたろうが固まる", ["gunma", "csj"], "液体のろうが冷えました。",
      "液体のろうが固体になると、体積は変わりますが質量は変わりません（群馬県の指導案）。",
      ["とかしたろうを冷やすと、固まった。体積は変わったが、質量は変わらなかった。"]),
    K("j_mizutamari", 1, "蒸発", "水たまりが消える", ["kagawa"], "沸騰はしていません。",
      "水は沸騰させなくても蒸発し、日かげより日なたの方が速く空気中に出ていきます（香川大学の指導案）。",
      ["日なたの水たまりの水が、沸騰していないのに見えなくなった。"]),
    K("n_yuge", 1, "凝縮", "白い湯気", ["osaka"], "水蒸気は目に見えません。",
      "水蒸気は目に見えません。目に見える湯気は、水蒸気が冷えて液体になった水です（大阪府のプリント）。",
      ["やかんの口から出た目に見えない水蒸気が、冷えて白い湯気になった。"]),
    K("s_iodine", 1, "昇華", "ヨウ素を加熱する", ["iwate", "csj"], "とけて液体になったでしょうか。",
      "ヨウ素を加熱すると、固体から液体にならずに気体になります（岩手県の教材・日本化学会「化学と教育」）。",
      ["ヨウ素を加熱すると、液体にならずに気体になった。"]),
    // ---- むずかしい ----
    K("y_palm", 2, "融解", "パルミチン酸の温度", ["hiro", "osaka"], "温度が上がらないあいだ、何が起きていたか。",
      "融点は固体がとける温度です（広島県の解説）。状態変化しているあいだは、温度が変化しません（大阪府のプリント）。",
      ["固体のパルミチン酸を加熱すると、とけ始めてから全部とけるまで、温度が上がらなかった。"]),
    K("g_mp", 2, "凝固", "2-メチル-2-プロパノールを冷やす", ["iwate"], "融点は25℃です。",
      "2-メチル-2-プロパノールの融点（凝固点）は25℃で、氷で温度を下げると凝固します（岩手県の教材）。",
      ["液体の2-メチル-2-プロパノール（融点25℃）を氷で冷やすと、固まった。"]),
    K("j_ethanol", 2, "蒸発", "エタノールの袋がふくらむ", ["iwate", "kuma"], "袋の中の液体はどうなったか。",
      "エタノールが気化して気体になると、体積がとても大きくなります。気体の体積は液体の約1000倍です（岩手県の教材・熊本県の学習構想案）。",
      ["ポリエチレンの袋に少しのエタノールを入れて閉じ、熱い湯をかけると、袋が大きくふくらんだ。"]),
    K("n_kiri", 2, "凝縮", "霧が出る", ["sapporo", "jma"], "空気中の水蒸気が冷やされました。",
      "霧は、空気中の水蒸気が冷やされて水滴となって発生します（札幌市の学習課題）。雲や霧の学習では、この変化を凝結とよびます。",
      ["空気中の水蒸気が冷やされて水滴になり、霧が出た。"]),
    K("s_naph", 2, "昇華", "ナフタレンの昇華", ["csj"], "液体を通りましたか。",
      "ナフタレンは、固体から液体にならずに直接気体に変わる昇華を観察できる物質です（日本化学会「化学と教育」）。",
      ["固体のナフタレンが、液体にならずに直接気体に変わっていった。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "y_kori|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const JTH = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = JTH; else root.JTH = JTH;
})(typeof self !== "undefined" ? self : this);
