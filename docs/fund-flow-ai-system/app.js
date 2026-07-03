const themes = [
  {
    id: "jp-semiconductor",
    name: "半導体製造装置",
    assetClass: "日本株・テクノロジー",
    region: "日本",
    stage: "emerging",
    keywords: ["半導体", "製造装置", "AI", "東証プライム"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 87, volume: 84, fundFlow: 76, breadth: 72, news: 82, ai: 84, crowdedness: 61, confidence: 86 },
      "30d": { momentum: 78, volume: 74, fundFlow: 70, breadth: 66, news: 77, ai: 80, crowdedness: 64, confidence: 88 },
      "90d": { momentum: 70, volume: 67, fundFlow: 63, breadth: 59, news: 72, ai: 76, crowdedness: 69, confidence: 86 }
    },
    instruments: [
      { ticker: "8035", name: "東京エレクトロン", type: "大型株", strength: 86, warning: "混雑" },
      { ticker: "6857", name: "アドバンテスト", type: "大型株", strength: 84, warning: "値動き大" },
      { ticker: "7735", name: "SCREENホールディングス", type: "大型株", strength: 76, warning: "" },
      { ticker: "1321", name: "日経225連動型上場投信", type: "東証ETF", strength: 66, warning: "" }
    ],
    drivers: ["AI向け投資の継続", "日本の半導体サプライチェーン再評価", "円安による外需株支援"]
  },
  {
    id: "jp-defense",
    name: "防衛・重工",
    assetClass: "日本株・政策",
    region: "日本",
    stage: "continuing",
    keywords: ["防衛", "重工", "政策", "宇宙", "造船"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 80, volume: 78, fundFlow: 74, breadth: 75, news: 84, ai: 81, crowdedness: 66, confidence: 84 },
      "30d": { momentum: 84, volume: 80, fundFlow: 78, breadth: 77, news: 86, ai: 83, crowdedness: 71, confidence: 85 },
      "90d": { momentum: 78, volume: 73, fundFlow: 72, breadth: 72, news: 80, ai: 78, crowdedness: 68, confidence: 84 }
    },
    instruments: [
      { ticker: "7011", name: "三菱重工業", type: "大型株", strength: 86, warning: "混雑" },
      { ticker: "7012", name: "川崎重工業", type: "大型株", strength: 78, warning: "" },
      { ticker: "7013", name: "IHI", type: "大型株", strength: 74, warning: "" },
      { ticker: "6208", name: "石川製作所", type: "中小型株", strength: 68, warning: "流動性注意" }
    ],
    drivers: ["防衛費拡大の政策テーマ", "宇宙・航空エンジンへの期待", "海外投資家による日本テーマ買い"]
  },
  {
    id: "jp-banks",
    name: "銀行・金利上昇メリット",
    assetClass: "日本株・金融",
    region: "日本",
    stage: "emerging",
    keywords: ["銀行", "金利", "日銀", "利ざや", "メガバンク"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 82, volume: 81, fundFlow: 78, breadth: 80, news: 76, ai: 82, crowdedness: 49, confidence: 90 },
      "30d": { momentum: 73, volume: 72, fundFlow: 71, breadth: 72, news: 70, ai: 76, crowdedness: 46, confidence: 90 },
      "90d": { momentum: 68, volume: 66, fundFlow: 67, breadth: 70, news: 66, ai: 73, crowdedness: 43, confidence: 89 }
    },
    instruments: [
      { ticker: "8306", name: "三菱UFJフィナンシャル・グループ", type: "大型株", strength: 82, warning: "" },
      { ticker: "8316", name: "三井住友フィナンシャルグループ", type: "大型株", strength: 80, warning: "" },
      { ticker: "8411", name: "みずほフィナンシャルグループ", type: "大型株", strength: 74, warning: "" },
      { ticker: "1615", name: "東証銀行業株価指数連動型ETF", type: "東証ETF", strength: 77, warning: "" }
    ],
    drivers: ["日銀の政策正常化観測", "長期金利上昇による利ざや改善期待", "高配当・低PBR銘柄への資金流入"]
  },
  {
    id: "jp-electric-power",
    name: "電力・原子力再稼働",
    assetClass: "日本株・エネルギー",
    region: "日本",
    stage: "continuing",
    keywords: ["電力", "原子力", "再稼働", "データセンター", "電力需要"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 76, volume: 82, fundFlow: 69, breadth: 73, news: 78, ai: 77, crowdedness: 58, confidence: 82 },
      "30d": { momentum: 79, volume: 76, fundFlow: 72, breadth: 75, news: 80, ai: 78, crowdedness: 63, confidence: 83 },
      "90d": { momentum: 72, volume: 70, fundFlow: 66, breadth: 68, news: 76, ai: 75, crowdedness: 60, confidence: 82 }
    },
    instruments: [
      { ticker: "9501", name: "東京電力ホールディングス", type: "大型株", strength: 77, warning: "値動き大" },
      { ticker: "9503", name: "関西電力", type: "大型株", strength: 75, warning: "" },
      { ticker: "9502", name: "中部電力", type: "大型株", strength: 69, warning: "" },
      { ticker: "9513", name: "電源開発", type: "大型株", strength: 68, warning: "" }
    ],
    drivers: ["電力需要増加への思惑", "原子力再稼働テーマ", "AIデータセンター投資との関連"]
  },
  {
    id: "jp-trading-houses",
    name: "総合商社・資源",
    assetClass: "日本株・バリュー",
    region: "日本",
    stage: "continuing",
    keywords: ["商社", "資源", "高配当", "円安", "株主還元"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 67, volume: 64, fundFlow: 71, breadth: 70, news: 62, ai: 72, crowdedness: 54, confidence: 88 },
      "30d": { momentum: 71, volume: 67, fundFlow: 75, breadth: 73, news: 66, ai: 75, crowdedness: 57, confidence: 89 },
      "90d": { momentum: 76, volume: 69, fundFlow: 78, breadth: 75, news: 68, ai: 77, crowdedness: 62, confidence: 89 }
    },
    instruments: [
      { ticker: "8001", name: "伊藤忠商事", type: "大型株", strength: 73, warning: "" },
      { ticker: "8058", name: "三菱商事", type: "大型株", strength: 72, warning: "" },
      { ticker: "8031", name: "三井物産", type: "大型株", strength: 71, warning: "" },
      { ticker: "1306", name: "TOPIX連動型上場投信", type: "東証ETF", strength: 64, warning: "" }
    ],
    drivers: ["資源価格の底堅さ", "株主還元と高配当への需要", "海外投資家の日本バリュー株買い"]
  },
  {
    id: "jp-gold",
    name: "金・インフレヘッジ",
    assetClass: "東証ETF・コモディティ",
    region: "日本",
    stage: "continuing",
    keywords: ["金", "純金信託", "インフレ", "円安", "地政学"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 70, volume: 66, fundFlow: 78, breadth: 58, news: 69, ai: 75, crowdedness: 64, confidence: 87 },
      "30d": { momentum: 76, volume: 70, fundFlow: 82, breadth: 61, news: 73, ai: 78, crowdedness: 68, confidence: 88 },
      "90d": { momentum: 82, volume: 75, fundFlow: 85, breadth: 63, news: 77, ai: 82, crowdedness: 73, confidence: 88 }
    },
    instruments: [
      { ticker: "1540", name: "純金上場信託", type: "東証ETF", strength: 78, warning: "" },
      { ticker: "1328", name: "金価格連動型上場投信", type: "東証ETF", strength: 72, warning: "" },
      { ticker: "5713", name: "住友金属鉱山", type: "大型株", strength: 62, warning: "" }
    ],
    drivers: ["円建て金価格の上昇", "インフレ・地政学リスクのヘッジ需要", "個人投資家の現物資産志向"]
  },
  {
    id: "jp-inbound",
    name: "インバウンド・消費",
    assetClass: "日本株・内需",
    region: "日本",
    stage: "emerging",
    keywords: ["インバウンド", "百貨店", "鉄道", "ホテル", "訪日客"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 74, volume: 76, fundFlow: 68, breadth: 72, news: 73, ai: 72, crowdedness: 45, confidence: 80 },
      "30d": { momentum: 66, volume: 65, fundFlow: 62, breadth: 66, news: 68, ai: 68, crowdedness: 42, confidence: 81 },
      "90d": { momentum: 60, volume: 58, fundFlow: 59, breadth: 61, news: 65, ai: 65, crowdedness: 39, confidence: 79 }
    },
    instruments: [
      { ticker: "3099", name: "三越伊勢丹ホールディングス", type: "大型株", strength: 75, warning: "" },
      { ticker: "9201", name: "日本航空", type: "大型株", strength: 66, warning: "" },
      { ticker: "9020", name: "東日本旅客鉄道", type: "大型株", strength: 61, warning: "" },
      { ticker: "4661", name: "オリエンタルランド", type: "大型株", strength: 64, warning: "" }
    ],
    drivers: ["訪日客消費の回復", "円安による購買力増加", "百貨店・交通・レジャーへの波及"]
  },
  {
    id: "jp-small-growth",
    name: "グロース250・中小型成長株",
    assetClass: "日本株・グロース",
    region: "日本",
    stage: "crowded",
    keywords: ["グロース250", "中小型", "個人投資家", "金利低下"],
    liquidityWarning: true,
    metrics: {
      "7d": { momentum: 73, volume: 79, fundFlow: 64, breadth: 55, news: 58, ai: 62, crowdedness: 82, confidence: 70 },
      "30d": { momentum: 81, volume: 84, fundFlow: 69, breadth: 59, news: 62, ai: 65, crowdedness: 87, confidence: 72 },
      "90d": { momentum: 62, volume: 68, fundFlow: 55, breadth: 47, news: 53, ai: 58, crowdedness: 74, confidence: 70 }
    },
    instruments: [
      { ticker: "2516", name: "東証グロース250 ETF", type: "東証ETF", strength: 67, warning: "流動性注意" },
      { ticker: "4483", name: "JMDC", type: "中型株", strength: 62, warning: "値動き大" },
      { ticker: "4478", name: "フリー", type: "中型株", strength: 60, warning: "値動き大" }
    ],
    drivers: ["個人投資家のリスク選好回復", "金利低下局面への期待", "大型株から出遅れ株への循環"]
  },
  {
    id: "jpy-exporters",
    name: "円安メリット・輸出株",
    assetClass: "日本株・外需",
    region: "日本",
    stage: "continuing",
    keywords: ["円安", "輸出", "自動車", "機械", "為替"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 65, volume: 63, fundFlow: 66, breadth: 67, news: 70, ai: 71, crowdedness: 52, confidence: 86 },
      "30d": { momentum: 72, volume: 68, fundFlow: 72, breadth: 70, news: 74, ai: 75, crowdedness: 58, confidence: 87 },
      "90d": { momentum: 75, volume: 70, fundFlow: 74, breadth: 72, news: 77, ai: 76, crowdedness: 61, confidence: 87 }
    },
    instruments: [
      { ticker: "7203", name: "トヨタ自動車", type: "大型株", strength: 74, warning: "" },
      { ticker: "7267", name: "ホンダ", type: "大型株", strength: 67, warning: "" },
      { ticker: "6954", name: "ファナック", type: "大型株", strength: 64, warning: "" },
      { ticker: "6503", name: "三菱電機", type: "大型株", strength: 66, warning: "" }
    ],
    drivers: ["ドル円の円安基調", "外需企業の採算改善期待", "海外売上比率の高い企業への資金流入"]
  },
  {
    id: "jp-reits",
    name: "J-REIT・利回り資産",
    assetClass: "REIT・利回り",
    region: "日本",
    stage: "emerging",
    keywords: ["J-REIT", "不動産", "利回り", "日銀", "金利"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 69, volume: 72, fundFlow: 70, breadth: 71, news: 60, ai: 68, crowdedness: 38, confidence: 83 },
      "30d": { momentum: 61, volume: 64, fundFlow: 65, breadth: 64, news: 57, ai: 63, crowdedness: 35, confidence: 84 },
      "90d": { momentum: 55, volume: 59, fundFlow: 60, breadth: 58, news: 55, ai: 60, crowdedness: 32, confidence: 83 }
    },
    instruments: [
      { ticker: "1343", name: "NEXT FUNDS 東証REIT指数連動型上場投信", type: "東証ETF", strength: 69, warning: "" },
      { ticker: "8951", name: "日本ビルファンド投資法人", type: "J-REIT", strength: 64, warning: "" },
      { ticker: "3283", name: "日本プロロジスリート投資法人", type: "J-REIT", strength: 62, warning: "" }
    ],
    drivers: ["利回り資産への見直し", "金利上昇一服への期待", "物流・都心オフィスの選別買い"]
  }
];

themes.push(
  {
    id: "jp-auto",
    name: "自動車・部品",
    assetClass: "日本株・外需",
    region: "日本",
    stage: "continuing",
    keywords: ["自動車", "部品", "EV", "円安", "輸出"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 63, volume: 62, fundFlow: 64, breadth: 66, news: 61, ai: 66, crowdedness: 48, confidence: 84 },
      "30d": { momentum: 68, volume: 65, fundFlow: 68, breadth: 68, news: 65, ai: 69, crowdedness: 53, confidence: 85 },
      "90d": { momentum: 72, volume: 69, fundFlow: 72, breadth: 70, news: 69, ai: 71, crowdedness: 57, confidence: 85 }
    },
    instruments: [
      { ticker: "7203", name: "トヨタ自動車", type: "大型株", strength: 72, warning: "" },
      { ticker: "7267", name: "ホンダ", type: "大型株", strength: 66, warning: "" },
      { ticker: "6902", name: "デンソー", type: "大型株", strength: 64, warning: "" }
    ],
    drivers: ["円安による採算改善", "北米販売の底堅さ", "部品・EV投資の見直し"]
  },
  {
    id: "jp-pharma",
    name: "医薬品・ヘルスケア",
    assetClass: "日本株・ディフェンシブ",
    region: "日本",
    stage: "continuing",
    keywords: ["医薬品", "ヘルスケア", "ディフェンシブ", "新薬"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 58, volume: 56, fundFlow: 61, breadth: 63, news: 58, ai: 62, crowdedness: 34, confidence: 86 },
      "30d": { momentum: 60, volume: 58, fundFlow: 62, breadth: 64, news: 59, ai: 63, crowdedness: 35, confidence: 86 },
      "90d": { momentum: 57, volume: 55, fundFlow: 59, breadth: 62, news: 57, ai: 61, crowdedness: 33, confidence: 85 }
    },
    instruments: [
      { ticker: "4502", name: "武田薬品工業", type: "大型株", strength: 61, warning: "" },
      { ticker: "4568", name: "第一三共", type: "大型株", strength: 65, warning: "" },
      { ticker: "4519", name: "中外製薬", type: "大型株", strength: 63, warning: "" }
    ],
    drivers: ["ディフェンシブ資金の受け皿", "新薬パイプライン期待", "景気変動に左右されにくい収益"]
  },
  {
    id: "jp-telecom",
    name: "通信・通信インフラ",
    assetClass: "日本株・ディフェンシブ",
    region: "日本",
    stage: "continuing",
    keywords: ["通信", "5G", "データセンター", "高配当"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 60, volume: 59, fundFlow: 63, breadth: 65, news: 57, ai: 63, crowdedness: 41, confidence: 88 },
      "30d": { momentum: 58, volume: 57, fundFlow: 61, breadth: 63, news: 56, ai: 62, crowdedness: 40, confidence: 88 },
      "90d": { momentum: 55, volume: 55, fundFlow: 60, breadth: 61, news: 55, ai: 60, crowdedness: 39, confidence: 87 }
    },
    instruments: [
      { ticker: "9432", name: "NTT", type: "大型株", strength: 63, warning: "" },
      { ticker: "9433", name: "KDDI", type: "大型株", strength: 62, warning: "" },
      { ticker: "9434", name: "ソフトバンク", type: "大型株", strength: 60, warning: "" }
    ],
    drivers: ["高配当需要", "通信インフラの安定収益", "データセンター需要との関連"]
  },
  {
    id: "jp-retail",
    name: "小売・専門店",
    assetClass: "日本株・内需",
    region: "日本",
    stage: "emerging",
    keywords: ["小売", "専門店", "賃上げ", "消費", "インバウンド"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 72, volume: 74, fundFlow: 67, breadth: 69, news: 70, ai: 69, crowdedness: 50, confidence: 79 },
      "30d": { momentum: 66, volume: 64, fundFlow: 61, breadth: 64, news: 65, ai: 65, crowdedness: 46, confidence: 80 },
      "90d": { momentum: 59, volume: 58, fundFlow: 57, breadth: 60, news: 60, ai: 61, crowdedness: 42, confidence: 79 }
    },
    instruments: [
      { ticker: "9983", name: "ファーストリテイリング", type: "大型株", strength: 69, warning: "" },
      { ticker: "7532", name: "パン・パシフィック", type: "大型株", strength: 66, warning: "" },
      { ticker: "8267", name: "イオン", type: "大型株", strength: 61, warning: "" }
    ],
    drivers: ["賃上げによる消費回復期待", "インバウンド消費の波及", "専門店の既存店売上改善"]
  },
  {
    id: "jp-construction",
    name: "建設・インフラ更新",
    assetClass: "日本株・インフラ",
    region: "日本",
    stage: "emerging",
    keywords: ["建設", "インフラ", "国土強靭化", "防災", "再開発"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 75, volume: 73, fundFlow: 70, breadth: 73, news: 72, ai: 71, crowdedness: 47, confidence: 82 },
      "30d": { momentum: 67, volume: 65, fundFlow: 64, breadth: 67, news: 66, ai: 66, crowdedness: 44, confidence: 83 },
      "90d": { momentum: 61, volume: 60, fundFlow: 59, breadth: 62, news: 61, ai: 62, crowdedness: 40, confidence: 82 }
    },
    instruments: [
      { ticker: "1801", name: "大成建設", type: "大型株", strength: 66, warning: "" },
      { ticker: "1802", name: "大林組", type: "大型株", strength: 65, warning: "" },
      { ticker: "1803", name: "清水建設", type: "大型株", strength: 63, warning: "" }
    ],
    drivers: ["インフラ更新需要", "防災・国土強靭化", "都市再開発の継続"]
  },
  {
    id: "jp-insurance",
    name: "保険・金融再評価",
    assetClass: "日本株・金融",
    region: "日本",
    stage: "emerging",
    keywords: ["保険", "金融", "金利", "政策保有株", "自社株買い"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 79, volume: 76, fundFlow: 75, breadth: 77, news: 72, ai: 76, crowdedness: 52, confidence: 87 },
      "30d": { momentum: 72, volume: 70, fundFlow: 70, breadth: 72, news: 67, ai: 71, crowdedness: 48, confidence: 87 },
      "90d": { momentum: 66, volume: 64, fundFlow: 65, breadth: 68, news: 63, ai: 68, crowdedness: 45, confidence: 86 }
    },
    instruments: [
      { ticker: "8766", name: "東京海上HD", type: "大型株", strength: 76, warning: "" },
      { ticker: "8630", name: "SOMPO HD", type: "大型株", strength: 72, warning: "" },
      { ticker: "8725", name: "MS&AD", type: "大型株", strength: 71, warning: "" }
    ],
    drivers: ["金利上昇メリット", "政策保有株の売却期待", "株主還元の強化"]
  },
  {
    id: "jp-chemical",
    name: "化学・半導体材料",
    assetClass: "日本株・素材",
    region: "日本",
    stage: "emerging",
    keywords: ["化学", "半導体材料", "電子材料", "機能材"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 77, volume: 75, fundFlow: 72, breadth: 70, news: 73, ai: 75, crowdedness: 55, confidence: 82 },
      "30d": { momentum: 68, volume: 66, fundFlow: 66, breadth: 65, news: 66, ai: 68, crowdedness: 51, confidence: 82 },
      "90d": { momentum: 60, volume: 59, fundFlow: 58, breadth: 59, news: 60, ai: 62, crowdedness: 46, confidence: 81 }
    },
    instruments: [
      { ticker: "4063", name: "信越化学工業", type: "大型株", strength: 72, warning: "" },
      { ticker: "4188", name: "三菱ケミカルグループ", type: "大型株", strength: 64, warning: "" },
      { ticker: "4004", name: "レゾナックHD", type: "大型株", strength: 66, warning: "値動き大" }
    ],
    drivers: ["半導体材料需要の回復", "電子材料の在庫調整一巡", "AI投資の周辺波及"]
  },
  {
    id: "jp-low-pbr",
    name: "低PBR・東証改革",
    assetClass: "日本株・バリュー",
    region: "日本",
    stage: "emerging",
    keywords: ["低PBR", "東証改革", "資本効率", "自社株買い"],
    liquidityWarning: false,
    metrics: {
      "7d": { momentum: 76, volume: 74, fundFlow: 72, breadth: 78, news: 74, ai: 75, crowdedness: 50, confidence: 86 },
      "30d": { momentum: 68, volume: 67, fundFlow: 66, breadth: 72, news: 68, ai: 69, crowdedness: 46, confidence: 86 },
      "90d": { momentum: 62, volume: 61, fundFlow: 60, breadth: 67, news: 63, ai: 65, crowdedness: 42, confidence: 85 }
    },
    instruments: [
      { ticker: "1306", name: "TOPIX連動型上場投信", type: "東証ETF", strength: 66, warning: "" },
      { ticker: "8411", name: "みずほフィナンシャルグループ", type: "大型株", strength: 68, warning: "" },
      { ticker: "8058", name: "三菱商事", type: "大型株", strength: 67, warning: "" }
    ],
    drivers: ["東証による資本効率改善要請", "自社株買い期待", "低PBR銘柄の再評価"]
  }
);

