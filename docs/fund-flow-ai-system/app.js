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
  aiResearch: null,
  aiResearchMessage: "",
  marketStatus: { state: "pending", text: "確認中" },
  geminiStatus: { state: "pending", text: "確認中" },
  macroStatus: { state: "pending", text: "確認中" },
  previousRanks: {},
  publicRankHistory: null
};

const weights = {
  momentum: 0.25,
  volume: 0.20,
  fundFlow: 0.20,
  breadth: 0.15,
  news: 0.10,
  ai: 0.10,
  crowdedness: -0.10
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
  const short = calculateRaw(theme.metrics["7d"]);
  const medium = calculateRaw(theme.metrics["30d"]);
  return Math.round(short - medium + theme.metrics["7d"].volume * 0.08);
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
  return Math.round(calculateScore(theme, period) * 0.65 + m.fundFlow * 0.35);
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
      const strength = Math.round((fundAmount(fromTheme) + accelerationForPeriod(toTheme, state.period) + spreadScore(toTheme)) / 3);
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
        quality: instrument.warning ? "材料確認" : "業績良好候補",
        newsRisk: instrument.warning ? "悪材料確認" : "悪材料未検出",
        ...instrument
      });
    }
  });
  return [...byTicker.values()]
    .filter((instrument) => !instrument.warning)
    .filter((instrument) => (instrument.newsRisk || "悪材料未検出") === "悪材料未検出")
    .filter((instrument) => instrument.strength >= 60 && instrument.strength <= 78)
    .sort((a, b) => instrumentScore(b) - instrumentScore(a))
    .slice(0, 7);
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
  const top = list[0] || themes[0];
  const emerging = list.filter((theme) => theme.stage === "emerging").length;
  const crowded = list.filter((theme) => theme.stage === "crowded").length;
  const avgConfidence = list.length
    ? Math.round(list.reduce((sum, theme) => sum + theme.metrics[state.period].confidence, 0) / list.length)
    : 0;

  document.querySelector("#topTheme").textContent = top.name;
  document.querySelector("#topThemeDetail").textContent = `${top.assetClass} / 総合スコア ${calculateScore(top, state.period)}`;
  document.querySelector("#emergingCount").textContent = `${emerging}件`;
  document.querySelector("#crowdedCount").textContent = `${crowded}件`;
  document.querySelector("#avgConfidence").textContent = `${avgConfidence}%`;
}

