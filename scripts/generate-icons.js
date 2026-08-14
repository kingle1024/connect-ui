/**
 * 앱/파비콘 아이콘을 벡터 정의 하나에서 전부 생성한다.
 *
 *   node scripts/generate-icons.js
 *
 * 심볼은 "같이 타는 두 사람" - 주황(#FF5A2F) 배경 위 흰 실루엣.
 * 앞사람 주위에 배경색 여백(GAP)을 둘러 뒤사람과 겹쳐 보이게 만든다.
 *
 * 아이콘을 손보려면 이 파일의 FRONT/BACK/GAP 좌표만 고치고 다시 실행하면
 * 파비콘·PWA·apple-touch·SVG가 한 번에 맞춰진다. (PNG 리샘플링이 아니라
 * 목표 크기마다 벡터를 새로 그리므로 작은 크기에서도 뭉개지지 않는다.)
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");

/** 브랜드 색 (public/manifest.json 의 theme_color 와 동일) */
const ORANGE = { r: 0xff, g: 0x5a, b: 0x2f };
const WHITE = { r: 0xff, g: 0xff, b: 0xff };

// ── 심볼 정의: 1000x1000 좌표계 ───────────────────────────────────────────
/** 두 사람이 같은 바닥선 위에 서 있게 한다 */
const BASELINE = 905;

/**
 * 사람 = 머리(원) + 어깨(원) + 몸통(둥근 사각형)의 합집합.
 * 어깨 원의 아래 절반은 몸통 사각형 안에 들어가므로 실루엣 밑단이 깔끔하다.
 */
function figure({ cx, headCy, headR, shoulderR, neckGap, cornerR }) {
  const domeCy = headCy + headR + neckGap + shoulderR;
  return {
    head: { cx, cy: headCy, r: headR },
    dome: { cx, cy: domeCy, r: shoulderR },
    base: {
      cx,
      cy: (domeCy + BASELINE) / 2,
      hw: shoulderR,
      hh: (BASELINE - domeCy) / 2,
      r: cornerR,
    },
  };
}

const FRONT = figure({
  cx: 388,
  headCy: 292,
  headR: 152,
  shoulderR: 226,
  neckGap: 28,
  cornerR: 56,
});
const BACK = figure({
  cx: 726,
  headCy: 258,
  headR: 120,
  shoulderR: 180,
  neckGap: 26,
  cornerR: 48,
});
/** 앞사람 실루엣 바깥으로 두는 배경색 여백 두께 */
const GAP = 42;
/** 위 도형들의 바운딩 박스 (가운데 정렬 계산용) */
const BBOX = {
  x0: FRONT.head.cx - FRONT.dome.r,
  y0: BACK.head.cy - BACK.head.r,
  x1: BACK.head.cx + BACK.dome.r,
  y1: BASELINE,
};

const BBOX_W = BBOX.x1 - BBOX.x0;
const BBOX_H = BBOX.y1 - BBOX.y0;
const BBOX_CX = (BBOX.x0 + BBOX.x1) / 2;
const BBOX_CY = (BBOX.y0 + BBOX.y1) / 2;
/** 캔버스 안에 심볼을 넣을 때 기준이 되는 긴 변 */
const BBOX_FIT = Math.max(BBOX_W, BBOX_H);

// ── SDF (부호 있는 거리 함수) ────────────────────────────────────────────
// 거리값을 그대로 커버리지로 바꿔 쓰기 때문에 슈퍼샘플링 없이 안티에일리어싱된다.
function sdCircle(x, y, c) {
  return Math.hypot(x - c.cx, y - c.cy) - c.r;
}

function sdRoundBox(x, y, b) {
  const qx = Math.abs(x - b.cx) - b.hw + b.r;
  const qy = Math.abs(y - b.cy) - b.hh + b.r;
  return (
    Math.min(Math.max(qx, qy), 0) +
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
    b.r
  );
}

function sdFigure(x, y, f) {
  const shape = Math.min(
    sdCircle(x, y, f.head),
    sdCircle(x, y, f.dome),
    sdRoundBox(x, y, f.base)
  );
  // 어깨 원이 바닥선 아래로 삐져나오면 밑단에 혹이 생기므로 잘라낸다.
  return Math.max(shape, y - BASELINE);
}