const state = {
  period: "90d",
  assetClass: "all",
  stage: "all",
  search: "",
  hideCrowded: false,
  liquidityOnly: false,
  selectedId: themes[0].id,
  mapZoom: 1,
  mapFullscreen: false,
  dataSource: "sample",
  dataMessage: "",
  macroSignals: null,
  instrumentQuotes: {},
  aiResearch: null,
  aiResearchMessage: "",
  integratedRanking: null,
  integratedRankingHistory: null,
  integratedRankingComparisons: null,
  integratedRankingMessage: "",
  marketStatus: { state: "pending", text: "確認中" },
  geminiStatus: { state: "pending", text: "確認中" },
  macroStatus: { state: "pending", text: "確認中" },
  previousRanks: {},
  publicRankHistory: null,
  isPro: true
};

const PRO_CHECKOUT_URL = "";

const weights = {
  momentum: 0.22,
  volume: 0.18,
  fundFlow: 0.24,
  breadth: 0.16,
  news: 0.10,
  ai: 0.10,
  crowdedness: -0.12
};

const labels = {
  emerging: "新規浮上",
  continuing: "継続",
  crowded: "過熱"
};

const themeIcons = {
  "jp-semiconductor": "🖥",
  "jp-defense": "🛡",
  "jp-banks": "🏧",
  "jp-electric-power": "⚡",
  "jp-trading-houses": "🛢",
  "jp-gold": "🥇",
  "jp-inbound": "🍎",
  "jp-small-growth": "🪙",
  "jpy-exporters": "🚗",
  "jp-reits": "🏠",
  "jp-auto": "🚙",
  "jp-pharma": "💊",
  "jp-telecom": "📡",
  "jp-retail": "🛒",
  "jp-construction": "🏗",
  "jp-insurance": "☂",
  "jp-chemical": "🧪",
  "jp-low-pbr": "📘"
};

const extraInstrumentsByTheme = {
  "jp-semiconductor": [
    { ticker: "6723", name: "ルネサスエレクトロニクス", type: "大型株", strength: 70, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "6146", name: "ディスコ", type: "大型株", strength: 78, warning: "値動き大", quality: "業績良好候補", newsRisk: "材料確認" },
    { ticker: "6920", name: "レーザーテック", type: "大型株", strength: 72, warning: "混雑", quality: "高成長候補", newsRisk: "過熱確認" }
  ],
  "jp-banks": [
    { ticker: "8308", name: "りそなホールディングス", type: "大型株", strength: 71, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "7182", name: "ゆうちょ銀行", type: "大型株", strength: 66, warning: "", quality: "安定業績候補", newsRisk: "悪材料未検出" },
    { ticker: "7167", name: "めぶきフィナンシャルグループ", type: "中型株", strength: 63, warning: "", quality: "地銀見直し候補", newsRisk: "悪材料未検出" }
  ],
  "jp-electric-power": [
    { ticker: "9508", name: "九州電力", type: "大型株", strength: 74, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "9506", name: "東北電力", type: "大型株", strength: 67, warning: "", quality: "改善候補", newsRisk: "悪材料未検出" },
    { ticker: "9504", name: "中国電力", type: "大型株", strength: 64, warning: "", quality: "改善候補", newsRisk: "悪材料未検出" }
  ],
  "jp-trading-houses": [
    { ticker: "8015", name: "豊田通商", type: "大型株", strength: 70, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "8053", name: "住友商事", type: "大型株", strength: 68, warning: "", quality: "高配当候補", newsRisk: "悪材料未検出" },
    { ticker: "2768", name: "双日", type: "中型株", strength: 63, warning: "", quality: "割安見直し候補", newsRisk: "悪材料未検出" }
  ],
  "jp-reits": [
    { ticker: "8952", name: "ジャパンリアルエステイト投資法人", type: "J-REIT", strength: 65, warning: "", quality: "安定利回り候補", newsRisk: "悪材料未検出" },
    { ticker: "8953", name: "日本都市ファンド投資法人", type: "J-REIT", strength: 62, warning: "", quality: "分散型候補", newsRisk: "悪材料未検出" },
    { ticker: "3462", name: "野村不動産マスターファンド投資法人", type: "J-REIT", strength: 61, warning: "", quality: "安定利回り候補", newsRisk: "悪材料未検出" }
  ],
  "jpy-exporters": [
    { ticker: "6301", name: "小松製作所", type: "大型株", strength: 68, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "6501", name: "日立製作所", type: "大型株", strength: 76, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "6981", name: "村田製作所", type: "大型株", strength: 65, warning: "", quality: "回復候補", newsRisk: "悪材料未検出" }
  ],
  "jp-auto": [
    { ticker: "7201", name: "日産自動車", type: "大型株", strength: 58, warning: "材料確認", quality: "再建候補", newsRisk: "材料確認" },
    { ticker: "7270", name: "SUBARU", type: "大型株", strength: 66, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "6902", name: "デンソー", type: "大型株", strength: 68, warning: "", quality: "部品優良候補", newsRisk: "悪材料未検出" }
  ],
  "jp-insurance": [
    { ticker: "8750", name: "第一生命ホールディングス", type: "大型株", strength: 69, warning: "", quality: "業績良好候補", newsRisk: "悪材料未検出" },
    { ticker: "8795", name: "T&Dホールディングス", type: "大型株", strength: 65, warning: "", quality: "金利恩恵候補", newsRisk: "悪材料未検出" }
  ]
};

const mapPositions = {
  "jp-banks": { x: 13, y: 10 },
  "jp-gold": { x: 13, y: 32 },
  "jp-insurance": { x: 13, y: 58 },
  "jp-small-growth": { x: 13, y: 84 },
  "jp-semiconductor": { x: 39, y: 10 },
  "jp-chemical": { x: 39, y: 34 },
  "jp-reits": { x: 39, y: 58 },
  "jp-inbound": { x: 39, y: 84 },
  "jp-low-pbr": { x: 65, y: 16 },
  "jp-electric-power": { x: 65, y: 40 },
  "jp-construction": { x: 65, y: 66 },
  "jp-pharma": { x: 65, y: 90 },
  "jp-defense": { x: 88, y: 10 },
  "jp-trading-houses": { x: 88, y: 34 },
  "jp-auto": { x: 88, y: 58 },
  "jpy-exporters": { x: 88, y: 82 },
  "jp-telecom": { x: 88, y: 94 },
  "jp-retail": { x: 52, y: 76 }
};

const flowRoutes = [
  ["jp-banks", "jp-semiconductor"],
  ["jp-semiconductor", "jp-electric-power"],
  ["jp-electric-power", "jp-reits"],
  ["jp-semiconductor", "jp-defense"],
  ["jp-semiconductor", "jp-gold"],
  ["jp-gold", "jp-reits"],
  ["jp-banks", "jp-insurance"],
  ["jp-semiconductor", "jp-chemical"],
  ["jp-inbound", "jp-retail"],
  ["jp-electric-power", "jp-construction"],
  ["jp-trading-houses", "jp-low-pbr"],
  ["jp-small-growth", "jp-inbound"],
  ["jpy-exporters", "jp-trading-houses"],
  ["jp-banks", "jp-reits"]
];