function renderFlowMap(list) {
  const container = document.querySelector("#flowMap");
  container.innerHTML = "";
  container.style.setProperty("--map-scale", state.mapZoom);

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
    node.className = `flow-node ${theme.id === state.selectedId ? "active" : ""}`;
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
        <strong>${theme.name}</strong>
        <span class="money-marks" aria-label="資金流入推定 ${fundFlowLevel}">${moneyMarks(fundFlowLevel)}</span>
        <small>${stage.icon} ${stage.label} / 資金量 ${fundFlowLevel} / 加速度 ${periodAccel >= 0 ? "+" : ""}${periodAccel} / 広がり ${spread} / 過熱度 ${overheat}</small>
      </span>
    `;
    node.addEventListener("click", () => {
      state.selectedId = theme.id;
      renderList();
      renderDetail();
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
  document.querySelector("#flowMap")?.style.setProperty("--map-scale", state.mapZoom);
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

  container.innerHTML = sequence
    .map(([period, label, caption], index) => {
      const amount = fundAmount(theme, period);
      const accel = accelerationForPeriod(theme, period);
      const stage = lifecycleStageForPeriod(theme, period);
      const prevAmount = index > 0 ? fundAmount(theme, sequence[index - 1][0]) : amount;
      const delta = amount - prevAmount;
      const trendClass = delta >= 0 ? "trend-up" : "trend-down";
      const trend = index === 0 ? "基準" : `${delta >= 0 ? "+" : ""}${delta}`;
      return `
        <article class="period-card ${period === state.period ? "active" : ""}">
          <header>
            <span>
              <strong>${label}</strong>
              <small>${caption}</small>
            </span>
            <span class="${trendClass}">${trend}</span>
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

function renderCharacters() {
  const container = document.querySelector("#aiCharacters");
  const candidates = geminiResearchCandidates();

  if (!candidates.length) {
    container.innerHTML = `
      <div class="character-card">
        <span class="character-icon">💎</span>
        <span>
          <strong>Gemini：調査待ち</strong>
          <span>GitHub ActionsでGemini調査が実行されると、ここに注目テーマと次に確認するテーマが表示されます。</span>
        </span>
      </div>
    `;
    return;
  }

  const current = candidates[0];
  const next = candidates.find((candidate) => candidate.id !== current.id);
  const currentTheme = themeById(current.id);
  const nextTheme = next ? themeById(next.id) : null;
  const evidence = Array.isArray(current.evidence) ? current.evidence.slice(0, 2).join(" / ") : "";
  container.innerHTML = `
    <div class="character-card">
      <span class="character-icon">💎</span>
      <span>
        <strong>Gemini：価格・出来高・ニュース・金利・為替の総合調査</strong>
        <span>注目 ${themeIcons[current.id]} ${current.name || currentTheme.name}。${nextTheme ? `次に確認 ${themeIcons[next.id]} ${next.name || nextTheme.name}。` : ""}${current.reason || ""}</span>
        ${evidence ? `<span class="candidate-evidence">${evidence}</span>` : ""}
      </span>
    </div>
  `;
}

function renderMarketStory(list) {
  const sorted = list.length ? list : themes;
  const mature = sorted.find((theme) => lifecycleStage(theme).label === "成熟期") || sorted[0];
  const growth = sorted.find((theme) => lifecycleStage(theme).label === "成長期") || sorted[1] || sorted[0];
  const seed = sorted.find((theme) => lifecycleStage(theme).label === "発芽期") || sorted[2] || sorted[0];
  document.querySelector("#marketStory").textContent =
    `${themeIcons[mature.id]} ${mature.name}にはまだ資金が残っていますが、過熱度や加速度の変化から追いかけ買いには注意が必要です。` +
    ` 一方で、${themeIcons[growth.id]} ${growth.name}は資金量が中程度で加速度が強く、銘柄調査を始めやすい段階です。` +
    ` 次の派生先として、${themeIcons[seed.id]} ${seed.name}のような周辺テーマへ資金が広がるかを確認します。`;
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
      const evidence = Array.isArray(candidate.evidence) ? candidate.evidence.slice(0, 3) : [];
      return `
        <button class="candidate-card ai-picked gemini-picked" type="button" data-id="${candidate.id}">
          <span>
            <strong>${themeIcons[candidate.id] || "●"} ${candidate.name || theme.name}</strong>
            <span>${candidate.reason || "Geminiが価格・出来高、ニュース、金利・為替材料から確認候補にしました。"}</span>
            <span class="candidate-evidence">${evidence.join(" / ")}</span>
            <span class="candidate-next">次に確認: ${candidate.nextCheck || "関連銘柄とニュースの継続確認"}</span>
            <span class="candidate-risk">注意: ${candidate.risk || "過熱度と材料の変化を確認"}</span>
          </span>
          <span class="candidate-decision">${candidate.decision || "Gemini確認"} ${candidate.score != null ? `Geminiスコア ${candidate.score}` : ""}</span>
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

  container.innerHTML = displayCandidates.length
    ? displayCandidates
      .map(({ theme, stage, researchScore, reason }) => `
        <button class="candidate-card ai-picked" type="button" data-id="${theme.id}">
          <span>
            <strong>${themeIcons[theme.id]} ${theme.name}</strong>
            <span>${reason}</span>
          </span>
          <span class="candidate-decision">Gemini候補 ${researchScore}</span>
        </button>
      `)
      .join("")
    : '<p class="empty">Geminiが調べられるテーマがありません。フィルター条件を戻してください。</p>';

  const status = document.querySelector("#aiResearchStatus");
  if (status) {
    status.textContent = `${periodLabel()}の監視テーマ${source.length}件をGemini候補として整理しました。Gemini API実行後はニュース・金利・為替を含む調査結果に更新されます。`;
  }

  container.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      renderList();
      renderDetail();
    });
  });
}

function renderList() {
  const list = filteredThemes();
  const container = document.querySelector("#themeList");
  container.innerHTML = "";

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

  if (!list.some((theme) => theme.id === state.selectedId)) {
    state.selectedId = list[0].id;
  }

  list.forEach((theme, index) => {
    const m = theme.metrics[state.period];
    const score = calculateScore(theme, state.period);
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
        <span class="theme-title">${theme.name}</span>
        <span class="theme-meta">
          <span class="pill">${theme.assetClass}</span>
          <span class="pill">${theme.region}</span>
          <span class="stage ${theme.stage}">${labels[theme.stage]}</span>
          <span>加速度 ${accelerationForPeriod(theme, state.period)}</span>
          <span>信頼度 ${m.confidence}%</span>
        </span>
      </span>
      <span class="score"><strong>${score}</strong><span>総合スコア</span></span>
    `;
    card.addEventListener("click", () => {
      state.selectedId = theme.id;
      renderList();
      renderDetail();
    });
    container.appendChild(card);
  });

  saveRankSnapshot(list);
  renderDetail();
}