/** 거리 -> 픽셀 커버리지(0~1). unit 은 픽셀 하나가 차지하는 거리 단위. */
function coverage(d, unit) {
  return Math.min(1, Math.max(0, 0.5 - d / unit));
}

/** dst(프리멀티플라이드) 위에 색 src 를 알파 a 로 올린다. */
function over(dst, color, a) {
  if (a <= 0) return;
  const inv = 1 - a;
  dst.r = color.r * a + dst.r * inv;
  dst.g = color.g * a + dst.g * inv;
  dst.b = color.b * a + dst.b * inv;
  dst.a = a + dst.a * inv;
}

/** dst 를 알파 a 만큼 지운다 (destination-out). 배경이 없는 레이어의 여백용. */
function punch(dst, a) {
  if (a <= 0) return;
  const inv = 1 - a;
  dst.r *= inv;
  dst.g *= inv;
  dst.b *= inv;
  dst.a *= inv;
}

/**
 * @param size         출력 한 변 (px)
 * @param contentRatio 심볼이 차지하는 비율 (maskable 은 안전영역 때문에 작게)
 * @param cornerRatio  배경 라운드 반지름 비율. 0 이면 여백 없는 정사각(full-bleed)
 * @param transparent  배경을 그리지 않는다. 앞사람 주위 여백도 주황으로 칠하는 대신
 *                     투명하게 뚫어서, 어떤 배경/틴트 위에 올려도 두 사람이 분리돼 보인다.
 */
function render({ size, contentRatio, cornerRatio, transparent }) {
  const png = new PNG({ width: size, height: size });

  // 캔버스 픽셀 -> 심볼 좌표
  const scale = (contentRatio * size) / BBOX_FIT;
  const offsetX = size / 2 - BBOX_CX * scale;
  const offsetY = size / 2 - BBOX_CY * scale;
  const unit = 1 / scale; // 픽셀 하나 = 심볼 좌표 몇 칸인지

  const bg = cornerRatio
    ? {
        cx: size / 2,
        cy: size / 2,
        hw: size / 2,
        hh: size / 2,
        r: size * cornerRatio,
      }
    : null;

  for (let py = 0; py < size; py++) {
    const sy = (py + 0.5 - offsetY) / scale;

    for (let px = 0; px < size; px++) {
      const sx = (px + 0.5 - offsetX) / scale;

      const out = { r: 0, g: 0, b: 0, a: 0 };
      // 배경 -> 뒷사람 -> 앞사람 여백 -> 앞사람 순서로 덮어 그린다.
      const gap = coverage(sdFigure(sx, sy, FRONT) - GAP, unit);
      if (!transparent) {
        over(out, ORANGE, bg ? coverage(sdRoundBox(px + 0.5, py + 0.5, bg), 1) : 1);
      }
      over(out, WHITE, coverage(sdFigure(sx, sy, BACK), unit));
      if (transparent) punch(out, gap);
      else over(out, ORANGE, gap);
      over(out, WHITE, coverage(sdFigure(sx, sy, FRONT), unit));

      const i = (py * size + px) * 4;
      // 프리멀티플라이드 -> 스트레이트 알파
      const a = out.a;
      png.data[i] = a ? Math.round(out.r / a) : 0;
      png.data[i + 1] = a ? Math.round(out.g / a) : 0;
      png.data[i + 2] = a ? Math.round(out.b / a) : 0;
      png.data[i + 3] = Math.round(a * 255);
    }
  }

  return png;
}