function calculateScore(theme, period) {
  const m = theme.metrics[period];
  const base =
    m.momentum * weights.momentum +
    m.volume * weights.volume +
    m.fundFlow * weights.fundFlow +
    m.breadth * weights.breadth +
    m.news * weights.news +
    m.ai * weights.ai +
    m.crowdedness * weights.crowdedness;
  const penalty = state.hideCrowded && theme.stage === "crowded" ? 8 : 0;
  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

function acceleration(theme) {
  const m7 = theme.metrics["7d"];
  const m30 = theme.metrics["30d"];
  const flowDelta = m7.fundFlow - m30.fundFlow;
  const scoreDelta = calculateRaw(m7) - calculateRaw(m30);
  return Math.round(flowDelta * 0.55 + scoreDelta * 0.35 + m7.volume * 0.06);
}

function calculateRaw(m) {
  return (
    m.momentum * weights.momentum +
    m.volume * weights.volume +
    m.fundFlow * weights.fundFlow +
    m.breadth * weights.breadth +
    m.news * weights.news +
    m.ai * weights.ai +
    m.crowdedness * weights.crowdedness
  );
}

function fundAmount(theme, period = state.period) {
  const m = theme.metrics[period];
  const overheatPenalty = Math.max(0, m.crowdedness - 65) * 0.35;
  const shortSurgePenalty = period === "7d" && theme.metrics["7d"].fundFlow - theme.metrics["30d"].fundFlow > 12 ? 6 : 0;
  return clamp(Math.round(calculateScore(theme, period) * 0.6 + m.fundFlow * 0.4 - overheatPenalty - shortSurgePenalty));
}

function spreadScore(theme, period = state.period) {
  const m = theme.metrics[period];
  return Math.round(m.breadth * 0.72 + Math.max(0, acceleration(theme)) * 0.28);
}

function accelerationForPeriod(theme, period) {
  if (period === "90d") {
    return Math.round(calculateRaw(theme.metrics["90d"]) - 50);
  }
  if (period === "30d") {
    return Math.round(calculateRaw(theme.metrics["30d"]) - calculateRaw(theme.metrics["90d"]));
  }
  return acceleration(theme);
}

function lifecycleStageForPeriod(theme, period) {
  const amount = fundAmount(theme, period);
  const accel = accelerationForPeriod(theme, period);
  const overheat = theme.metrics[period].crowdedness;
  if (amount >= 78 && (accel < 12 || overheat >= 74)) {
    return { icon: "🌳", label: "成熟期", decision: "追いかけ買い注意" };
  }
  if (amount >= 40 && amount <= 70 && accel >= 20 && overheat < 70) {
    return { icon: "🌿", label: "成長期", decision: "銘柄調査開始" };
  }
  if (amount < 45 && accel > 0) {
    return { icon: "🌱", label: "発芽期", decision: "監視開始" };
  }
  if (accel < 0 || overheat >= 82) {
    return { icon: "🍂", label: "衰退期", decision: "次の移動先確認" };
  }
  return { icon: "🌿", label: "成長期", decision: "条件確認" };
}

function accelerationColor(value) {
  if (value >= 45) return "#15803d";
  if (value >= 20) return "#65a30d";
  if (value >= 0) return "#b45309";
  if (value >= -15) return "#ea580c";
  return "#b91c1c";
}

function accelerationLabel(value) {
  if (value >= 45) return "強い加速";
  if (value >= 20) return "加速";
  if (value >= 0) return "横ばい";
  if (value >= -15) return "鈍化";
  return "マイナス";
}

function periodLabel(period = state.period) {
  if (period === "90d") return "90日";
  if (period === "30d") return "30日";
  return "7日";
}

function moneyMarks(amount) {
  const count = Math.max(1, Math.min(5, Math.ceil(amount / 20)));
  return "💰".repeat(count);
}

function lifecycleStage(theme) {
  const amount = fundAmount(theme);
  const accel = acceleration(theme);
  const overheat = theme.metrics[state.period].crowdedness;
  if (amount >= 78 && (accel < 12 || overheat >= 74)) {
    return { icon: "🌳", label: "成熟期", decision: "追いかけ買い注意。次の派生先を確認。" };
  }
  if (amount >= 40 && amount <= 70 && accel >= 20 && overheat < 70) {
    return { icon: "🌿", label: "成長期", decision: "銘柄調査開始" };
  }
  if (amount < 45 && accel > 0) {
    return { icon: "🌱", label: "発芽期", decision: "監視開始" };
  }
  if (accel < 0 || overheat >= 82) {
    return { icon: "🍂", label: "衰退期", decision: "資金の移動先を確認" };
  }
  return { icon: "🌿", label: "成長期", decision: "条件確認" };
}

function actionStageForTheme(theme) {
  const m = theme.metrics[state.period];
  const score = calculateScore(theme, state.period);
  const accel = accelerationForPeriod(theme, state.period);
  const spread = spreadScore(theme);

  if (m.crowdedness >= 78 || (m.fundFlow >= 78 && accel <= 8)) {
    return { label: "追いかけ注意", className: "watchout", reason: "資金量か過熱度が高く、上値追いより押し目確認が優先です。" };
  }
  if (score >= 68 && accel > 0 && spread >= 58) {
    return { label: "個別銘柄確認", className: "check", reason: "テーマの資金量と広がりがあり、関連銘柄の業績確認へ進めます。" };
  }
  if (score >= 52 && accel > 0 && m.crowdedness < 65) {
    return { label: "監視開始", className: "watch", reason: "まだ主役ではありませんが、資金の向きが改善しています。" };
  }
  if (accel < -10 || m.fundFlow < 45) {
    return { label: "見送り", className: "skip", reason: "資金量または加速度が弱く、次の改善待ちです。" };
  }
  return { label: "見るだけ", className: "observe", reason: "判断材料はありますが、まだ決め手待ちです。" };
}

function mapPositionFor(id, list = []) {
  if (mapPositions[id]) return mapPositions[id];
  const index = Math.max(0, list.findIndex((theme) => theme.id === id));
  const columns = [16, 50, 84];
  const rows = [13, 38, 63, 88];
  return {
    x: columns[index % columns.length],
    y: rows[Math.floor(index / columns.length) % rows.length]
  };
}

function flowRouteCandidates(list) {
  const mapList = list.length ? list : themes;
  const visibleIds = new Set(mapList.map((theme) => theme.id));
  const visibleRoutes = flowRoutes.filter(([from, to]) => visibleIds.has(from) && visibleIds.has(to));
  const outgoingCounts = new Map();
  const incomingCounts = new Map();

  visibleRoutes.forEach(([from, to]) => {
    outgoingCounts.set(from, (outgoingCounts.get(from) || 0) + 1);
    incomingCounts.set(to, (incomingCounts.get(to) || 0) + 1);
  });

  return visibleRoutes
    .map(([from, to]) => {
      const start = mapPositionFor(from, mapList);
      const end = mapPositionFor(to, mapList);
      const fromTheme = themeById(from);
      const toTheme = themeById(to);
      const outflowShift = fromTheme.metrics["7d"].fundFlow - fromTheme.metrics["30d"].fundFlow;
      const inflowShift = toTheme.metrics["7d"].fundFlow - toTheme.metrics["30d"].fundFlow;
      const rotationBoost = outflowShift < -3 && inflowShift > 3 ? 14 : 0;
      const strength = Math.round(
        fundAmount(fromTheme) * 0.35 +
        accelerationForPeriod(toTheme, state.period) * 0.35 +
        spreadScore(toTheme) * 0.3 +
        rotationBoost
      );
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const curve = Math.min(9, Math.max(5, distance * 0.14));
      const direction = from < to ? 1 : -1;
      const controlX = midX + (-dy / distance) * curve * direction;
      const controlY = midY + (dx / distance) * curve * direction;
      const outflowCount = outgoingCounts.get(from) || 1;
      const inflowCount = incomingCounts.get(to) || 1;
      return {
        from,
        to,
        fromTheme,
        toTheme,
        start,
        end,
        control: { x: controlX, y: controlY },
        midX,
        midY,
        strength,
        outflowCount,
        inflowCount,
        outflowOpacity: outflowCount >= 2 ? Math.min(0.44, 0.12 + outflowCount * 0.09) : 0.08,
        inflowOpacity: inflowCount >= 2 ? Math.min(0.44, 0.12 + inflowCount * 0.09) : 0.08,
        d: `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
      };
    })
    .sort((a, b) => b.strength - a.strength);
}

function primaryRouteFor(list) {
  return flowRouteCandidates(list)[0];
}

function quadraticPoint(start, control, end, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
    y: inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y
  };
}

function themeById(id) {
  return themes.find((theme) => theme.id === id);
}

function instrumentScore(instrument) {
  const warningPenalty = instrument.warning ? 12 : 0;
  const qualityBonus = instrument.quality?.includes("業績良好") ? 8 : instrument.quality ? 4 : 0;
  const newsBonus = instrument.newsRisk === "悪材料未検出" ? 6 : 0;
  return instrument.strength + qualityBonus + newsBonus - warningPenalty;
}

function relatedInstruments(theme) {
  const merged = [...theme.instruments, ...(extraInstrumentsByTheme[theme.id] || [])];
  const byTicker = new Map();
  merged.forEach((instrument) => {
    const current = byTicker.get(instrument.ticker);
    if (!current || instrumentScore(instrument) > instrumentScore(current)) {
      byTicker.set(instrument.ticker, {
        quality: instrument.warning ? "注意あり" : "業績良好候補",
        newsRisk: instrument.warning ? "悪材料確認あり" : "悪材料未検出",
        ...instrument
      });
    }
  });
  return [...byTicker.values()]
    .map((instrument) => {
      const signal = instrumentFinalSignal(instrument, stockQuoteFor(instrument.ticker));
      const signalBonus = signal.kind === "buy" ? 26 : signal.kind === "watch" ? 16 : signal.kind === "early" ? 8 : -20;
      return {
        ...instrument,
        signal,
        displayScore: instrumentScore(instrument) + signalBonus
      };
    })
    .filter((instrument) => instrument.strength >= 58)
    .filter((instrument) => instrument.signal.kind !== "neutral" || instrument.strength >= 72)
    .filter((instrument) => instrument.signal.kind !== "early" || instrument.strength >= 62)
    .sort((a, b) => b.displayScore - a.displayScore || instrumentScore(b) - instrumentScore(a))
    .slice(0, 8)
    .map(({ signal, displayScore, ...instrument }) => instrument);
}

function filteredThemes() {
  const needle = state.search.trim().toLowerCase();
  const filtered = themes
    .filter((theme) => state.assetClass === "all" || theme.assetClass === state.assetClass)
    .filter((theme) => state.stage === "all" || theme.stage === state.stage)
    .filter((theme) => !state.liquidityOnly || !theme.liquidityWarning)
    .filter((theme) => {
      if (!needle) return true;
      const text = [
        theme.name,
        theme.assetClass,
        theme.region,
        ...theme.keywords,
        ...theme.instruments.map((instrument) => `${instrument.ticker} ${instrument.name}`)
      ].join(" ").toLowerCase();
      return text.includes(needle);
    })
    .sort((a, b) => {
      const flowDiff = fundAmount(b, state.period) - fundAmount(a, state.period);
      if (flowDiff !== 0) return flowDiff;
      const scoreDiff = calculateScore(b, state.period) - calculateScore(a, state.period);
      if (scoreDiff !== 0) return scoreDiff;
      return aiResearchScore(b) - aiResearchScore(a);
    });

  const isExploring = needle || state.assetClass !== "all" || state.stage !== "all" || state.liquidityOnly;
  if (isExploring) return filtered;

  const display = filtered.slice(0, 12);
  geminiResearchCandidates()
    .map((candidate) => themeById(candidate.id))
    .filter(Boolean)
    .forEach((theme) => {
      if (!display.some((item) => item.id === theme.id)) {
        display.push(theme);
      }
    });
  return display;
}

function renderFilters() {
  const assetFilter = document.querySelector("#assetFilter");
  const assets = [...new Set(themes.map((theme) => theme.assetClass))].sort();
  assets.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset;
    option.textContent = asset;
    assetFilter.appendChild(option);
  });
}

function renderSummary(list) {
  const top = [...(list.length ? list : themes)].sort((a, b) => fundAmount(b, state.period) - fundAmount(a, state.period))[0] || themes[0];
  const emerging = list.filter((theme) => theme.stage === "emerging").length;
  const crowded = list.filter((theme) => theme.stage === "crowded").length;
  const avgConfidence = list.length
    ? Math.round(list.reduce((sum, theme) => sum + theme.metrics[state.period].confidence, 0) / list.length)
    : 0;

  document.querySelector("#topTheme").textContent = top.name;
  document.querySelector("#topThemeDetail").textContent = `${top.assetClass} / 資金量 ${fundAmount(top)} / ${lifecycleStage(top).label}`;
  document.querySelector("#emergingCount").textContent = `${emerging}件`;
  document.querySelector("#crowdedCount").textContent = `${crowded}件`;
  document.querySelector("#avgConfidence").textContent = `${avgConfidence}%`;
}

function renderFlowMap(list) {
  const container = document.querySelector("#flowMap");
  container.innerHTML = "";
  container.style.setProperty("--map-scale", state.mapZoom);
  container.style.setProperty("--map-y-scale", mapVerticalScale());

  const layer = document.createElement("div");
  layer.className = "flow-map-inner";
  container.appendChild(layer);

  const mapList = list.length ? list : themes;
  const visibleIds = new Set(mapList.map((theme) => theme.id));
  const routePaths = flowRouteCandidates(list);

  const routeLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  routeLayer.setAttribute("class", "flow-svg");
  routeLayer.setAttribute("viewBox", "0 0 100 100");
  routeLayer.setAttribute("preserveAspectRatio", "none");
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  routeLayer.appendChild(defs);

  routePaths.forEach((route, index) => {
    const gradientId = `flow-gradient-${index}`;
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", route.start.x);
    gradient.setAttribute("y1", route.start.y);
    gradient.setAttribute("x2", route.end.x);
    gradient.setAttribute("y2", route.end.y);

    [
      { offset: "0%", color: "rgb(220, 38, 38)", opacity: route.outflowOpacity },
      { offset: "50%", color: "rgb(15, 118, 110)", opacity: 0.12 },
      { offset: "100%", color: "rgb(37, 99, 235)", opacity: route.inflowOpacity }
    ].forEach((stopDef) => {
      const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute("offset", stopDef.offset);
      stop.setAttribute("stop-color", stopDef.color);
      stop.setAttribute("stop-opacity", stopDef.opacity);
      gradient.appendChild(stop);
    });
    defs.appendChild(gradient);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", route.d);
    path.setAttribute("stroke", `url(#${gradientId})`);
    path.classList.add(
      route.strength >= 60 ? "route-strength-high" : route.strength >= 35 ? "route-strength-mid" : "route-strength-low"
    );
    routeLayer.appendChild(path);
  });
  layer.appendChild(routeLayer);

  routePaths.forEach((route) => {
    const flowCount = route.strength >= 60 ? 7 : route.strength >= 35 ? 5 : 4;
    const duration = 9.5 + Math.min(3.5, Math.max(0, 70 - route.strength) / 18);

    for (let i = 0; i < flowCount; i += 1) {
      const first = quadraticPoint(route.start, route.control, route.end, 0.08);
      const second = quadraticPoint(route.start, route.control, route.end, 0.28);
      const third = quadraticPoint(route.start, route.control, route.end, 0.52);
      const fourth = quadraticPoint(route.start, route.control, route.end, 0.76);
      const fifth = quadraticPoint(route.start, route.control, route.end, 0.94);
      const trail = document.createElement("span");
      trail.className = "flow-trail";
      trail.style.left = `${first.x}%`;
      trail.style.top = `${first.y}%`;
      trail.style.setProperty("--flow-x1", `${second.x}%`);
      trail.style.setProperty("--flow-y1", `${second.y}%`);
      trail.style.setProperty("--flow-x2", `${third.x}%`);
      trail.style.setProperty("--flow-y2", `${third.y}%`);
      trail.style.setProperty("--flow-x3", `${fourth.x}%`);
      trail.style.setProperty("--flow-y3", `${fourth.y}%`);
      trail.style.setProperty("--flow-end-x", `${fifth.x}%`);
      trail.style.setProperty("--flow-end-y", `${fifth.y}%`);
      trail.style.setProperty("--flow-duration", `${duration}s`);
      trail.style.animationDelay = `${-(duration / flowCount) * i}s`;
      trail.textContent = "💰";
      layer.appendChild(trail);
    }
  });

  mapList.forEach((theme, index) => {
    const locked = isLockedTheme(theme, mapList);
    const score = calculateScore(theme, state.period);
    const amount = fundAmount(theme);
    const fundFlowLevel = theme.metrics[state.period].fundFlow;
    const overheat = theme.metrics[state.period].crowdedness;
    const spread = spreadScore(theme);
    const stage = lifecycleStage(theme);
    const pos = mapPositionFor(theme.id, mapList);
    const size = Math.round(95 + spread * 1.35);
    const periodAccel = accelerationForPeriod(theme, state.period);
    const color = accelerationColor(periodAccel);
    const node = document.createElement("button");
    node.type = "button";
    node.className = `flow-node ${theme.id === state.selectedId ? "active" : ""} ${locked ? "locked" : ""}`;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.style.setProperty("--size", `${size}px`);
    node.style.setProperty("--node-color", color);
    node.style.setProperty("--speed", `${3.5 + (index % 4) * 0.45}s`);
    node.style.setProperty("--drift-x", `${(index % 2 === 0 ? 1 : -1) * 4}px`);
    node.style.setProperty("--drift-y", `${(index % 3 === 0 ? -1 : 1) * 3}px`);
    node.title = `${theme.name} / ${stage.label} / ${accelerationLabel(periodAccel)} / 加速度 ${periodAccel}`;
    node.innerHTML = `
      <span class="node-icon">${themeIcons[theme.id] || "■"}</span>
      <span>
        <strong>${locked ? "重要テーマを検出" : theme.name}</strong>
        <span class="money-marks" aria-label="${locked ? "Pro限定" : `資金流入推定 ${fundFlowLevel}`}">${locked ? "■■■" : moneyMarks(fundFlowLevel)}</span>
        <small>${locked ? "資金の集中・流出入が複数あります" : `${stage.icon} ${stage.label} / 資金量 ${fundFlowLevel} / 加速度 ${periodAccel >= 0 ? "+" : ""}${periodAccel} / 広がり ${spread} / 過熱度 ${overheat}`}</small>
      </span>
      ${locked ? proLockMarkup("重要セクターを解除") : ""}
    `;
    node.addEventListener("click", () => {
      state.selectedId = theme.id;
      renderList();
      renderDetail();
      centerSelectedMapNode();
    });
    layer.appendChild(node);
  });

  renderAiMarkers(layer, visibleIds);
}

function renderMapTakeaway(list) {
  const container = document.querySelector("#mapTakeaway");
  const mapList = list.length ? list : themes;
  const visibleIds = new Set(mapList.map((theme) => theme.id));
  const route = primaryRouteFor(list);
  const gold = visibleIds.has("jp-gold") ? themeById("jp-gold") : null;
  const reit = visibleIds.has("jp-reits") ? themeById("jp-reits") : null;
  const goldText = gold
    ? `金は${periodLabel()}で${accelerationLabel(accelerationForPeriod(gold, state.period))}です。これは「金に${state.period === "90d" ? "長めの期間で" : "この期間で"}勢いがある」という意味で、資金流入推定は${gold.metrics[state.period].fundFlow}です。`
    : `${periodLabel()}表示では、色は各テーマの加速度を示します。緑は「その期間で勢いがある」という意味です。`;
  const rotationText = gold && reit
    ? (() => {
      const goldMove = gold.metrics["7d"].fundFlow - gold.metrics["90d"].fundFlow;
      const reitMove = reit.metrics["7d"].fundFlow - reit.metrics["90d"].fundFlow;
      if (goldMove < 0 && reitMove > 0) {
        return `90日・30日・7日を見比べると、金の資金量は${gold.metrics["90d"].fundFlow}→${gold.metrics["30d"].fundFlow}→${gold.metrics["7d"].fundFlow}、J-REIT・利回り資産は${reit.metrics["90d"].fundFlow}→${reit.metrics["30d"].fundFlow}→${reit.metrics["7d"].fundFlow}です。守りの資金が金からJ-REIT・利回り資産へ一部移っている読み方ができます。広がりの軸は金利です。`;
      }
      return `90日・30日・7日の資金量を見比べると、金は${gold.metrics["90d"].fundFlow}→${gold.metrics["30d"].fundFlow}→${gold.metrics["7d"].fundFlow}、J-REIT・利回り資産は${reit.metrics["90d"].fundFlow}→${reit.metrics["30d"].fundFlow}→${reit.metrics["7d"].fundFlow}です。金利を軸に、守り資金と利回り資産のどちらへ資金が寄っているかを確認します。`;
    })()
    : "";
  const routeText = route
    ? `動く💰は候補ルート上のお金の流れです。特に目立つ流れは${themeIcons[route.from]} ${route.fromTheme.name} → ${themeIcons[route.to]} ${route.toTheme.name}ですが、市場資金が全部そこだけへ移ったという意味ではありません。`
    : "動く💰は現在の絞り込み条件では出ていません。表示中テーマ同士の候補ルートがない状態です。";
  const geminiThemes = geminiResearchCandidates(visibleIds)
    .slice(0, 2)
    .map((candidate) => `${themeIcons[candidate.id]} ${candidate.name || themeById(candidate.id).name}`)
    .join("、");

  container.innerHTML = `
    <strong>このマップの読み方</strong>
    <p>${goldText}</p>
    ${rotationText ? `<p>${rotationText}</p>` : ""}
    <p>${routeText}</p>
    <p>Gemini注目は実際の資金ではなく、Geminiの調査メモです。${geminiThemes ? `今は ${geminiThemes} を見ています。` : "Gemini調査の実行後、ここに注目テーマが表示されます。"}</p>
  `;
}

function setMapZoom(nextZoom) {
  state.mapZoom = Math.max(0.75, Math.min(1.45, Number(nextZoom.toFixed(2))));
  const map = document.querySelector("#flowMap");
  map?.style.setProperty("--map-scale", state.mapZoom);
  map?.style.setProperty("--map-y-scale", mapVerticalScale());
  centerSelectedMapNode();
}

function routeCountsFor(list) {
  const counts = {};
  flowRouteCandidates(list).forEach((route) => {
    counts[route.from] = counts[route.from] || { incoming: 0, outgoing: 0 };
    counts[route.to] = counts[route.to] || { incoming: 0, outgoing: 0 };
    counts[route.from].outgoing += 1;
    counts[route.to].incoming += 1;
  });
  return counts;
}

function isLockedTheme(theme, list) {
  if (state.isPro) return false;
  const counts = routeCountsFor(list.length ? list : themes)[theme.id] || { incoming: 0, outgoing: 0 };
  return counts.incoming >= 2 || counts.outgoing >= 2;
}

function proLockMarkup(label = "Proで解除") {
  return `<span class="pro-lock"><b>LOCK</b><small>${label}</small></span>`;
}

function openUpgrade() {
  if (PRO_CHECKOUT_URL) {
    window.location.href = PRO_CHECKOUT_URL;
    return;
  }
  window.alert("Proは月額980円 / 年額9,800円で準備中です。Stripe決済リンクを設定すると、このボタンから登録できます。");
}

function mapVerticalScale() {
  const extraZoom = Math.max(0, state.mapZoom - 1);
  return Number((state.mapZoom + extraZoom * 0.85).toFixed(2));
}

function centerSelectedMapNode() {
  requestAnimationFrame(() => {
    const map = document.querySelector("#flowMap");
    const node = map?.querySelector(".flow-node.active");
    if (!map || !node) return;

    const targetLeft = node.offsetLeft + node.offsetWidth / 2 - map.clientWidth / 2;
    const targetTop = node.offsetTop + node.offsetHeight / 2 - map.clientHeight / 2;
    const maxLeft = Math.max(0, map.scrollWidth - map.clientWidth);
    const maxTop = Math.max(0, map.scrollHeight - map.clientHeight);

    map.scrollTo({
      left: Math.max(0, Math.min(maxLeft, targetLeft)),
      top: Math.max(0, Math.min(maxTop, targetTop)),
      behavior: "smooth"
    });
  });
}

function setMapFullscreen(enabled) {
  state.mapFullscreen = enabled;
  document.body.classList.toggle("map-fullscreen", enabled);
  const button = document.querySelector("#mapFullscreen");
  if (button) {
    button.textContent = enabled ? "×" : "⛶";
    button.title = enabled ? "通常表示に戻す" : "画面いっぱいに表示";
  }
}

function renderScoreChart(theme) {
  const container = document.querySelector("#scoreChart");
  const legend = document.querySelector("#chartLegend");
  const metrics = [
    ["資金量", theme.metrics[state.period].fundFlow],
    ["加速度", Math.max(0, Math.min(100, accelerationForPeriod(theme, state.period) + 35))],
    ["広がり", spreadScore(theme)],
    ["過熱度", theme.metrics[state.period].crowdedness]
  ];

  container.innerHTML = metrics
    .map((item) => `
      <div class="chart-bar">
        <strong>${item[1]}</strong>
        <div class="chart-fill" style="--height: ${Math.max(18, item[1] * 1.9)}px"></div>
        <span>${item[0]}</span>
      </div>
    `)
    .join("");

  const current = theme.metrics[state.period];
  const stage = lifecycleStage(theme);
  legend.innerHTML = `
    <span><strong>判断ステージ</strong><b>${stage.icon} ${stage.label}</b></span>
    <span><strong>判断</strong><b>${stage.decision}</b></span>
    <span><strong>信頼度</strong><b>${current.confidence}%</b></span>
  `;
}

function metricValueForPeriod(theme, metricKey, period) {
  const m = theme.metrics[period];
  if (metricKey === "fundFlow") return m.fundFlow;
  if (metricKey === "acceleration") return accelerationForPeriod(theme, period);
  if (metricKey === "spread") return spreadScore(theme, period);
  return m.crowdedness;
}

function renderPeriodMetricChart(theme) {
  const container = document.querySelector("#periodMetricChart");
  const metrics = [
    ["資金量", "fundFlow", "高いほど資金が集まっています"],
    ["加速度", "acceleration", "右に伸びるほど勢いが増えています"],
    ["広がり", "spread", "高いほど関連銘柄へ波及しています"],
    ["過熱度", "crowdedness", "高いほど買われすぎ・混みすぎです"]
  ];
  const periods = [
    ["90d", "90日"],
    ["30d", "30日"],
    ["7d", "7日"]
  ];

  container.innerHTML = metrics
    .map(([metricLabel, metricKey, help]) => `
      <section class="period-metric-group">
        <header><strong>${metricLabel}</strong><span>${help}</span></header>
        ${periods.map(([period, periodLabelText]) => {
          const value = metricValueForPeriod(theme, metricKey, period);
          const isAcceleration = metricKey === "acceleration";
          const normalized = isAcceleration ? Math.max(-60, Math.min(80, value)) : Math.max(0, Math.min(100, value));
          const width = isAcceleration ? Math.max(8, Math.abs(normalized) * 0.7) : Math.max(6, normalized);
          const pos = isAcceleration ? 50 + normalized * 0.45 : Math.min(94, Math.max(6, normalized));
          const positive = value >= 0;
          return `
            <span class="period-metric-label">${periodLabelText}</span>
            <span class="period-metric-track ${isAcceleration ? "centered" : ""}">
              <span class="period-metric-fill" style="--width: ${width}%; --shift: ${isAcceleration && !positive ? "-100%" : "0"}; --fill: ${isAcceleration ? (positive ? "var(--green)" : "var(--red)") : "var(--accent)"}"></span>
              <span class="period-metric-value" style="--pos: ${pos}%">${isAcceleration && value >= 0 ? "+" : ""}${value}</span>
            </span>
          `;
        }).join("")}
      </section>
    `)
    .join("");
}

function renderPeriodFlow(theme) {
  const container = document.querySelector("#periodFlow");
  const sequence = [
    ["90d", "90日", "大きな資金の居場所"],
    ["30d", "30日", "資金移動の方向"],
    ["7d", "7日", "直近の加速度"]
  ];
  const currentStage = lifecycleStageForPeriod(theme, state.period);
  const currentAmount = fundAmount(theme, state.period);
  const currentAccel = accelerationForPeriod(theme, state.period);

  const cards = sequence
    .map(([period, label, caption], index) => {
      const amount = fundAmount(theme, period);
      const accel = accelerationForPeriod(theme, period);
      const stage = lifecycleStageForPeriod(theme, period);
      const prevAmount = index > 0 ? fundAmount(theme, sequence[index - 1][0]) : amount;
      const delta = amount - prevAmount;
      const trendClass = delta >= 0 ? "trend-up" : "trend-down";
      const trend = index === 0 ? "基準" : `${delta >= 0 ? "+" : ""}${delta}`;
      const isActive = period === state.period;
      return `
        <article class="period-card ${isActive ? "active" : ""}" ${isActive ? 'aria-current="true"' : ""}>
          <header>
            <span>
              <strong>${label}</strong>
              <small>${caption}</small>
            </span>
            <span class="period-card-flags">
              ${isActive ? '<b class="period-selected">選択中</b>' : ""}
              <span class="${trendClass}">${trend}</span>
            </span>
          </header>
          <div class="period-stats">
            <span>資金 ${amount}</span>
            <span>加速 ${accel >= 0 ? "+" : ""}${accel}</span>
            <span>${stage.icon} ${stage.label}</span>
          </div>
          <p class="period-note">${stage.decision}</p>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="period-current">
      <span>現在の表示</span>
      <strong>${periodLabel()} / ${currentStage.icon} ${currentStage.label}</strong>
      <small>${theme.name}の${periodLabel()}は、資金 ${currentAmount}、加速 ${currentAccel >= 0 ? "+" : ""}${currentAccel} を選択中です。</small>
    </div>
    ${cards}
  `;
}

function renderAiMarkers(container, visibleIds) {
  const candidate = geminiResearchCandidates(visibleIds)[0];
  if (!candidate) return;

  const pos = mapPositionFor(candidate.id);
  const marker = document.createElement("span");
  marker.className = "ai-marker";
  marker.style.left = `${Math.min(92, pos.x + 8)}%`;
  marker.style.top = `${Math.max(4, pos.y - 8)}%`;
  marker.style.setProperty("--drift-x", "4px");
  marker.style.setProperty("--drift-y", "-3px");
  marker.innerHTML = `💎 Gemini注目`;
  container.appendChild(marker);
}

function isGeminiResearchReady() {
  return state.aiResearch?.source === "gemini" && Array.isArray(state.aiResearch.candidates);
}

function geminiResearchCandidates(visibleIds = null) {
  if (!isGeminiResearchReady()) return [];
  return state.aiResearch.candidates
    .filter((candidate) => themeById(candidate.id))
    .filter((candidate) => !visibleIds || visibleIds.has(candidate.id));
}

function flowLeaderThemes(list = []) {
  const source = list.length ? list : themes;
  const byAmount = [...source].sort((a, b) => fundAmount(b, state.period) - fundAmount(a, state.period));
  const byMomentum = [...source].sort((a, b) => {
    const aScore = accelerationForPeriod(a, state.period) - Math.max(0, a.metrics[state.period].crowdedness - 58) * 0.4;
    const bScore = accelerationForPeriod(b, state.period) - Math.max(0, b.metrics[state.period].crowdedness - 58) * 0.4;
    return bScore - aScore;
  });
  return {
    leader: byAmount[0] || themes[0],
    growth: byMomentum.find((theme) => {
      const stage = lifecycleStage(theme).label;
      return stage === "成長期" || stage === "発芽期";
    }) || byMomentum[0] || byAmount[1] || byAmount[0],
    crowded: byAmount.find((theme) => theme.stage === "crowded" || lifecycleStage(theme).label === "成熟期") || null
  };
}

function renderCharacterCards(cards) {
  return cards.map((card) => `
    <div class="character-card">
      <span class="character-icon">${card.icon}</span>
      <span>
        <strong>${card.title}</strong>
        <span>${card.text}</span>
      </span>
    </div>
  `).join("");
}

function renderCharacters() {
  const container = document.querySelector("#aiCharacters");
  const candidates = geminiResearchCandidates();
  const leaders = flowLeaderThemes(filteredThemes());
  const route = primaryRouteFor(filteredThemes());

  if (candidates.length) {
    const current = candidates[0];
    const next = candidates.find((candidate) => candidate.id !== current.id);
    const currentTheme = themeById(current.id);
    const nextTheme = next ? themeById(next.id) : null;
    const evidence = Array.isArray(current.evidence) ? current.evidence.slice(0, 2).join(" / ") : "";
    container.innerHTML = renderCharacterCards([
      {
        icon: "💎",
        title: "Gemini：価格・出来高・ニュース・金利・為替の総合調査",
        text: `注目 ${themeIcons[current.id]} ${current.name || currentTheme.name}。${nextTheme ? `次に確認 ${themeIcons[next.id]} ${next.name || nextTheme.name}。` : ""}${current.reason || ""}${evidence ? ` / ${evidence}` : ""}`
      },
      {
        icon: "💰",
        title: "資金の居場所",
        text: `現在の主役は ${themeIcons[leaders.leader.id]} ${leaders.leader.name}（資金量 ${fundAmount(leaders.leader)}）。次の候補は ${themeIcons[leaders.growth.id]} ${leaders.growth.name}（加速度 ${accelerationForPeriod(leaders.growth, state.period) >= 0 ? "+" : ""}${accelerationForPeriod(leaders.growth, state.period)}）。`
      }
    ]);
    return;
  }

  const cards = [
    {
      icon: "💰",
      title: "成長資金：いま資金が集まっているテーマ",
      text: `${themeIcons[leaders.leader.id]} ${leaders.leader.name} / 資金量 ${fundAmount(leaders.leader)} / ${lifecycleStage(leaders.leader).label}`
    },
    {
      icon: "🌿",
      title: "次に広がりそうなテーマ",
      text: `${themeIcons[leaders.growth.id]} ${leaders.growth.name} / 加速度 ${accelerationForPeriod(leaders.growth, state.period) >= 0 ? "+" : ""}${accelerationForPeriod(leaders.growth, state.period)} / 広がり ${spreadScore(leaders.growth)}`
    }
  ];
  if (route) {
    const rotation = route.fromTheme.metrics["7d"].fundFlow - route.fromTheme.metrics["30d"].fundFlow < -3 &&
      route.toTheme.metrics["7d"].fundFlow - route.toTheme.metrics["30d"].fundFlow > 3;
    cards.push({
      icon: "↗",
      title: rotation ? "資金シフト候補ルート" : "注目ルート",
      text: `${themeIcons[route.from]} ${route.fromTheme.name} → ${themeIcons[route.to]} ${route.toTheme.name}`
    });
  }
  if (leaders.crowded) {
    cards.push({
      icon: "⚠",
      title: "過熱注意テーマ",
      text: `${themeIcons[leaders.crowded.id]} ${leaders.crowded.name} / 過熱度 ${leaders.crowded.metrics[state.period].crowdedness}`
    });
  }
  container.innerHTML = renderCharacterCards(cards);
}

function renderMarketStory(list) {
  const leaders = flowLeaderThemes(list);
  const route = primaryRouteFor(list);
  const leader = leaders.leader;
  const growth = leaders.growth;
  const leaderFlow = `${leader.metrics["90d"].fundFlow}→${leader.metrics["30d"].fundFlow}→${leader.metrics["7d"].fundFlow}`;
  const growthFlow = `${growth.metrics["90d"].fundFlow}→${growth.metrics["30d"].fundFlow}→${growth.metrics["7d"].fundFlow}`;
  const leaderStage = lifecycleStage(leader);
  const growthStage = lifecycleStage(growth);
  let story = `${periodLabel()}の資金ストーリー: ${themeIcons[leader.id]} ${leader.name}が資金量${fundAmount(leader)}（${leaderFlow}）で主役ですが、${leaderStage.label}のため${leaderStage.decision}。`;
  story += ` 一方、${themeIcons[growth.id]} ${growth.name}は資金量${fundAmount(growth)}（${growthFlow}）、加速度${accelerationForPeriod(growth, state.period) >= 0 ? "+" : ""}${accelerationForPeriod(growth, state.period)}、広がり${spreadScore(growth)}で${growthStage.decision}。`;
  if (route) {
    const rotation = route.fromTheme.metrics["7d"].fundFlow - route.fromTheme.metrics["30d"].fundFlow < -3 &&
      route.toTheme.metrics["7d"].fundFlow - route.toTheme.metrics["30d"].fundFlow > 3;
    story += rotation
      ? ` マップ上では ${route.fromTheme.name} から ${route.toTheme.name} へ資金が移り始めている読みができます。`
      : ` 注目ルートは ${route.fromTheme.name} → ${route.toTheme.name} です。`;
  }
  document.querySelector("#marketStory").textContent = story;
}

function aiResearchScore(theme) {
  const fund90 = theme.metrics["90d"].fundFlow;
  const fund30 = theme.metrics["30d"].fundFlow;
  const fund7 = theme.metrics["7d"].fundFlow;
  const recentFundChange = fund7 - fund30;
  const longFundChange = fund7 - fund90;
  const current = theme.metrics[state.period];
  const accel = accelerationForPeriod(theme, state.period);
  const shortAccel = accelerationForPeriod(theme, "7d");
  const spread = spreadScore(theme);
  const incomingRoutes = flowRouteCandidates(themes).filter((route) => route.to === theme.id);
  const routeSupport = incomingRoutes.reduce((sum, route) => {
    const fromWeakening = route.fromTheme.metrics["7d"].fundFlow - route.fromTheme.metrics["90d"].fundFlow;
    return sum + Math.max(0, route.strength * 0.12 - Math.max(0, fromWeakening) * 0.15);
  }, 0);
  const rotationBonus = incomingRoutes.reduce((sum, route) => {
    const fromFlowChange = route.fromTheme.metrics["7d"].fundFlow - route.fromTheme.metrics["90d"].fundFlow;
    const toFlowChange = fund7 - fund90;
    const fromOverheat = route.fromTheme.metrics["90d"].crowdedness;
    if (fromFlowChange < 0 && toFlowChange > 0) {
      return sum + 18 + Math.min(12, Math.abs(fromFlowChange) + toFlowChange) + (fromOverheat >= 65 ? 6 : 0);
    }
    return sum;
  }, 0);
  const overheatedPenalty = Math.max(0, current.crowdedness - 68) * 1.2;
  const liquidityPenalty = theme.liquidityWarning ? 8 : 0;
  return Math.round(
    current.fundFlow * 0.35 +
    spread * 0.45 +
    accel * 0.9 +
    shortAccel * 0.35 +
    recentFundChange * 1.7 +
    longFundChange * 0.9 +
    routeSupport +
    rotationBonus -
    overheatedPenalty -
    liquidityPenalty
  );
}

function buildAiResearchReason(theme) {
  const fundSeq = `${theme.metrics["90d"].fundFlow}→${theme.metrics["30d"].fundFlow}→${theme.metrics["7d"].fundFlow}`;
  const accel = accelerationForPeriod(theme, state.period);
  const incoming = flowRouteCandidates(themes).find((route) => route.to === theme.id);
  const rotationDetected = incoming &&
    incoming.fromTheme.metrics["7d"].fundFlow < incoming.fromTheme.metrics["90d"].fundFlow &&
    theme.metrics["7d"].fundFlow > theme.metrics["90d"].fundFlow;
  const routeText = incoming
    ? rotationDetected
      ? `候補ルートでは${themeIcons[incoming.from]} ${incoming.fromTheme.name}の資金量が低下し、${themeIcons[theme.id]} ${theme.name}の資金量が上昇しているため、資金移動候補として優先します。`
      : `候補ルートでは${themeIcons[incoming.from]} ${incoming.fromTheme.name}から資金が広がる可能性があります。`
    : "候補ルート上の流入は弱めなので、単独テーマとして確認します。";
  const riskText = theme.metrics[state.period].crowdedness >= 70
    ? "過熱度が高めなので、追いかけ買いではなく押し目や出来高確認が必要です。"
    : "過熱度はまだ極端ではないため、関連銘柄への広がりを確認しやすい状態です。";
  return `Gemini候補: 資金量の流れは${fundSeq}、${periodLabel()}の加速度は${accel >= 0 ? "+" : ""}${accel}、広がりは${spreadScore(theme)}です。${routeText}${riskText}`;
}

function renderGeminiResearchCandidates(source) {
  const container = document.querySelector("#researchCandidates");
  const status = document.querySelector("#aiResearchStatus");

  if (!state.aiResearch || !Array.isArray(state.aiResearch.candidates)) {
    container.innerHTML = '<p class="empty">Gemini調査データがまだありません。GitHub Actionsの「Update market data」を実行すると表示されます。</p>';
    if (status) {
      status.textContent = "Gemini調査待ち: まだ ai-research.json を読み込めていません。";
    }
    return true;
  }

  if (state.aiResearch.source !== "gemini") {
    container.innerHTML = '<p class="empty">Gemini調査はまだ未実行です。GitHub ActionsでGemini APIを実行すると、ここに本物のGemini調査結果だけを表示します。</p>';
    if (status) {
      status.textContent = "Gemini調査待ち: 現在のファイルは暫定候補です。Gemini API実行後に更新されます。";
    }
    return true;
  }

  const visibleIds = new Set(source.map((theme) => theme.id));
  const allowedFreeIds = new Set([source[0]?.id].filter(Boolean));
  const candidates = state.aiResearch.candidates
    .filter((candidate) => visibleIds.has(candidate.id))
    .slice(0, 5);

  if (!candidates.length) {
    container.innerHTML = '<p class="empty">現在の絞り込み条件ではGemini調査候補がありません。フィルター条件を戻してください。</p>';
    if (status) {
      status.textContent = "Gemini調査済みですが、現在のフィルターに一致する候補はありません。";
    }
    return true;
  }

  const summary = state.aiResearch.summary
    ? `<div class="gemini-summary"><strong>Gemini全体判断</strong><span>${state.aiResearch.summary}</span></div>`
    : "";
  container.innerHTML = summary + candidates
    .map((candidate) => {
      const theme = themeById(candidate.id);
      const locked = !state.isPro && !allowedFreeIds.has(candidate.id);
      const evidence = Array.isArray(candidate.evidence) ? candidate.evidence.slice(0, 3) : [];
      return `
        <button class="candidate-card ai-picked gemini-picked ${candidate.id === state.selectedId ? "active" : ""} ${locked ? "locked-card" : ""}" type="button" data-id="${candidate.id}">
          <span>
            <strong>${locked ? "Pro限定のGemini候補" : `${themeIcons[candidate.id] || "●"} ${candidate.name || theme.name}`}</strong>
            <span>${locked ? "資金フローと材料が重なった候補を検出しました。" : candidate.reason || "Geminiが価格・出来高、ニュース、金利・為替材料から確認候補にしました。"}</span>
            <span class="candidate-evidence">${locked ? "根拠・テーマ名・確認点はProで表示されます。" : evidence.join(" / ")}</span>
            <span class="candidate-next">次に確認: ${locked ? "Proで解除" : candidate.nextCheck || "関連銘柄とニュースの継続確認"}</span>
            <span class="candidate-risk">注意: ${locked ? "無料プレビューでは詳細を伏せています" : candidate.risk || "過熱度と材料の変化を確認"}</span>
          </span>
          <span class="candidate-decision">${locked ? "LOCK" : `${candidate.decision || "Gemini確認"} ${candidate.score != null ? `Geminiスコア ${candidate.score}` : ""}`}</span>
        </button>
      `;
    })
    .join("");

  if (status) {
    const sourceName = "Gemini調査";
    const updated = state.aiResearch.updatedAt
      ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(state.aiResearch.updatedAt))
      : "";
    status.textContent = `${sourceName}: 価格・出来高、ニュース、金利・為替材料から次に見るテーマを更新しました。${updated}`;
  }

  container.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      renderResearchCandidates(filteredThemes());
      renderList();
      renderDetail();
    });
  });

  return true;
}