function renderDetail() {
  const theme = themes.find((item) => item.id === state.selectedId) || filteredThemes()[0] || themes[0];
  const m = theme.metrics[state.period];
  const score = calculateScore(theme, state.period);
  const stage = lifecycleStage(theme);
  const actionStage = actionStageForTheme(theme);

  document.querySelector("#detailClass").textContent = `${theme.assetClass} / ${theme.region}`;
  document.querySelector("#detailName").textContent = `${themeIcons[theme.id]} ${theme.name}`;
  document.querySelector("#detailStage").textContent = `${stage.icon} ${stage.label}`;
  document.querySelector("#detailStage").className = `stage ${theme.stage}`;
  document.querySelector("#detailScore").textContent = m.fundFlow;
  document.querySelector("#detailAcceleration").textContent = accelerationForPeriod(theme, state.period);
  document.querySelector("#detailBreadth").textContent = `${spreadScore(theme)}`;
  document.querySelector("#detailCrowdedness").textContent = `${m.crowdedness}%`;
  document.querySelector("#crowdedBar").style.width = `${m.crowdedness}%`;
  renderScoreChart(theme);
  renderPeriodMetricChart(theme);
  renderPeriodFlow(theme);

  document.querySelector("#aiSummary").innerHTML = buildAiSummary(theme, score);
  const treasureInstruments = relatedInstruments(theme);
  document.querySelector("#instrumentList").innerHTML = treasureInstruments.length
    ? treasureInstruments.map((instrument) => `
      <div class="instrument">
        <span class="ticker">${instrument.ticker}</span>
        <span>
          ${instrument.name}
          <small>${instrument.type} / お宝度 ${instrumentScore(instrument)} / ${instrument.quality || "業績良好候補"} / ${instrument.newsRisk || "悪材料未検出"}</small>
        </span>
      </div>
    `)
      .join("")
    : '<p class="empty">上がりすぎ・悪材料・値動き注意を除外すると、今すぐ表示できるお宝候補はありません。</p>';

  document.querySelector("#dataPoints").innerHTML = `
    <dt>判断</dt><dd><span class="action-stage ${actionStage.className}">${actionStage.label}</span></dd>
    <dt>理由</dt><dd>${actionStage.reason}</dd>
    <dt>総合スコア</dt><dd>${score}</dd>
    <dt>価格モメンタム</dt><dd>${m.momentum}%</dd>
    <dt>出来高増加</dt><dd>${m.volume}%</dd>
    <dt>資金流入推定</dt><dd>${m.fundFlow}%</dd>
    <dt>ニュース増加</dt><dd>${m.news}%</dd>
    <dt>AI妥当性</dt><dd>${m.ai}%</dd>
    <dt>信頼度</dt><dd>${m.confidence}%</dd>
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

  document.querySelector("#refreshButton").addEventListener("click", async () => {
    const loaded = await loadMarketData({ force: true });
    await loadPublicRankHistory({ force: true });
    if (!loaded) {
      simulateDailyRefresh();
    }
    renderList();
  });

  document.querySelector("#runAiResearch").addEventListener("click", async () => {
    document.querySelector("#aiResearchStatus").textContent = "公開済みのGemini調査データを再読み込みしています...";
    await loadAiResearch({ force: true });
    renderResearchCandidates(filteredThemes());
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
    const cacheBust = force ? `?t=${Date.now()}` : "";
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
      }
    });
    return payload.savedAt;
  } catch {
    return null;
  }
}

function applyMarketDataPayload(payload) {
  state.macroSignals = payload?.macro || null;
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

function marketDataSourceLabel(refreshed = false) {
  const sourceNames = {
    "jquants-v2": "実データ: J-Quants V2",
    "jquants-v1": "実データ: J-Quants V1",
    "github-pages": "実データ: GitHub更新",
    jquants: "実データ: J-Quants",
    api: "実データ: API",
    sample: "サンプル"
  };
  const source = sourceNames[state.dataSource] || state.dataSource || "サンプル";
  return refreshed ? `${source} / 再取得` : source;
}

async function fetchMarketDataPayload(force) {
  const cacheBust = force ? `?t=${Date.now()}` : "";
  const suffix = force ? "?refresh=1" : "";
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const endpoints = isGitHubPages
    ? [`data/market-data.json${cacheBust}`, `api/market-data${suffix}`, `/api/market-data${suffix}`]
    : [`api/market-data${suffix}`, `/api/market-data${suffix}`, `data/market-data.json${cacheBust}`];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${endpoint}`);
      const payload = await response.json();
      if (endpoint.includes("data/market-data.json") && payload.source?.startsWith("jquants")) {
        payload.source = "github-pages";
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("市場データを取得できませんでした。");
}

async function fetchAiResearchPayload(force) {
  const cacheBust = force ? `?t=${Date.now()}` : "";
  const endpoints = [`data/ai-research.json${cacheBust}`];
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
  await loadPublicRankHistory();
  renderList();
}

init();