/** PNG 와 같은 도형을 SVG 로도 뽑는다 (브라우저 탭에서 어떤 크기든 선명하다). */
function renderSvg({ size, contentRatio, cornerRatio }) {
  const scale = (contentRatio * size) / BBOX_FIT;
  const tx = size / 2 - BBOX_CX * scale;
  const ty = size / 2 - BBOX_CY * scale;
  const hex = (c) =>
    "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");

  const shapes = (f, attrs) =>
    [
      `<circle cx="${f.head.cx}" cy="${f.head.cy}" r="${f.head.r}" ${attrs}/>`,
      `<circle cx="${f.dome.cx}" cy="${f.dome.cy}" r="${f.dome.r}" ${attrs}/>`,
      `<rect x="${f.base.cx - f.base.hw}" y="${f.base.cy - f.base.hh}" ` +
        `width="${f.base.hw * 2}" height="${f.base.hh * 2}" rx="${f.base.r}" ${attrs}/>`,
    ].join("\n      ");

  const white = `fill="${hex(WHITE)}"`;
  // 앞사람 도형에 두께 2*GAP 의 배경색 테두리를 둘러 여백을 만든다.
  const halo =
    `fill="${hex(ORANGE)}" stroke="${hex(ORANGE)}" stroke-width="${GAP * 2}" ` +
    `stroke-linejoin="round"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="같이타">
  <title>같이타</title>
  <defs>
    <clipPath id="baseline">
      <rect x="-200" y="-200" width="1400" height="${BASELINE + 200}"/>
    </clipPath>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * cornerRatio}" fill="${hex(ORANGE)}"/>
  <g transform="translate(${+tx.toFixed(2)} ${+ty.toFixed(2)}) scale(${+scale.toFixed(5)})">
    <g clip-path="url(#baseline)">
      ${shapes(BACK, white)}
      ${shapes(FRONT, halo)}
      ${shapes(FRONT, white)}
    </g>
  </g>
</svg>
`;
}

// ── 출력 대상 ────────────────────────────────────────────────────────────
// full-bleed(cornerRatio 0) 인 것들은 OS/브라우저가 알아서 모서리를 깎는다.
// 탭 파비콘은 아무도 깎아주지 않으므로 둥근 사각형으로 직접 그린다.
const SQUIRCLE = 0.22;
const TARGETS = [
  // Expo 네이티브 아이콘 + PWA 아이콘의 원본
  { file: "assets/icon.png", size: 1024, contentRatio: 0.6, cornerRatio: 0 },
  // app.config.js web.favicon
  { file: "assets/favicon.png", size: 256, contentRatio: 0.7, cornerRatio: SQUIRCLE },
  // Android 적응형 아이콘의 전경 레이어. 런처는 캔버스의 중앙 66%(72/108dp)만 보여주므로
  // full-bleed(0.6) 과 같은 크기로 보이게 0.6 x 0.667 ≒ 0.4 로 그린다. 주황 배경은
  // app.config.js 의 adaptiveIcon.backgroundColor 가 깔아준다.
  // Android 13+ 테마 아이콘(monochromeImage)도 이 파일을 그대로 쓴다. 시스템이 알파만
  // 뽑아 단색으로 틴트하므로, 여백이 투명하게 뚫려 있어야 두 사람이 붙어 보이지 않는다.
  { file: "assets/adaptive-icon.png", size: 1024, contentRatio: 0.4, cornerRatio: 0, transparent: true },
  // public/index.html 에서 직접 참조하는 탭 아이콘
  { file: "public/icons/favicon-32.png", size: 32, contentRatio: 0.76, cornerRatio: SQUIRCLE },
  { file: "public/icons/favicon-192.png", size: 192, contentRatio: 0.72, cornerRatio: SQUIRCLE },
  // manifest.json (설치형 PWA)
  { file: "public/icons/icon-192.png", size: 192, contentRatio: 0.6, cornerRatio: 0 },
  { file: "public/icons/icon-512.png", size: 512, contentRatio: 0.6, cornerRatio: 0 },
  // 원형/스퀴클로 잘리는 런처용: 안전영역(중앙 80%) 안에 들어가야 한다
  { file: "public/icons/icon-maskable-512.png", size: 512, contentRatio: 0.46, cornerRatio: 0 },
  // iOS 홈 화면 (투명도 미지원 -> full-bleed)
  { file: "public/icons/apple-touch-icon.png", size: 180, contentRatio: 0.6, cornerRatio: 0 },
];

for (const target of TARGETS) {
  const file = path.join(ROOT, target.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(render(target)));
  console.log(`✅ ${target.file} (${target.size}x${target.size})`);
}

const svgFile = path.join(ROOT, "public/icons/icon.svg");
fs.writeFileSync(
  svgFile,
  renderSvg({ size: 1024, contentRatio: 0.7, cornerRatio: SQUIRCLE }),
  "utf8"
);
console.log("✅ public/icons/icon.svg");