function renderResearchCandidates(list) {
  const container = document.querySelector("#researchCandidates");
  const needle = state.search.trim().toLowerCase();
  const source = themes
    .filter((theme) => state.assetClass === "all" || theme.assetClass === state.assetClass)
    .filter((theme) => state.stage === "all" || theme.stage === state.stage)
    .filter((theme) => !state.liquidityOnly || !theme.liquidityWarning)
    .filter((theme) => {
      if (!needle) return true;
      const text = [
        theme.name,
        theme.assetClass,
        theme.region,
        ...theme.keywords,
        ...theme.instruments.map((instrument) => `${instrument.ticker} ${instrument.name}`)
      ].join(" ").toLowerCase();
      return text.includes(needle);
    });

  if (renderGeminiResearchCandidates(source)) {
    return;
  }

  const displayCandidates = source
    .map((theme) => ({
      theme,
      stage: lifecycleStage(theme),
      researchScore: aiResearchScore(theme),
      reason: buildAiResearchReason(theme)
    }))
    .sort((a, b) => b.researchScore - a.researchScore)
    .slice(0, 4);
  const allowedFreeIds = new Set([displayCandidates[0]?.theme.id].filter(Boolean));

  container.innerHTML = displayCandidates.length
    ? displayCandidates
      .map(({ theme, stage, researchScore, reason }) => {
        const locked = !state.isPro && !allowedFreeIds.has(theme.id);
        return `
        <button class="candidate-card ai-picked ${theme.id === state.selectedId ? "active" : ""} ${locked ? "locked-card" : ""}" type="button" data-id="${theme.id}">
          <span>
            <strong>${locked ? "Pro限定の確認テーマ" : `${themeIcons[theme.id]} ${theme.name}`}</strong>
            <span>${locked ? "90日→30日→7日の変化が出ている候補です。詳細はProで表示されます。" : reason}</span>
          </span>
          <span class="candidate-decision">${locked ? "LOCK" : `Gemini候補 ${researchScore}`}</span>
        </button>
      `;
      })
      .join("")
    : '<p class="empty">Geminiが調べられるテーマがありません。フィルター条件を戻してください。</p>';

  const status = document.querySelector("#aiResearchStatus");
  if (status) {
    status.textContent = `${periodLabel()}の監視テーマ${source.length}件をGemini候補として整理しました。Gemini API実行後はニュース・金利・為替を含む調査結果に更新されます。`;
  }

  container.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      renderResearchCandidates(filteredThemes());
      renderList();
      renderDetail();
      centerSelectedMapNode();
    });
  });
}

function renderList() {
  const list = filteredThemes();
  const container = document.querySelector("#themeList");
  container.innerHTML = "";

  if (list.length && !list.some((theme) => theme.id === state.selectedId)) {
    state.selectedId = list[0].id;
  }

  renderSummary(list);
  renderFlowMap(list);
  renderMapTakeaway(list);
  renderCharacters();
  renderMarketStory(list);
  renderResearchCandidates(list);

  if (!list.length) {
    container.innerHTML = '<p class="empty">条件に一致するテーマがありません。</p>';
    return;
  }

  list.forEach((theme, index) => {
    const m = theme.metrics[state.period];
    const amount = fundAmount(theme, state.period);
    const stage = lifecycleStage(theme);
    const rankMove = rankMoveFor(theme.id, index + 1);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `theme-card ${theme.id === state.selectedId ? "active" : ""}`;
    card.dataset.id = theme.id;
    card.innerHTML = `
      <span class="rank">
        <strong>${index + 1}</strong>
        <small class="rank-move ${rankMove.className}" title="${rankMove.title}">${rankMove.label}</small>
      </span>
      <span class="theme-main">
        <span class="theme-title">${themeIcons[theme.id]} ${theme.name}</span>
        <span class="theme-meta">
          <span class="pill">${theme.assetClass}</span>
          <span class="stage ${theme.stage}">${stage.icon} ${stage.label}</span>
          <span>加速度 ${accelerationForPeriod(theme, state.period) >= 0 ? "+" : ""}${accelerationForPeriod(theme, state.period)}</span>
          <span>広がり ${spreadScore(theme)}</span>
          <span>過熱 ${m.crowdedness}</span>
        </span>
      </span>
      <span class="score"><strong>${amount}</strong><span>資金量</span><small>総合 ${calculateScore(theme, state.period)}</small></span>
    `;
    card.addEventListener("click", () => {
      state.selectedId = theme.id;
      renderList();
      renderDetail();
      centerSelectedMapNode();
    });
    container.appendChild(card);
  });

  saveRankSnapshot(list);
  renderDetail();
}

function renderDetail() {
  const theme = themes.find((item) => item.id === state.selectedId) || filteredThemes()[0] || themes[0];
  const locked = isLockedTheme(theme, filteredThemes());
  const m = theme.metrics[state.period];
  const score = calculateScore(theme, state.period);
  const stage = lifecycleStage(theme);
  const actionStage = actionStageForTheme(theme);

  document.querySelector("#detailClass").textContent = `${theme.assetClass} / ${theme.region}`;
  document.querySelector("#detailName").textContent = locked ? "🔒 Pro限定テーマ" : `${themeIcons[theme.id]} ${theme.name}`;
  document.querySelector("#detailStage").textContent = locked ? "LOCK" : `${stage.icon} ${stage.label}`;
  document.querySelector("#detailStage").className = `stage ${theme.stage}`;
  document.querySelector("#detailScore").textContent = locked ? "LOCK" : fundAmount(theme, state.period);
  document.querySelector("#detailAcceleration").textContent = locked ? "LOCK" : accelerationForPeriod(theme, state.period);
  document.querySelector("#detailBreadth").textContent = locked ? "LOCK" : `${spreadScore(theme)}`;
  document.querySelector("#detailCrowdedness").textContent = locked ? "LOCK" : `${m.crowdedness}%`;
  document.querySelector("#crowdedBar").style.width = `${locked ? 100 : m.crowdedness}%`;
  if (locked) {
    document.querySelector("#scoreChart").innerHTML = `<div class="locked-detail">${proLockMarkup("内訳を解除")}<p>資金量・加速度・広がり・過熱度の内訳はProで表示されます。</p></div>`;
    document.querySelector("#periodMetricChart").innerHTML = `<div class="locked-detail">${proLockMarkup("期間比較を解除")}<p>90日・30日・7日の詳細比較はProで表示されます。</p></div>`;
    document.querySelector("#periodFlow").innerHTML = `<div class="period-current locked-detail">${proLockMarkup("つながりを解除")}<p>このテーマの期間推移はProで表示されます。</p></div>`;
  } else {
    renderScoreChart(theme);
    renderPeriodMetricChart(theme);
    renderPeriodFlow(theme);
  }

  document.querySelector("#aiSummary").innerHTML = locked
    ? `<div class="locked-detail">${proLockMarkup("資金フロー詳細を解除")}<p>このテーマは流入または流出の候補ルートが複数あるため、無料プレビューでは詳細を伏せています。</p><button class="text-button compact" data-upgrade type="button">Proで見る</button></div>`
    : buildAiSummary(theme, score);
  const treasureInstruments = relatedInstruments(theme);
  document.querySelector("#instrumentList").innerHTML = treasureInstruments.length
    ? treasureInstruments.map((instrument, index) => {
      const instrumentLocked = locked || (!state.isPro && index > 0);
      const signal = instrumentFinalSignal(instrument, stockQuoteFor(instrument.ticker));
      return `
      <div class="instrument">
        <span class="ticker">${instrumentLocked ? "LOCK" : instrument.ticker}</span>
        <span>
          ${instrumentLocked ? "" : `
            <span class="instrument-meta">
              <span class="order-pill">確認順 ${index + 1}</span>
              <span class="final-pill ${signal.tone}">${signal.label}</span>
            </span>
          `}
          ${instrumentLocked ? "Pro限定の関連銘柄" : instrument.name}
          <small>${instrumentLocked ? "銘柄名・お宝度・悪材料確認はProで表示されます" : `${instrument.type} / お宝度 ${instrumentScore(instrument)} / ${instrument.quality || "業績良好候補"} / ${instrument.newsRisk || "悪材料未検出"}`}</small>
        </span>
        ${instrumentLocked ? "" : renderInstrumentMarketBlock(instrument, stockQuoteFor(instrument.ticker))}
      </div>
    `;
    })
      .join("")
    : '<p class="empty">上がりすぎ・悪材料・値動き注意を除外すると、今すぐ表示できるお宝候補はありません。</p>';

  document.querySelector("#dataPoints").innerHTML = `
    <dt>判断</dt><dd><span class="action-stage ${locked ? "observe" : actionStage.className}">${locked ? "Pro限定" : actionStage.label}</span></dd>
    <dt>理由</dt><dd>${locked ? "重要な資金フロー候補のため無料プレビューでは伏せています。" : actionStage.reason}</dd>
    <dt>総合スコア</dt><dd>${locked ? "LOCK" : score}</dd>
    <dt>価格モメンタム</dt><dd>${locked ? "LOCK" : `${m.momentum}%`}</dd>
    <dt>出来高増加</dt><dd>${locked ? "LOCK" : `${m.volume}%`}</dd>
    <dt>資金流入推定</dt><dd>${locked ? "LOCK" : `${m.fundFlow}%`}</dd>
    <dt>ニュース増加</dt><dd>${locked ? "LOCK" : `${m.news}%`}</dd>
    <dt>AI妥当性</dt><dd>${locked ? "LOCK" : `${m.ai}%`}</dd>
    <dt>信頼度</dt><dd>${locked ? "LOCK" : `${m.confidence}%`}</dd>
  `;

}

function stockQuoteFor(ticker) {
  return state.instrumentQuotes?.[String(ticker)] || null;
}

function formatChange(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function instrumentFinalSignal(instrument, quote) {
  const p90 = Number(quote?.changes?.["90d"]);
  const p30 = Number(quote?.changes?.["30d"]);
  const p7 = Number(quote?.changes?.["7d"]);
  const v30 = Number(quote?.changes?.volume30d);
  const v7 = Number(quote?.changes?.volume7d);
  const ready = [p90, p30, p7, v30, v7].every(Number.isFinite);

  if (!ready) {
    return { label: "履歴不足", tone: "neutral", kind: "neutral" };
  }

  const aligned = p90 > 0 && p30 > p90 && p7 > p30 && v7 > v30 && instrumentScore(instrument) >= 70;
  if (aligned) {
    return { label: "買い", tone: "buy", kind: "buy" };
  }

  const riding = p90 > 0 && p30 > 0 && p7 > 0;
  if (riding) {
    return { label: "監視", tone: "watch", kind: "watch" };
  }

  const early = p90 <= 0 && p30 > 0;
  if (early) {
    return { label: "出遅れ", tone: "watch", kind: "early" };
  }

  return { label: "様子見", tone: "neutral", kind: "neutral" };
}

function renderInstrumentMarketBlock(instrument, quote) {
  const p90 = quote?.changes?.["90d"];
  const p30 = quote?.changes?.["30d"];
  const p7 = quote?.changes?.["7d"];
  const v30 = quote?.changes?.volume30d;
  const v7 = quote?.changes?.volume7d;
  const stage = (() => {
    const priceReady = [p90, p30, p7].every((value) => Number.isFinite(Number(value)));
    const volumeImproving = Number.isFinite(Number(v30)) && Number.isFinite(Number(v7)) && Number(v7) > Number(v30);
    if (!priceReady) return { state: "履歴不足", label: "履歴不足", badge: "履歴不足", tone: "neutral", detail: "株価データがまだ足りません" };
    if (p90 > 0 && p30 > p90 && p7 > p30) {
      return {
        state: "判定あり",
        label: "買われ続けている",
        badge: "加速",
        tone: "good",
        detail: volumeImproving ? "価格と出来高がそろって伸長" : "短中期の上昇が連続"
      };
    }
    if (p90 > 0 && p30 > 0 && p7 > 0) {
      return {
        state: "判定あり",
        label: "買われている",
        badge: "継続",
        tone: "good",
        detail: volumeImproving ? "上昇基調と出来高増が継続" : "上昇基調を維持"
      };
    }
    if (p90 > 0 && p30 > 0 && p7 <= 0) {
      return { state: "判定あり", label: "勢い鈍化", badge: "失速", tone: "warn", detail: "短期で勢いが落ちています" };
    }
    if (p90 <= 0 && p30 > 0) {
      return { state: "判定あり", label: "買われ始め", badge: "発芽", tone: "warn", detail: "中期で上向きに転じています" };
    }
    return { state: "様子見", label: "様子見", badge: "確認中", tone: "neutral", detail: "まだ方向感が弱いです" };
  })();
  return `
    <div class="instrument-market">
      <div class="instrument-stage ${stage.tone}">
        <div class="stage-head">
          <span class="stage-kicker">判定</span>
          <div class="trend-badge">${stage.badge}</div>
        </div>
        <div class="stage-row">
          <span class="stage-kicker">状態</span>
          <strong class="stage-label">${stage.state}</strong>
        </div>
        <div class="stage-row">
          <span class="stage-kicker">段階</span>
          <strong class="stage-label">${stage.label}</strong>
        </div>
        <small class="stage-detail">${stage.detail}</small>
      </div>
      <div class="trend-card">
        <span>90日</span>
        <strong>${formatChange(p90)}</strong>
      </div>
      <div class="trend-card">
        <span>30日</span>
        <strong>${formatChange(p30)}</strong>
      </div>
      <div class="trend-card">
        <span>7日</span>
        <strong>${formatChange(p7)}</strong>
      </div>
      <div class="trend-card trend-wide">
        <span>出来高</span>
        <strong>${formatChange(v30)}</strong>
        <small>30日平均との差</small>
      </div>
    </div>
  `;
}

function buildAiSummary(theme, score) {
  const m = theme.metrics[state.period];
  const mainDriver = theme.drivers[0];
  const condition = m.breadth >= 70
    ? "関連銘柄全体に買いが広がっており、日本市場内の循環物色として確認しやすい状態です。"
    : "まだ一部の主力銘柄に反応が偏っているため、東証ETFや周辺銘柄への広がりを確認する必要があります。";
  const risk = m.crowdedness >= 75
    ? "過熱度が高く、好材料が出ても利益確定売りで上値が重くなる局面に注意が必要です。"
    : "過熱度は極端ではなく、出来高、為替、日銀・政策ニュースの継続が次の確認点です。";
  const flow = m.fundFlow >= 75
    ? `資金流入推定は${m.fundFlow}で、資金は強めに集まっています。`
    : `資金流入推定は${m.fundFlow}で、資金は確認できますが強い流入にはまだ届いていません。`;

  return `
    <p><strong>観測事実:</strong> ${theme.name}は${periodLabel()}で総合スコア ${score}、資金量 ${m.fundFlow}、加速度 ${accelerationForPeriod(theme, state.period)}です。${flow}</p>
    <p><strong>理由仮説:</strong> 主な背景は「${mainDriver}」。関連要因として${theme.drivers.slice(1).join("、")}が見られます。</p>
    <p><strong>継続条件:</strong> ${condition}</p>
    <p><strong>崩れる条件:</strong> ${risk}</p>
    <p><strong>用語の見方:</strong> 加速度は「今の期間で勢いが増えているか」です。過熱度は「買われすぎ・混みすぎで反落しやすいか」です。加速度が高くても、過熱度が高い場合は追いかけ買いに注意します。</p>
  `;
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-upgrade]");
    if (!target) return;
    event.preventDefault();
    openUpgrade();
  });

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#${button.dataset.scrollTarget}`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-period]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.period = button.dataset.period;
      renderList();
    });
  });

  document.querySelector("#assetFilter").addEventListener("change", (event) => {
    state.assetClass = event.target.value;
    renderList();
  });

  document.querySelector("#stageFilter").addEventListener("change", (event) => {
    state.stage = event.target.value;
    renderList();
  });

  document.querySelector("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderList();
  });

  document.querySelector("#hideCrowded").addEventListener("change", (event) => {
    state.hideCrowded = event.target.checked;
    renderList();
  });

  document.querySelector("#liquidityOnly").addEventListener("change", (event) => {
    state.liquidityOnly = event.target.checked;
    renderList();
  });

  document.querySelector("#mapZoomOut").addEventListener("click", () => {
    setMapZoom(state.mapZoom - 0.1);
  });

  document.querySelector("#mapZoomIn").addEventListener("click", () => {
    setMapZoom(state.mapZoom + 0.1);
  });

  document.querySelector("#mapFullscreen").addEventListener("click", () => {
    setMapFullscreen(!state.mapFullscreen);
  });

  document.querySelector("#refreshData")?.addEventListener("click", async () => {
    const button = document.querySelector("#refreshData");
    if (button) {
      button.disabled = true;
      button.textContent = "更新中...";
    }
    try {
      if (isLocalDevHost()) {
        await fetch("/api/recompute-themes", { method: "POST", cache: "no-store" }).catch(() => null);
      }
      await loadMarketData({ force: true });
      await loadAiResearch({ force: true });
      await loadIntegratedRanking();
      renderList();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "データ更新";
      }
    }
  });

}

function simulateDailyRefresh() {
  themes.forEach((theme) => {
    Object.values(theme.metrics).forEach((metric) => {
      ["momentum", "volume", "fundFlow", "breadth", "news", "ai"].forEach((key) => {
        const shift = Math.round((Math.random() - 0.5) * 4);
        metric[key] = clamp(metric[key] + shift);
      });
    });
  });
  saveDailyCache();
  setUpdatedAt(true);
}

function cacheKey() {
  const today = new Intl.DateTimeFormat("ja-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  return `fund-flow-ai-map:${today}`;
}

function rankHistoryKey() {
  return "fund-flow-ai-map:rank-history";
}

function rankSnapshotKey() {
  return `${state.period}:${state.assetClass}:${state.stage}:${state.liquidityOnly ? "liquidity" : "all"}:${state.hideCrowded ? "hide-crowded" : "show-crowded"}`;
}

function loadRankHistory() {
  try {
    const raw = localStorage.getItem(rankHistoryKey());
    if (!raw) return;
    state.previousRanks = JSON.parse(raw) || {};
  } catch {
    state.previousRanks = {};
  }
}

async function loadPublicRankHistory({ force = false } = {}) {
  if (typeof window === "undefined" || window.location.protocol === "file:") return false;
  try {
    const cacheBust = `?t=${Date.now()}`;
    const response = await fetch(`data/ranking-history.json${cacheBust}`, { cache: "no-store" });
    if (!response.ok) return false;
    state.publicRankHistory = await response.json();
    return true;
  } catch {
    return false;
  }
}

function saveRankSnapshot(list) {
  try {
    const history = {
      ...state.previousRanks,
      [rankSnapshotKey()]: {
        savedAt: new Date().toISOString(),
        ranks: Object.fromEntries(list.map((theme, index) => [theme.id, index + 1]))
      }
    };
    localStorage.setItem(rankHistoryKey(), JSON.stringify(history));
    state.previousRanks = history;
  } catch {
    // ランク履歴は補助表示なので、保存できなくても画面表示は続ける。
  }
}

function rankMoveFor(themeId, currentRank) {
  const snapshot = state.publicRankHistory?.previous?.[rankSnapshotKey()] || state.previousRanks?.[rankSnapshotKey()];
  const previousRank = snapshot?.ranks?.[themeId];
  if (!previousRank) return { label: "新", className: "new", title: "前回記録なし" };
  const diff = previousRank - currentRank;
  if (diff > 0) return { label: `↑${diff}`, className: "up", title: `前回${previousRank}位から${diff}ランク上昇` };
  if (diff < 0) return { label: `↓${Math.abs(diff)}`, className: "down", title: `前回${previousRank}位から${Math.abs(diff)}ランク下落` };
  return { label: "→", className: "flat", title: `前回${previousRank}位から変化なし` };
}

function saveDailyCache() {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      themes: themes.map((theme) => ({ id: theme.id, metrics: theme.metrics }))
    };
    localStorage.setItem(cacheKey(), JSON.stringify(payload));
  } catch {
    // localStorageが使えない環境ではサンプルデータのまま表示する。
  }
}

function loadDailyCache() {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (!raw) return null;
    const payload = JSON.parse(raw);
    payload.themes.forEach((cachedTheme) => {
      const theme = themeById(cachedTheme.id);
      if (theme && cachedTheme.metrics) {
        theme.metrics = cachedTheme.metrics;
        refreshThemeStageFromMetrics(theme);
      }
    });
    return payload.savedAt;
  } catch {
    return null;
  }
}

function refreshThemeStageFromMetrics(theme) {
  const m7 = theme.metrics["7d"];
  const m30 = theme.metrics["30d"];
  const m90 = theme.metrics["90d"];
  const accel = m7.fundFlow - m30.fundFlow;
  const trend = m30.fundFlow - m90.fundFlow;
  if (m7.crowdedness >= 72 || (m7.fundFlow >= 76 && accel <= 4)) {
    theme.stage = "crowded";
    return;
  }
  if (accel >= 8 && trend >= 0 && m7.crowdedness < 68) {
    theme.stage = "emerging";
    return;
  }
  theme.stage = "continuing";
}

function applyMarketDataPayload(payload) {
  state.macroSignals = payload?.macro || null;
  state.instrumentQuotes = payload?.instrumentQuotes || state.instrumentQuotes || {};
  state.macroStatus = macroStatusFromPayload(payload);

  if (!payload || !Array.isArray(payload.themes) || !payload.themes.length) {
    state.dataSource = payload?.source || "sample";
    state.dataMessage = payload?.message || "";
    state.marketStatus = {
      state: state.dataSource === "sample" ? "error" : "pending",
      text: state.dataMessage || "取得データなし"
    };
    return false;
  }

  let applied = 0;
  payload.themes.forEach((remoteTheme) => {
    const theme = themeById(remoteTheme.id);
    if (!theme || !remoteTheme.metrics) return;
    theme.metrics = {
      ...theme.metrics,
      ...remoteTheme.metrics
    };
    refreshThemeStageFromMetrics(theme);
    applied += 1;
  });

  state.dataSource = payload.source || "api";
  state.dataMessage = payload.message || "";
  state.macroSignals = payload.macro || null;
  state.macroStatus = macroStatusFromPayload(payload);
  state.marketStatus = {
    state: "success",
    text: `${marketDataSourceLabel(false)} / ${applied}テーマ / ${formatStatusTime(payload.updatedAt)}`
  };
  return applied > 0;
}

function applyAiResearchPayload(payload) {
  if (!payload || !Array.isArray(payload.candidates) || !payload.candidates.length) {
    state.aiResearch = null;
    state.aiResearchMessage = payload?.message || "";
    state.geminiStatus = {
      state: "error",
      text: state.aiResearchMessage || "Gemini調査データなし"
    };
    return false;
  }

  state.aiResearch = payload;
  state.aiResearchMessage = payload.message || "";
  const isTemporaryGeminiError = /503|504|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(state.aiResearchMessage);
  state.geminiStatus = {
    state: payload.source === "gemini" ? "success" : "pending",
    text: payload.source === "gemini"
      ? `${payload.model || "Gemini"} / ${payload.candidates.length}候補 / ${formatStatusTime(payload.updatedAt)}`
      : isTemporaryGeminiError
        ? `Gemini一時混雑 / 暫定候補 / ${formatStatusTime(payload.updatedAt)}`
        : `Gemini未実行 / ${payload.message || "暫定候補"}`
  };
  return true;
}

function formatStatusTime(value) {
  if (!value) return "時刻不明";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Tokyo"
    }).format(new Date(value));
  } catch {
    return "時刻不明";
  }
}

function macroStatusFromPayload(payload) {
  const alpha = payload?.macro?.alpha;
  if (!alpha || alpha.source === "not_configured") {
    return { state: "pending", text: "未設定: ALPHA_VANTAGE_API_KEY" };
  }

  const fxCount = Object.keys(alpha.fx || {}).length;
  const commodityCount = Object.keys(alpha.commodities || {}).length;
  const errorCount = Array.isArray(alpha.errors) ? alpha.errors.length : 0;
  if (fxCount + commodityCount > 0) {
    return {
      state: errorCount ? "pending" : "success",
      text: `取得済み: 為替${fxCount} / 商品${commodityCount}${errorCount ? ` / 一部失敗${errorCount}` : ""}`
    };
  }

  return { state: "error", text: errorCount ? `取得失敗: ${errorCount}件` : "マクロデータなし" };
}

function renderApiStatus() {
  const pairs = [
    ["marketApiStatus", state.marketStatus],
    ["macroApiStatus", state.macroStatus],
    ["geminiApiStatus", state.geminiStatus]
  ];

  pairs.forEach(([id, status]) => {
    const element = document.querySelector(`#${id}`);
    if (!element) return;
    const dot = element.querySelector(".status-dot");
    const small = element.querySelector("small");
    dot.className = `status-dot ${status.state || "pending"}`;
    small.textContent = status.text || "確認中";
  });
}

function isLocalDevHost() {
  const host = window.location.hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function marketDataSourceLabel(refreshed = false) {
  const sourceNames = {
    "jquants-v2": isLocalDevHost() ? "ローカル: J-Quants V2" : "実データ: J-Quants V2",
    "jquants-v1": isLocalDevHost() ? "ローカル: J-Quants V1" : "実データ: J-Quants V1",
    "github-pages": "実データ: GitHub更新",
    local: "ローカル保存データ",
    jquants: "実データ: J-Quants",
    api: "実データ: API",
    sample: "サンプル"
  };
  const source = sourceNames[state.dataSource] || state.dataSource || "サンプル";
  return refreshed ? `${source} / 再取得` : source;
}

async function fetchMarketDataPayload(force) {
  const cacheBust = `?t=${Date.now()}`;
  const suffix = force ? "?refresh=1" : "";
  const publicMarketData = `https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/data/market-data.json${cacheBust}`;
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const isLocal = isLocalDevHost();
  const localEndpoints = [`data/market-data.json${cacheBust}`, `/api/market-data${suffix}`, `api/market-data${suffix}`];
  const endpoints = isLocal
    ? localEndpoints
    : isGitHubPages
      ? localEndpoints
      : [publicMarketData, ...localEndpoints];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${endpoint}`);
      const payload = await response.json();
      if (!isLocal && isGitHubPages && endpoint.includes("data/market-data.json") && payload.source?.startsWith("jquants")) {
        payload.source = "github-pages";
      }
      if (isLocal && endpoint.includes("data/market-data.json") && payload.source?.startsWith("jquants")) {
        payload.source = "local";
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("市場データを取得できませんでした。");
}

async function fetchAiResearchPayload(force) {
  const cacheBust = `?t=${Date.now()}`;
  const publicAiResearch = `https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/data/ai-research.json${cacheBust}`;
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const endpoints = isLocalDevHost()
    ? [`data/ai-research.json${cacheBust}`, publicAiResearch]
    : isGitHubPages
      ? [`data/ai-research.json${cacheBust}`, publicAiResearch]
      : [publicAiResearch, `data/ai-research.json${cacheBust}`];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${endpoint}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Gemini調査データを取得できませんでした。");
}

async function loadAiResearch({ force = false } = {}) {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    return false;
  }

  try {
    const payload = await fetchAiResearchPayload(force);
    const applied = applyAiResearchPayload(payload);
    renderApiStatus();
    return applied;
  } catch (error) {
    state.aiResearch = null;
    state.aiResearchMessage = error.message;
    state.geminiStatus = { state: "error", text: error.message };
    renderApiStatus();
    return false;
  }
}

async function fetchIntegratedRankingPayload() {
  const cacheBust = `?t=${Date.now()}`;
  const publicUrl = `https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/data/treasure-stocks.json${cacheBust}`;
  const localUrl = `data/treasure-stocks.json${cacheBust}`;

  // ローカル開発時 (127.0.0.1:8790 など) は「公開CI版」と「ローカル生成ファイル」の
  // 両方を並行取得し、updatedAt が新しい方を自動採用する。
  // GitHub Pages 上では相対パスを優先して同一オリジンで取得（CORS回避）。
  // ローカルで recompute してより新しいデータを作った場合はそちらを優先し、
  // そうでなければ常に最新の公開データを表示する。
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const tryUrls = isLocalDevHost()
    ? [localUrl, publicUrl]
    : isGitHubPages
      ? [localUrl, publicUrl]
      : [publicUrl, localUrl];

  const fetched = [];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const ts = json && (json.updatedAt || json.marketUpdatedAt || json.date || "");
        fetched.push({ json, ts: String(ts) });
      }
    } catch (_) {
      // 片方が失敗してももう片方を使えるようにする
    }
  }

  if (fetched.length === 0) {
    throw new Error("統合ランキングデータを取得できませんでした。");
  }

  // updatedAt (または同等フィールド) が辞書順で最新のものを選ぶ
  fetched.sort((a, b) => b.ts.localeCompare(a.ts));
  return fetched[0].json;
}

function signalClass(signal = "") {
  if (/買い|buy/i.test(signal)) return "buy";
  if (/監視|watch/i.test(signal)) return "watch";
  if (/初動|early/i.test(signal)) return "early";
  return "neutral";
}

function isIndexLinkedStock(stock = {}) {
  return /ETF|投信|連動|REIT|リート/i.test(`${stock.type || ""} ${stock.name || ""}`);
}

// === 統合ランキング選択ロジック（scripts/lib/integrated-ranking-compare.js の selectSheetStocks と完全に一致させる） ===
// これにより、公開ページのデフォルト表示（10件）とスプレッドシートの「統合ランキング」シートが
// 同じ treasure-stocks.json に対して全く同じ銘柄・同じ順位になる。
function selectIntegratedRankingStocks(stocks, limit = 10, includeEtf = false) {
  const picked = [];
  for (const stock of stocks || []) {
    if (picked.length >= limit) break;
    if (!includeEtf && isIndexLinkedStock(stock)) continue;
    picked.push(stock);
  }
  if (picked.length < limit) {
    for (const stock of stocks || []) {
      if (picked.length >= limit) break;
      if (!picked.some((item) => item.code === stock.code)) picked.push(stock);
    }
  }
  return picked;
}

function formatNumber(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(number);
}

function formatSignedPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function integratedRankingDateKey(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function integratedSnapshotDates(snapshots = {}) {
  return Object.keys(snapshots).filter((date) => snapshots[date]?.stocks).sort();
}

function integratedRankMoveLabel(previousRank, currentRank) {
  if (!Number.isFinite(previousRank)) {
    return { label: "新規", className: "new", title: "前日ランキング外" };
  }
  const diff = previousRank - currentRank;
  if (diff > 0) return { label: `↑${diff}`, className: "up", title: `前日${previousRank}位→当日${currentRank}位` };
  if (diff < 0) return { label: `↓${Math.abs(diff)}`, className: "down", title: `前日${previousRank}位→当日${currentRank}位` };
  return { label: "→", className: "flat", title: `前日${previousRank}位から変化なし` };
}

function integratedValueDelta(current, previous) {
  const cur = Number(current);
  const prev = Number(previous);
  if (!Number.isFinite(cur)) return "-";
  if (!Number.isFinite(prev)) return String(cur);
  if (cur === prev) return `${cur} (±0)`;
  const diff = cur - prev;
  return `${prev}→${cur} (${diff > 0 ? "+" : ""}${diff})`;
}

function buildIntegratedComparisons(ranking, historyPayload) {
  const snapshots = historyPayload?.snapshots || {};
  const dates = integratedSnapshotDates(snapshots);
  const todayDate = integratedRankingDateKey(ranking?.updatedAt);
  const effectiveTodayDate = snapshots[todayDate] ? todayDate : dates[dates.length - 1] || todayDate;
  const priorDates = dates.filter((date) => date < effectiveTodayDate);
  const yesterdayDate = priorDates[priorDates.length - 1] || null;
  const dayBeforeDate = priorDates.length >= 2 ? priorDates[priorDates.length - 2] : null;
  const allStocks = Array.isArray(ranking?.stocks) ? ranking.stocks : [];
  // シート送信用の comparisons と同じトップN選択（limit=10, includeEtf=false）
  const stocks = selectIntegratedRankingStocks(allStocks, 10, false);

  const items = stocks.map((stock, index) => {
    const code = String(stock.code || "").trim();
    const currentRank = index + 1;
    const yesterday = yesterdayDate ? snapshots[yesterdayDate]?.stocks?.[code] : null;
    const dayBefore = dayBeforeDate ? snapshots[dayBeforeDate]?.stocks?.[code] : null;
    const move = integratedRankMoveLabel(yesterday?.rank, currentRank);
    const tpChanged = Number.isFinite(Number(yesterday?.tp)) && Number(yesterday.tp) !== Number(stock.tp);
    const slChanged = Number.isFinite(Number(yesterday?.sl)) && Number(yesterday.sl) !== Number(stock.sl);
    return {
      code,
      rank: currentRank,
      prevRank: yesterday?.rank ?? null,
      prev2Rank: dayBefore?.rank ?? null,
      move,
      tpChange: integratedValueDelta(stock.tp, yesterday?.tp),
      slChange: integratedValueDelta(stock.sl, yesterday?.sl),
      tpChanged,
      slChanged
    };
  });

  return {
    todayDate: effectiveTodayDate,
    yesterdayDate,
    dayBeforeDate,
    items,
    counts: {
      added: items.filter((item) => item.move.className === "new").length,
      rankUps: items.filter((item) => item.move.className === "up").length,
      rankDowns: items.filter((item) => item.move.className === "down").length,
      tpChanged: items.filter((item) => item.tpChanged).length,
      slChanged: items.filter((item) => item.slChanged).length
    }
  };
}

async function fetchIntegratedRankingHistoryPayload() {
  const cacheBust = `?t=${Date.now()}`;
  const publicHistory = `https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/data/integrated-ranking-history.json${cacheBust}`;
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const endpoints = isLocalDevHost()
    ? [`data/integrated-ranking-history.json${cacheBust}`, publicHistory]
    : isGitHubPages
      ? [`data/integrated-ranking-history.json${cacheBust}`, publicHistory]
      : [publicHistory, `data/integrated-ranking-history.json${cacheBust}`];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${endpoint}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("統合ランキング履歴を取得できませんでした。");
}

// === 統合ランキング 買い目標到達 観測 / 利確損切カウント機能 ===
// 標準モードとゆるめモードで別管理。到達時点のシグナル(統合買い候補/監視継続/確認候補/見送り)で分類。
// localStorage 永続化（ブラウザ検証用）。データ更新のたびフルリストから新規ヒット検知 + 既存のTP/SL解決をチェック。
const OBS_STORAGE_KEY = 'integratedBuyTargetObs_v1';

function makeEmptyCounts() {
  return {
    "統合買い候補": { tp: 0, sl: 0 },
    "監視継続": { tp: 0, sl: 0 },
    "確認候補": { tp: 0, sl: 0 },
    "見送り": { tp: 0, sl: 0 }
  };
}

function normalizeObs(obs) {
  if (!obs || typeof obs !== 'object') {
    obs = {};
  }
  for (const key of ['standard', 'relax']) {
    if (!obs[key] || typeof obs[key] !== 'object') {
      obs[key] = { active: [], closed: [], counts: makeEmptyCounts() };
    }
    const d = obs[key];
    if (!Array.isArray(d.active)) d.active = [];
    if (!Array.isArray(d.closed)) d.closed = [];
    if (!d.counts || typeof d.counts !== 'object') d.counts = makeEmptyCounts();
    for (const cat of Object.keys(makeEmptyCounts())) {
      if (!d.counts[cat] || typeof d.counts[cat] !== 'object') d.counts[cat] = { tp: 0, sl: 0 };
    }
  }
  return obs;
}

function loadObservations() {
  try {
    const raw = localStorage.getItem(OBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeObs(parsed);
    }
  } catch (_) {}
  return normalizeObs({});
}

function saveObservations(obs) {
  const normalized = normalizeObs(obs);
  try {
    localStorage.setItem(OBS_STORAGE_KEY, JSON.stringify(normalized));
  } catch (_) {}

  // ローカルサーバー (127.0.0.1:8790 など) の場合、ファイルにも永続化
  // これによりローカル環境でも利確/損切カウントがサーバー再起動後も残り、
  // 公開用と同じように標準/ゆるめモード別のカウントを管理できる。
  if (isLocalDevHost()) {
    fetch('/api/integrated-obs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }).catch(() => {});
  }
}

// 観測スペースの到達検知・利確/損切判定は GitHub Actions (scripts/update-integrated-obs.js) が
// サーバー側で実行し、data/integrated-obs.json として公開される。ブラウザは表示専用で、
// localStorage は最後に取得した共有データのキャッシュとしてのみ使う。
// （従来のブラウザ側検知は、buyが現在価格から毎回再計算されるため標準モードで到達が
//   構造的に発生しない欠陥があった。買い目標の日次固定はサーバー側で行う。）
let lastObsFetchAt = 0;

async function refreshSharedObservations() {
  if (Date.now() - lastObsFetchAt < 60000) return state.buyTargetObservations;
  lastObsFetchAt = Date.now();
  const cacheBust = `?t=${Date.now()}`;
  const publicObs = `https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/data/integrated-obs.json${cacheBust}`;
  const endpoints = isLocalDevHost()
    ? ['/api/integrated-obs', `data/integrated-obs.json${cacheBust}`]
    : [`data/integrated-obs.json${cacheBust}`, publicObs];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const fileData = await res.json();
      if (!fileData || typeof fileData !== 'object') continue;
      const normalized = normalizeObs(fileData);
      state.buyTargetObservations = normalized;
      try { localStorage.setItem(OBS_STORAGE_KEY, JSON.stringify(normalized)); } catch (_) {}
      if (document.getElementById('standardObsList') || document.getElementById('relaxObsList')) {
        renderBuyTargetObservations();
      }
      // 固定目標(targets)が更新されたらランキングの🎯バッジにも反映する。
      // renderIntegratedRanking → processBuyTargetObservations → 本関数の再帰は
      // 冒頭の60秒スロットルで止まる。
      if (document.querySelector('#integratedRankingList')) renderIntegratedRanking();
      return normalized;
    } catch (_) {}
  }
  return null;
}

function getCategoryLabel(sig) {
  const s = String(sig || '');
  if (/統合.*買|buy.*cand/i.test(s)) return "統合買い候補";
  if (/監視|watch|継続/i.test(s)) return "監視継続";
  if (/確認|cand/i.test(s)) return "確認候補";
  if (/見送|skip|pass/i.test(s)) return "見送り";
  return s || "見送り";
}

// === 仮想資金シミュレーション表示（サーバー側 update-integrated-obs.js が計算） ===
// 観測スペースへの追加＝1銘柄100万円購入（見送り・監視継続シグナルは対象外）、利確/損切で資金が増減する。
const PF_INITIAL_CAPITAL = 50000000;

function formatYen(value) {
  return Math.round(Number(value) || 0).toLocaleString('ja-JP');
}

function makeEmptyPortfolioClient() {
  return {
    initialCapital: PF_INITIAL_CAPITAL,
    cash: PF_INITIAL_CAPITAL,
    positions: {},
    history: [],
    skipped: [],
    realizedPnl: 0,
    startedAt: null,
    positionValue: 0,
    unrealizedPnl: 0,
    equity: PF_INITIAL_CAPITAL,
    tpCount: 0,
    slCount: 0
  };
}

function getPortfolioVariants(obs, modeKey) {
  let m = obs.portfolio && obs.portfolio[modeKey];
  // 旧形式（フラット構造）は fixed として扱う
  if (m && typeof m === 'object' && Number.isFinite(Number(m.cash))) m = { fixed: m };
  return (m && typeof m === 'object') ? m : null;
}

// 実戦候補順位（サーバー側 candidateRanking）。どのモード×方式の通知を実弾に使うかの目安。
// 損益率で自動更新され、成績差が無い間は初期優先度（標準>ゆるめ、100万固定>1単元）で並ぶ。
function getCandidateRank(obs, modeKey, variantKey) {
  const items = obs && obs.candidateRanking && Array.isArray(obs.candidateRanking.items)
    ? obs.candidateRanking.items : null;
  if (!items) return null;
  const found = items.find((c) => c.mode === modeKey && c.variant === variantKey);
  return found ? found.rank : null;
}

function renderPortfolioPanel(modeKey, obs) {
  const el = document.getElementById(modeKey === 'relax' ? 'relaxPortfolio' : 'standardPortfolio');
  if (!el) return;
  const variants = getPortfolioVariants(obs, modeKey);
  const defs = [
    { key: 'fixed', label: '100万円固定', hint: '1銘柄ちょうど100万円分購入（端株可・S株想定）。全銘柄が同じ重み＝戦略の期待値がそのまま資金曲線に出る' },
    { key: 'unit', label: '1単元(100株)', hint: '実際の発注と同じ1単元（100株）購入。銘柄の株価によって投入額が変わる。資金不足の単元はスキップ' },
    { key: 'risk', label: 'リスク均等', hint: '損切までの値幅から株数を逆算し、どの銘柄も損切時の損失が同額（5万円）になるように購入。1銘柄への集中を防ぐため投入額は500万円で頭打ち（auto_trader由来のリスク基準ロット方式・2026-07-03追加）' }
  ];
  if (!variants || !defs.some((d) => variants[d.key] && Number.isFinite(Number(variants[d.key].cash)))) {
    el.innerHTML = '<span class="obs-pf-note">💰 仮想資金シミュレーション（各5,000万円 / 100万円固定・1単元・リスク均等の3方式）は次回のサーバー更新から開始されます。</span>';
    return;
  }
  const rows = defs.map((def) => {
    const pf = variants[def.key];
    if (!pf || !Number.isFinite(Number(pf.cash))) {
      return `<div class="obs-pf-variant"><span class="obs-pf-label" title="${def.hint}">${def.label}</span><span class="obs-pf-note">次回サーバー更新から開始</span></div>`;
    }
    const initial = Number(pf.initialCapital) || PF_INITIAL_CAPITAL;
    const equity = Number.isFinite(Number(pf.equity)) ? Number(pf.equity) : Number(pf.cash);
    const totalPnl = equity - initial;
    const totalPct = ((totalPnl / initial) * 100).toFixed(2);
    const cls = totalPnl > 0 ? 'pos' : (totalPnl < 0 ? 'neg' : '');
    const posCount = Object.keys(pf.positions || {}).length;
    const unreal = Number(pf.unrealizedPnl || 0);
    const realized = Number(pf.realizedPnl || 0);
    const skippedCount = (pf.skipped || []).length;
    const rank = getCandidateRank(obs, modeKey, def.key);
    const rankBasis = obs.candidateRanking ? obs.candidateRanking.basis : null;
    const rankHtml = rank
      ? `<span class="obs-pf-rank rank-${rank}" title="実戦で絞る場合の優先順位。損益率で自動更新${rankBasis === 'structural' ? '（現在は成績差が無いため初期優先度: 標準>ゆるめ・100万固定>1単元）' : ''}">第${rank}候補</span>`
      : '';
    return `
      <div class="obs-pf-variant">
        <div class="obs-pf-main">
          <span class="obs-pf-label" title="${def.hint}">${def.label}</span>
          ${rankHtml}
          <span class="obs-pf-equity ${cls}" title="初期資金 ${formatYen(initial)}円（見送り・監視継続シグナルは購入対象外）">💰 評価額 <b>${formatYen(equity)}円</b> <small>(${totalPnl >= 0 ? '+' : ''}${formatYen(totalPnl)}円 / ${totalPnl >= 0 ? '+' : ''}${totalPct}%)</small></span>
        </div>
        <div class="obs-pf-detail">
          <span>現金 ${formatYen(pf.cash)}円</span>
          <span>保有 ${posCount}銘柄（評価 ${formatYen(pf.positionValue || 0)}円 / 含み ${unreal >= 0 ? '+' : ''}${formatYen(unreal)}円）</span>
          <span>実現損益 ${realized >= 0 ? '+' : ''}${formatYen(realized)}円</span>
          ${skippedCount ? `<span title="資金不足で購入できなかったシグナル">スキップ ${skippedCount}件</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  el.innerHTML = `
    ${rows}
    <div class="obs-pf-actions">
      <button type="button" class="obs-reset-btn obs-pf-reset-btn" data-mode="${modeKey}">資金リセット</button>
    </div>
  `;
  const btn = el.querySelector('.obs-pf-reset-btn');
  if (btn) btn.addEventListener('click', handlePortfolioReset);
}

function handlePortfolioReset(e) {
  const btn = e.currentTarget || e.target;
  const mode = btn ? btn.dataset.mode : null;
  if (!mode) return;
  const label = mode === 'standard' ? '標準モード' : 'ゆるめモード';
  if (isLocalDevHost()) {
    if (!confirm(`${label} の仮想資金（100万円固定・1単元・リスク均等の全方式）を5,000万円に初期化します（観測カウント・決済履歴はそのまま）。よろしいですか？`)) return;
    const obs = normalizeObs(state.buyTargetObservations || loadObservations());
    if (!obs.portfolio || typeof obs.portfolio !== 'object') obs.portfolio = {};
    obs.portfolio[mode] = { fixed: makeEmptyPortfolioClient(), unit: makeEmptyPortfolioClient(), risk: makeEmptyPortfolioClient() };
    saveObservations(obs);
    state.buyTargetObservations = obs;
    renderBuyTargetObservations();
  } else {
    // 公開ページの仮想資金は GitHub Actions 管理の共有データ（全端末共通）のため、
    // Actions の手動実行（reset_portfolio にチェック）でリセットする。
    if (!confirm('仮想資金は全端末で共有しているため、GitHub Actions からリセットします。\n\nこれから開くページで「Run workflow」→「仮想資金…を初期化する」にチェック → 緑の「Run workflow」を押してください（標準/ゆるめ両方が5,000万円に戻り、数分で反映されます）。')) return;
    window.open('https://github.com/p27dff96428v8m9-pixel/auto-kabu-screener/actions/workflows/update-market-data.yml', '_blank', 'noopener');
  }
}

function processBuyTargetObservations() {
  // 到達検知・決済判定はサーバー側（update-integrated-obs.js）に移行済み。
  // ここでは表示用に localStorage キャッシュを state に載せ、共有データの取得をトリガーするだけ。
  if (!state.buyTargetObservations) state.buyTargetObservations = loadObservations();
  refreshSharedObservations().catch(() => {});
  return state.buyTargetObservations;
}

function renderBuyTargetObservations() {
  const listStd = document.getElementById('standardObsList');
  const listRel = document.getElementById('relaxObsList');
  const sumStd = document.getElementById('standardObsSummary');
  const sumRel = document.getElementById('relaxObsSummary');
  if (!listStd || !listRel || !sumStd || !sumRel) return;

  let obs = state.buyTargetObservations;
  if (!obs) {
    obs = loadObservations();
    state.buyTargetObservations = obs;
  }
  obs = normalizeObs(obs);

  const payload = state.integratedRanking;
  const stockMap = (payload && Array.isArray(payload.stocks))
    ? Object.fromEntries(payload.stocks.map((s) => [String(s.code || '').trim(), s]))
    : {};

  function renderPanel(modeKey, listEl, sumEl) {
    const data = obs[modeKey] || { active: [], closed: [], counts: makeEmptyCounts() };
    const cats = ["統合買い候補", "監視継続", "確認候補", "見送り"];
    let totalTp = 0;
    let totalSl = 0;
    const countLines = cats.map((cat) => {
      const c = data.counts[cat] || { tp: 0, sl: 0 };
      totalTp += c.tp || 0;
      totalSl += c.sl || 0;
      const short = cat === "統合買い候補" ? "買候" : (cat === "監視継続" ? "監視" : (cat === "確認候補" ? "確認" : "見送"));
      return `${short}利確${c.tp || 0}回 損切${c.sl || 0}回`;
    }).join(' ');

    // Compact: total prominent + detailed breakdown in title (hover)
    // リセットはローカル開発時のみ（公開ページの統計は GitHub Actions 管理の共有データのため）
    const resetBtnHtml = isLocalDevHost()
      ? `<button type="button" class="obs-reset-btn" data-mode="${modeKey}">リセット</button>`
      : '';
    // 利確/損切の回数は 100万固定 と 1単元 で別々に集計（同じ到達でも資金不足で1単元だけ
    // スキップ＝トレード不成立になり得るため、合算せず方式ごとに表示する）。
    const pfm = (obs.portfolio && obs.portfolio[modeKey]) || {};
    const fx = pfm.fixed || {};
    const un = pfm.unit || {};
    const rk = pfm.risk || {};
    const fxTp = Number(fx.tpCount) || 0;
    const fxSl = Number(fx.slCount) || 0;
    const unTp = Number(un.tpCount) || 0;
    const unSl = Number(un.slCount) || 0;
    const rkTp = Number(rk.tpCount) || 0;
    const rkSl = Number(rk.slCount) || 0;
    // 方式ごとの塊(obs-total-seg)は途中改行させず、狭い幅では塊単位で折り返す
    sumEl.innerHTML = `
      <span class="obs-total" title="カテゴリ別(観測): ${countLines}　／　観測合計 利確${totalTp}回 損切${totalSl}回"><span class="obs-total-seg">合計 <b>100万固定</b> 利確${fxTp}/損切${fxSl}</span> ｜ <span class="obs-total-seg"><b>1単元</b> 利確${unTp}/損切${unSl}</span> ｜ <span class="obs-total-seg"><b>リスク均等</b> 利確${rkTp}/損切${rkSl}</span></span>
      ${resetBtnHtml}
    `;

    // 仮想資金（評価額・現金・含み損益 + 資金リセットボタン）
    renderPortfolioPanel(modeKey, obs);

    if (!data.active || data.active.length === 0) {
      listEl.innerHTML = '<p class="obs-empty">現在このモードで観測中の銘柄はありません。統合ランキング上位銘柄が日次固定の買い目標に到達するとサーバー側で自動記録され、利確/損切まで価格を追跡します（約20分ごとに判定・全端末共有）。</p>';
      return;
    }

    listEl.innerHTML = data.active.map((item) => {
      const latest = stockMap[item.code];
      const curP = latest ? Number(latest.price) : null;
      const dispCur = (curP != null && Number.isFinite(curP)) ? formatNumber(curP, 1) : (item.hitPrice != null ? formatNumber(item.hitPrice, 1) : '-');
      const hitD = item.hitAt ? new Date(item.hitAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : '-';
      const cat = getCategoryLabel(item.signal);
      let prog = null;
      if (curP != null && item.buy && item.tp && (item.tp > item.buy)) {
        prog = Math.max(0, Math.min(100, ((curP - item.buy) / (item.tp - item.buy)) * 100));
      }
      const sigCls = signalClass(item.signal);
      const pfVariants = getPortfolioVariants(obs, modeKey);
      // 保有中の方式を列挙してバッジ表示（fixed/unit/riskの3方式。資金不足等で一部方式のみ保有もあり得る）
      const heldDefs = [
        { key: 'fixed', short: '100万' },
        { key: 'unit', short: '1単元' },
        { key: 'risk', short: 'リスク均等' }
      ];
      const heldList = heldDefs.filter((d) => {
        const pf = pfVariants && pfVariants[d.key];
        return pf && pf.positions && pf.positions[item.code];
      });
      let heldHtml = '';
      if (heldList.length === heldDefs.length) {
        const detail = heldList.map((d) => {
          const pos = pfVariants[d.key].positions[item.code];
          return `${d.short}: ${formatYen(pos.investedAmount)}円`;
        }).join(' / ');
        heldHtml = `<span class="obs-held" title="全方式で保有中（${detail}）">💰保有中</span>`;
      } else if (heldList.length) {
        const detail = heldList.map((d) => {
          const pos = pfVariants[d.key].positions[item.code];
          return `${d.short}: ${formatYen(pos.investedAmount)}円`;
        }).join(' / ');
        heldHtml = `<span class="obs-held" title="保有中: ${detail}（他方式は資金不足・計算不能等でスキップ）">💰保有(${heldList.map((d) => d.short).join('・')})</span>`;
      } else if (cat === '見送り' || cat === '監視継続') {
        heldHtml = `<span class="obs-held none" title="${cat}シグナルは仮想資金の購入対象外（対照群として観測のみ。監視継続は観測実績が損切に偏ったため2026-07-02から除外）">観測のみ</span>`;
      }
      return `
        <div class="obs-card" data-code="${item.code}">
          <div class="obs-card-head">
            <strong>${item.code}</strong>
            <span class="obs-name">${item.name || ''}</span>
            <span class="obs-signal ${sigCls}">${cat}</span>
            ${heldHtml}
          </div>
          <div class="obs-trade-row">
            <span>現在 <b>${dispCur}</b></span>
            <span>買い ${formatNumber(item.buy)}</span>
            <span>利確 ${formatNumber(item.tp)}</span>
            <span>損切 ${formatNumber(item.sl)}</span>
          </div>
          <div class="obs-meta-row">
            <span>到達 ${hitD} @${formatNumber(item.hitPrice, 1)}</span>
            ${prog != null ? `<span class="obs-prog">進捗 ${prog.toFixed(0)}%</span>` : ''}
            <span class="obs-mode-mini">${modeKey === 'relax' ? 'ゆるめ' : '標準'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPanel('standard', listStd, sumStd);
  renderPanel('relax', listRel, sumRel);

  // === 別スペース: 利確・損切 決済済み銘柄の表示 ===
  renderClosedBuyTargetHistory(obs);

  // Top-level visible counts for standard / ゆるめ modes (so the realized 利確/損切 counts are clearly displayed)
  const g = document.getElementById('obsGlobalCounts');
  if (g) {
    const stdData = obs.standard || { counts: makeEmptyCounts() };
    const relData = obs.relax || { counts: makeEmptyCounts() };
    let sTp = 0, sSl = 0, rTp = 0, rSl = 0;
    for (const cat of Object.keys(makeEmptyCounts())) {
      const sc = stdData.counts[cat] || { tp: 0, sl: 0 };
      const rc = relData.counts[cat] || { tp: 0, sl: 0 };
      sTp += sc.tp || 0; sSl += sc.sl || 0;
      rTp += rc.tp || 0; rSl += rc.sl || 0;
    }
    // 利確/損切回数は 100万固定 と 1単元 で別集計して表示（観測ベースの両方式合算はツールチップに残す）。
    const vc = (modeKey) => {
      const pfm = (obs.portfolio && obs.portfolio[modeKey]) || {};
      const fx = pfm.fixed || {};
      const un = pfm.unit || {};
      const rk = pfm.risk || {};
      return {
        fxTp: Number(fx.tpCount) || 0, fxSl: Number(fx.slCount) || 0,
        unTp: Number(un.tpCount) || 0, unSl: Number(un.slCount) || 0,
        rkTp: Number(rk.tpCount) || 0, rkSl: Number(rk.slCount) || 0
      };
    };
    const s = vc('standard');
    const r = vc('relax');
    // 地合いは参考表示のみ（2026-07-02のバックテスト結果を受けてエントリー停止フィルタは撤去済み）
    const guard = obs.entryGuard;
    let guardLine = '';
    if (guard && guard.regime && guard.regime.bullish === false) {
      const g = guard.regime;
      guardLine = `<span class="mode-stat guard" title="指数が25日線を下回っています。参考情報であり、新規エントリーは通常どおり行われます（バックテスト検証によりエントリー停止フィルタは撤去済み）">📉 地合い弱め（参考）: ${g.index} 25日線比 ${g.deviationPct}%・エントリーは継続</span>`;
    }
    // 実戦候補順位の一覧（サーバー計算）。実弾に移すときはこの順に絞る。
    const cr = obs.candidateRanking;
    let rankLine = '';
    if (cr && Array.isArray(cr.items) && cr.items.length) {
      const nm = (c) => `${c.mode === 'relax' ? 'ゆるめ' : '標準'}×${c.variant === 'unit' ? '1単元' : (c.variant === 'risk' ? 'リスク均等' : '100万固定')}`;
      const body = cr.items.map((c) => `<span class="obs-total-seg"><b>第${c.rank}候補</b> ${nm(c)} (${c.pnlPct >= 0 ? '+' : ''}${c.pnlPct}%)</span>`).join(' ');
      rankLine = `<span class="mode-stat ranking" title="実戦で絞る場合の優先順位。損益率で自動更新${cr.basis === 'structural' ? '（現在は成績差が無いため初期優先度: 標準>ゆるめ・100万固定>1単元）' : ''}。LINE通知にも同じ順位を表示">🏅 実戦候補順位: ${body}</span>`;
    }
    g.innerHTML = `
      ${guardLine}
      ${rankLine}
      <span class="mode-stat standard" title="観測ベース(全方式合算) 利確${sTp}回/損切${sSl}回"><strong>標準モード</strong> 100万固定 利確${s.fxTp}/損切${s.fxSl} ｜ 1単元 利確${s.unTp}/損切${s.unSl} ｜ リスク均等 利確${s.rkTp}/損切${s.rkSl}</span>
      <span class="mode-stat relax" title="観測ベース(全方式合算) 利確${rTp}回/損切${rSl}回"><strong>ゆるめモード</strong> 100万固定 利確${r.fxTp}/損切${r.fxSl} ｜ 1単元 利確${r.unTp}/損切${r.unSl} ｜ リスク均等 利確${r.rkTp}/損切${r.rkSl}</span>
    `;
  }

  // reset buttons (per panel)
  sumStd.querySelectorAll('.obs-reset-btn').forEach((btn) => {
    if (btn._obsBound) return;
    btn._obsBound = true;
    btn.addEventListener('click', handleObsReset);
  });
  sumRel.querySelectorAll('.obs-reset-btn').forEach((btn) => {
    if (btn._obsBound) return;
    btn._obsBound = true;
    btn.addEventListener('click', handleObsReset);
  });

  // 決済履歴パネル用のリセットボタンもバインド（存在する場合）
  const cSumStd = document.getElementById('standardClosedSummary');
  const cSumRel = document.getElementById('relaxClosedSummary');
  if (cSumStd) cSumStd.querySelectorAll('.obs-reset-btn').forEach((btn) => {
    if (btn._obsBound) return;
    btn._obsBound = true;
    btn.addEventListener('click', handleObsReset);
  });
  if (cSumRel) cSumRel.querySelectorAll('.obs-reset-btn').forEach((btn) => {
    if (btn._obsBound) return;
    btn._obsBound = true;
    btn.addEventListener('click', handleObsReset);
  });
}

function renderClosedBuyTargetHistory(obs /* stockMap unused for closed (snapshotted at exit) */) {
  const listStd = document.getElementById('standardClosedList');
  const listRel = document.getElementById('relaxClosedList');
  const sumStd = document.getElementById('standardClosedSummary');
  const sumRel = document.getElementById('relaxClosedSummary');
  // 要素がまだHTMLに追加されていない場合は何もしない（後方互換）
  if (!listStd && !listRel) return;

  function renderClosedPanel(modeKey, listEl, sumEl) {
    if (!listEl) return;
    const data = obs[modeKey] || { active: [], closed: [], counts: makeEmptyCounts() };
    const closed = Array.isArray(data.closed) ? data.closed : [];

    // 仮想資金の決済履歴（code + exitAt で照合し、各方式の実損益円を表示）
    const pfHistFixed = {};
    const pfHistUnit = {};
    const pfHistRisk = {};
    const pfVariants = getPortfolioVariants(obs, modeKey);
    for (const h of (pfVariants && pfVariants.fixed && Array.isArray(pfVariants.fixed.history) ? pfVariants.fixed.history : [])) {
      pfHistFixed[`${h.code}|${h.exitAt}`] = h;
    }
    for (const h of (pfVariants && pfVariants.unit && Array.isArray(pfVariants.unit.history) ? pfVariants.unit.history : [])) {
      pfHistUnit[`${h.code}|${h.exitAt}`] = h;
    }
    for (const h of (pfVariants && pfVariants.risk && Array.isArray(pfVariants.risk.history) ? pfVariants.risk.history : [])) {
      pfHistRisk[`${h.code}|${h.exitAt}`] = h;
    }

    // サマリー：利確/損切件数 + 履歴総数 + リセットボタン
    // 観測ベースの件数（fixed/unit合算）はツールチップに残しつつ、表示は方式別に分ける
    // （同じ到達でも資金不足で1単元だけトレード不成立になり得るため）。
    let cTp = 0, cSl = 0;
    for (const it of closed) {
      if (it.exitType === 'tp') cTp++;
      else if (it.exitType === 'sl') cSl++;
    }
    const totalClosed = closed.length;
    if (sumEl) {
      const fx = (pfVariants && pfVariants.fixed) || {};
      const un = (pfVariants && pfVariants.unit) || {};
      const rk = (pfVariants && pfVariants.risk) || {};
      const fxTp = Number(fx.tpCount) || 0;
      const fxSl = Number(fx.slCount) || 0;
      const unTp = Number(un.tpCount) || 0;
      const unSl = Number(un.slCount) || 0;
      const rkTp = Number(rk.tpCount) || 0;
      const rkSl = Number(rk.slCount) || 0;
      const closedResetHtml = isLocalDevHost()
        ? `<button type="button" class="obs-reset-btn" data-mode="${modeKey}">リセット</button>`
        : '';
      sumEl.innerHTML = `
        <span class="obs-total" title="観測ベース(全方式合算) 利確${cTp}件 / 損切${cSl}件">100万固定 利確${fxTp}/損切${fxSl} ｜ 1単元 利確${unTp}/損切${unSl} ｜ リスク均等 利確${rkTp}/損切${rkSl}（履歴${totalClosed}件）</span>
        ${closedResetHtml}
      `;
    }

    if (!closed.length) {
      if (listEl) listEl.innerHTML = '<p class="obs-empty">このモードで利確・損切到達した銘柄はまだありません。観測中の銘柄がTP/SLに達するとここに自動で記録されます。</p>';
      return;
    }

    // 最新順（すでにunshiftされているが念のため）
    const sorted = [...closed].sort((a, b) => {
      const ta = a.exitAt ? Date.parse(a.exitAt) : 0;
      const tb = b.exitAt ? Date.parse(b.exitAt) : 0;
      return tb - ta;
    });

    listEl.innerHTML = sorted.map((item) => {
      const isTp = item.exitType === 'tp';
      const exitLabel = isTp ? '利確' : '損切';
      const exitCls = isTp ? 'tp' : 'sl';
      const exitD = item.exitAt ? new Date(item.exitAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : '-';
      const hitD = item.hitAt ? new Date(item.hitAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : '-';
      const cat = getCategoryLabel(item.signal);
      const sigCls = signalClass(item.signal);

      // 参考：buy→exit の簡易リターン表示（任意）
      let ret = null;
      if (item.buy != null && item.exitPrice != null && Number(item.buy) > 0) {
        const r = ((Number(item.exitPrice) - Number(item.buy)) / Number(item.buy)) * 100;
        ret = (r >= 0 ? '+' : '') + r.toFixed(1) + '%';
      }

      return `
        <div class="obs-card obs-closed-card ${isTp ? 'closed-tp' : 'closed-sl'}" data-code="${item.code}">
          <div class="obs-card-head">
            <strong>${item.code}</strong>
            <span class="obs-name">${item.name || ''}</span>
            <span class="obs-signal ${sigCls}">${cat}</span>
            <span class="obs-exit-badge ${exitCls}">${exitLabel}</span>
          </div>
          <div class="obs-trade-row">
            <span>買い ${formatNumber(item.buy)}</span>
            <span>利確 ${formatNumber(item.tp)}</span>
            <span>損切 ${formatNumber(item.sl)}</span>
          </div>
          <div class="obs-meta-row">
            <span>到達 ${hitD} @${formatNumber(item.hitPrice, 1)}</span>
            <span class="${isTp ? 'obs-tp' : 'obs-sl'}"><b>${exitLabel} ${formatNumber(item.exitPrice, 1)}</b> @${exitD}</span>
            ${ret != null ? `<span class="obs-ret ${isTp ? 'pos' : 'neg'}">${ret}</span>` : ''}
            ${(() => {
              const key = `${item.code}|${item.exitAt}`;
              const phF = pfHistFixed[key];
              const phU = pfHistUnit[key];
              const phR = pfHistRisk[key];
              let html = '';
              if (phF) html += `<span class="obs-ret ${Number(phF.pnl) >= 0 ? 'pos' : 'neg'}" title="100万円固定の実現損益">100万 ${Number(phF.pnl) >= 0 ? '+' : ''}${formatYen(phF.pnl)}円</span>`;
              if (phU) html += `<span class="obs-ret ${Number(phU.pnl) >= 0 ? 'pos' : 'neg'}" title="1単元（100株 ${formatYen(phU.investedAmount)}円投入）の実現損益">1単元 ${Number(phU.pnl) >= 0 ? '+' : ''}${formatYen(phU.pnl)}円</span>`;
              if (phR) html += `<span class="obs-ret ${Number(phR.pnl) >= 0 ? 'pos' : 'neg'}" title="リスク均等（${formatYen(phR.investedAmount)}円投入）の実現損益">リスク均等 ${Number(phR.pnl) >= 0 ? '+' : ''}${formatYen(phR.pnl)}円</span>`;
              return html;
            })()}
            <span class="obs-mode-mini">${modeKey === 'relax' ? 'ゆるめ' : '標準'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (listStd || sumStd) renderClosedPanel('standard', listStd, sumStd);
  if (listRel || sumRel) renderClosedPanel('relax', listRel, sumRel);
}

function handleObsReset(e) {
  const btn = e.currentTarget || e.target;
  const mode = btn ? btn.dataset.mode : null;
  if (!mode) return;
  const label = mode === 'standard' ? '標準モード' : 'ゆるめモード';
  if (!confirm(`${label} の観測中銘柄・累計カウント・決済履歴・仮想資金をすべてリセットしますか？\n（新しい検証期間の開始に便利）`)) return;
  let obs = loadObservations();
  obs[mode] = { active: [], closed: [], counts: makeEmptyCounts() };
  // 観測中銘柄を消すと保有ポジションが決済不能になるため、仮想資金も一緒に初期化する
  if (!obs.portfolio || typeof obs.portfolio !== 'object') obs.portfolio = {};
  obs.portfolio[mode] = { fixed: makeEmptyPortfolioClient(), unit: makeEmptyPortfolioClient(), risk: makeEmptyPortfolioClient() };
  saveObservations(obs);
  state.buyTargetObservations = normalizeObs(obs);
  renderBuyTargetObservations();
}

function setupGlobalObsReset() {
  const btn = document.getElementById('obsResetAllBtn');
  if (!btn || btn._obsBound) return;
  if (!isLocalDevHost()) {
    btn.style.display = 'none';
    return;
  }
  btn._obsBound = true;
  btn.addEventListener('click', () => {
    if (!confirm('標準とゆるめ両方の観測統計・アクティブ銘柄・決済履歴をすべてリセットします。よろしいですか？')) return;
    const fresh = normalizeObs({});
    // 日次固定の買い目標はカウントではなく判定基準なのでリセット対象外（🎯バッジ判定にも使用）
    if (state.buyTargetObservations && typeof state.buyTargetObservations.targets === 'object') {
      fresh.targets = state.buyTargetObservations.targets;
    }
    // 仮想資金も初期化（観測中銘柄が消えると保有ポジションが決済不能になるため）
    fresh.portfolio = {
      standard: { fixed: makeEmptyPortfolioClient(), unit: makeEmptyPortfolioClient(), risk: makeEmptyPortfolioClient() },
      relax: { fixed: makeEmptyPortfolioClient(), unit: makeEmptyPortfolioClient(), risk: makeEmptyPortfolioClient() }
    };
    saveObservations(fresh);
    state.buyTargetObservations = fresh;
    renderBuyTargetObservations();
  });
}

function renderIntegratedRanking() {
  const container = document.querySelector("#integratedRankingList");
  const status = document.querySelector("#integratedRankingStatus");
  const summary = document.querySelector("#integratedRankingComparison");
  if (!container) return;

  const payload = state.integratedRanking;
  const relaxEl = document.getElementById('integratedRelaxToggle');
  const isRelax = !!(relaxEl && relaxEl.checked);
  if (relaxEl && !relaxEl._listenerAdded) {
    relaxEl.addEventListener('change', () => {
      try { localStorage.setItem('integratedRelaxMode', relaxEl.checked ? '1' : '0'); } catch {}
      renderIntegratedRanking();
    });
    relaxEl._listenerAdded = true;
    try {
      if (localStorage.getItem('integratedRelaxMode') === '1') relaxEl.checked = true;
    } catch {}
  }
  const maxItems = isRelax ? 15 : 10;
  const allStocks = Array.isArray(payload?.stocks) ? payload.stocks : [];
  // スプレッドシートと同じ select ロジックを使って順位を完全一致させる
  const stocks = selectIntegratedRankingStocks(allStocks, maxItems, false);
  const comparisons = state.integratedRankingComparisons;
  const comparisonByCode = Object.fromEntries((comparisons?.items || []).map((item) => [item.code, item]));

  // 🎯バッジは観測スペースと同じ「日次固定の買い目標」(integrated-obs.json の targets) で判定する。
  // リアルタイム再計算の buy（現在価格×(1-0.5〜3%)）を使うと、ゆるめモードでは ×1.02 で
  // 閾値が現在価格より上になり、ほぼ全銘柄が常時「到達」表示になってしまうため。
  if (!state.buyTargetObservations) state.buyTargetObservations = loadObservations();
  const fixedTargets = (state.buyTargetObservations && typeof state.buyTargetObservations.targets === 'object')
    ? state.buyTargetObservations.targets
    : null;

  if (!stocks.length) {
    container.innerHTML = '<p class="empty">統合ランキングデータがまだありません。</p>';
    if (status) status.textContent = state.integratedRankingMessage || "未取得";
    if (summary) summary.innerHTML = "";
    // 観測スペースは過去データで表示するため処理・描画を実行
    processBuyTargetObservations();
    renderBuyTargetObservations();
    setupGlobalObsReset();
    return;
  }

  if (summary && comparisons) {
    summary.innerHTML = `
      <div class="integrated-comparison-summary">
        <span>当日 ${comparisons.todayDate || "-"}</span>
        <span>前日 ${comparisons.yesterdayDate || "記録なし"}</span>
        <span>前々日 ${comparisons.dayBeforeDate || "記録なし"}</span>
        <span>新規 ${comparisons.counts.added}件</span>
        <span>↑${comparisons.counts.rankUps} / ↓${comparisons.counts.rankDowns}</span>
        <span>利確変化 ${comparisons.counts.tpChanged}件</span>
        <span>損切変化 ${comparisons.counts.slChanged}件</span>
      </div>
    `;
  } else if (summary) {
    summary.innerHTML = "";
  }

  container.innerHTML = stocks.map((stock, index) => {
    const technical = stock.technical || {};
    const changes = stock.changes || {};
    const checks = stock.checks || {};
    const actual = checks.earnings?.actual || stock.financial?.latestStatement || null;
    const comparison = comparisonByCode[String(stock.code)] || null;
    const move = comparison?.move;
    const priceNum = Number(stock.price) || 0;
    const fixedTarget = fixedTargets ? fixedTargets[String(stock.code || '').trim()] : null;
    const fixedBuy = fixedTarget ? Number(fixedTarget.buy) : NaN;
    // ゆるめのしきい値はサーバー(update-integrated-obs.js)と同じ min(buy×1.02, 基準価格×0.999)
    const fixedRef = fixedTarget ? Number(fixedTarget.price) : NaN;
    let targetThreshold = fixedBuy * (isRelax ? 1.02 : 1.0);
    if (isRelax && Number.isFinite(fixedRef) && fixedRef > 0) {
      targetThreshold = Math.min(targetThreshold, fixedRef * 0.999);
    }
    const isAtTarget = Number.isFinite(fixedBuy) && fixedBuy > 0 && priceNum > 0
      && priceNum <= targetThreshold;
    return `
      <article class="integrated-stock-card ${isAtTarget ? 'at-buy-target' : ''} ${isRelax ? 'relax-mode' : ''}">
        <div class="integrated-rank-block">
          <div class="integrated-rank">${index + 1}</div>
          ${move ? `<small class="rank-move ${move.className}" title="${move.title}">${move.label}</small>` : ""}
        </div>
        <div class="integrated-stock-main">
          <div class="integrated-stock-title">
            <strong>${stock.code || "-"}</strong>
            <span>${stock.name || "-"}</span>
            ${isAtTarget ? `<span class="buy-target-badge" title="日次固定の買い目標 ${formatNumber(fixedBuy)}${isRelax ? '×1.02(基準値×0.999上限)' : ''} に到達">🎯 目標到達</span>` : ""}
          </div>
          <div class="integrated-stock-meta">
            <span>${stock.type || "-"}</span>
            <span>${stock.theme || "テーマ横断"}</span>
            <span>${stock.quality || "品質確認中"}</span>
            <span>${stock.newsRisk || "材料確認中"}</span>
          </div>
          <div class="integrated-trade-row">
            <span>現在 ${formatNumber(stock.price, 1)}</span>
            <span>買い ${formatNumber(stock.buy)}</span>
            <span>利確 ${formatNumber(stock.tp)}${comparison?.tpChanged ? ` <em class="value-change">${comparison.tpChange}</em>` : ""}</span>
            <span>損切 ${formatNumber(stock.sl)}${comparison?.slChanged ? ` <em class="value-change">${comparison.slChange}</em>` : ""}</span>
          </div>
          ${comparison ? `
          <div class="integrated-compare-row">
            <span>前日順位 ${comparison.prevRank ?? "-"}</span>
            <span>前々日順位 ${comparison.prev2Rank ?? "-"}</span>
          </div>` : ""}
        </div>
        <div class="integrated-score-block">
          <strong>${formatNumber(stock.score)}</strong>
          <span class="integrated-signal ${signalClass(stock.signal)}">${stock.signal || "-"}</span>
        </div>
        <div class="integrated-metrics">
          <span>資金 ${formatNumber(stock.flowScore)}</span>
          <span>お宝 ${formatNumber(stock.treasureScore)}</span>
          <span>Kabu ${formatNumber(stock.kabuScore)}</span>
          <span>確認 ${formatNumber(stock.confirmationScore)}</span>
          ${stock.themeFlowBonus ? `<span>テーマ+${formatNumber(stock.themeFlowBonus)}</span>` : ""}
          ${stock.overheatPenalty ? `<span>過熱-${formatNumber(stock.overheatPenalty)}</span>` : ""}
          <span>決算 ${checks.earnings?.label || "-"}</span>
          <span>材料 ${checks.material?.label || "-"}</span>
          <span>出来高 ${checks.volume?.label || "-"}</span>
          <span>チャート ${checks.chart?.label || "-"}</span>
          ${actual ? `<span>実決算 ${actual.disclosedDate || "-"}</span>` : ""}
          ${actual ? `<span>EPS ${actual.eps != null ? Number(actual.eps).toFixed(2) : "-"}</span>` : ""}
          ${actual ? `<span>進捗 ${actual.progressBasis != null ? `${Number(actual.progressBasis).toFixed(1)}%` : "-"}</span>` : ""}
          ${actual ? `<span>期待比 ${actual.progressVsExpectedPct != null ? `${Number(actual.progressVsExpectedPct).toFixed(1)}pt` : "-"}</span>` : ""}
          <span title="予測勝率(未較正) ${formatNumber(stock.winRate)}%">勝率 ${stock.winRateCalibrated != null ? `${formatNumber(stock.winRateCalibrated)}%(実測較正)` : `${formatNumber(stock.winRate)}%`}</span>
          <span>RR ${formatNumber(stock.rr, 2)}</span>
          <span>7日 ${formatSignedPercent(changes["7d"])}</span>
          <span>30日 ${formatSignedPercent(changes["30d"])}</span>
          <span>25日乖離 ${formatSignedPercent(technical.deviation)}</span>
          <span>RSI ${formatNumber(technical.rsi, 1)}</span>
        </div>
      </article>
    `;
  }).join("");

  if (status) {
    const updated = payload.updatedAt ? formatStatusTime(payload.updatedAt) : "時刻不明";
    const totalIntegrated = Array.isArray(payload?.stocks) ? payload.stocks.filter((s) => !isIndexLinkedStock(s)).length : stocks.length;
    status.textContent = `${stocks.length}件表示 / 統合${totalIntegrated}件 / 全${payload.stocks ? payload.stocks.length : 0}件 / ${updated}`;
  }

  // 買い目標観測の処理（フルリストからヒット検知＋解決）とUI描画
  // トグル変更時やデータ更新時にも呼ばれるので、常に最新価格で利確/損切を評価
  processBuyTargetObservations();
  renderBuyTargetObservations();
  setupGlobalObsReset();
}

async function loadIntegratedRanking() {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    renderIntegratedRanking();
    return false;
  }

  try {
    const [payload, historyPayload] = await Promise.all([
      fetchIntegratedRankingPayload(),
      fetchIntegratedRankingHistoryPayload().catch(() => null)
    ]);

    // 統合銘柄ランキング用に ETF/投信/連動/REIT を除外（スプレッドシートやローカル生成と一致させるため）
    // これにより公開ページでも「ほかの取得」と同じ個別株のみが表示されるようになる
    if (payload && Array.isArray(payload.stocks)) {
      payload.stocks = payload.stocks.filter((s) => !isIndexLinkedStock(s));
    }

    state.integratedRanking = payload;
    state.integratedRankingHistory = historyPayload;
    state.integratedRankingComparisons = historyPayload
      ? buildIntegratedComparisons(payload, historyPayload)
      : null;
    state.integratedRankingMessage = "";
    renderIntegratedRanking();
    return true;
  } catch (error) {
    state.integratedRanking = null;
    state.integratedRankingHistory = null;
    state.integratedRankingComparisons = null;
    state.integratedRankingMessage = error.message;
    renderIntegratedRanking();
    return false;
  }
}

async function loadMarketData({ force = false } = {}) {
  if (typeof window === "undefined" || window.location.protocol === "file:") {
    state.dataSource = "sample";
    state.dataMessage = "ローカルHTML表示のため、API取得は未使用です。";
    return false;
  }

  try {
    document.querySelector("#updatedAt").textContent = "市場データ取得中...";
    state.marketStatus = { state: "pending", text: "取得中..." };
    renderApiStatus();
    const payload = await fetchMarketDataPayload(force);
    const applied = applyMarketDataPayload(payload);
    if (applied) {
      saveDailyCache();
      setUpdatedAt(force, marketDataSourceLabel(force));
    } else {
      setUpdatedAt(false, marketDataSourceLabel(false));
    }
    renderApiStatus();
    return applied;
  } catch (error) {
    state.dataSource = "sample";
    state.dataMessage = error.message;
    state.marketStatus = { state: "error", text: error.message };
    setUpdatedAt(false, "サンプル / API未接続");
    renderApiStatus();
    return false;
  }
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function setUpdatedAt(refreshed = false, sourceLabel = "") {
  const now = new Date();
  const label = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(now);
  const action = refreshed ? (sourceLabel ? "" : "再計算") : "";
  document.querySelector("#updatedAt").textContent = [label, action, sourceLabel].filter(Boolean).join(" / ");
}

async function init() {
  const cachedAt = loadDailyCache();
  loadRankHistory();
  renderFilters();
  bindEvents();
  renderApiStatus();
  if (cachedAt) {
    document.querySelector("#updatedAt").textContent = `${new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Tokyo"
    }).format(new Date(cachedAt))} 保存済み`;
  } else {
    setUpdatedAt();
  }
  await loadMarketData();
  await loadAiResearch();
  await loadIntegratedRanking();
  await loadPublicRankHistory();
  renderList();
}

init();
