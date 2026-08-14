/**
 * PWA(홈 화면에 추가)용 아이콘을 assets/icon.png 에서 생성한다.
 *
 * 앱 아이콘(assets/icon.png)을 교체한 뒤 아래 명령으로 다시 생성한다.
 *   node scripts/generate-pwa-icons.js
 *
 * ⚠️ 지금 쓰는 아이콘은 scripts/generate-icons.js 가 벡터에서 직접 그린다.
 *    이 스크립트를 다시 돌리면 public/icons/* 가 PNG 리샘플링 결과로 덮인다
 *    (maskable 은 흰 테두리가 생긴다). 직접 그린 PNG 를 소스로 쓸 때만 사용.
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "assets", "icon.png");
const OUT_DIR = path.join(ROOT, "public", "icons");

/** maskable 아이콘의 안전 영역(중앙 80%) 밖은 잘려나갈 수 있어 여백을 준다. */
const MASKABLE_CONTENT_RATIO = 0.8;
/** 투명 배경을 합성할 색 (app.config.js 의 splash/adaptiveIcon backgroundColor 와 동일) */
const BACKGROUND = { r: 255, g: 255, b: 255 };

/** 박스 필터(면적 평균)로 축소한 RGBA 버퍼를 만든다. */
function resize(src, size) {
  const out = Buffer.alloc(size * size * 4);
  const scale = src.width / size;

  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * scale));

    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * scale));

      // RGB는 알파 가중 평균을 내야 반투명 경계에서 색이 번지지 않는다.
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * src.width + sx) * 4;
          const alpha = src.data[i + 3];
          r += src.data[i] * alpha;
          g += src.data[i + 1] * alpha;
          b += src.data[i + 2] * alpha;
          a += alpha;
          count++;
        }
      }

      const o = (y * size + x) * 4;
      if (a === 0) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round(a / count);
      }
    }
  }

  return { data: out, size };
}

/** 캔버스(불투명 배경) 중앙에 축소한 아이콘을 올린다. */
function compose(src, size, contentRatio) {
  const content = Math.round(size * contentRatio);
  const scaled = resize(src, content);
  const offset = Math.floor((size - content) / 2);

  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    png.data[o] = BACKGROUND.r;
    png.data[o + 1] = BACKGROUND.g;
    png.data[o + 2] = BACKGROUND.b;
    png.data[o + 3] = 255;
  }

  for (let y = 0; y < content; y++) {
    for (let x = 0; x < content; x++) {
      const s = (y * content + x) * 4;
      const alpha = scaled.data[s + 3] / 255;
      if (alpha === 0) continue;

      const d = ((y + offset) * size + (x + offset)) * 4;
      for (let c = 0; c < 3; c++) {
        png.data[d + c] = Math.round(
          scaled.data[s + c] * alpha + png.data[d + c] * (1 - alpha)
        );
      }
    }
  }

  return png;
}

function write(png, filename) {
  const file = path.join(OUT_DIR, filename);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`✅ ${path.relative(ROOT, file)} (${png.width}x${png.height})`);
}

const source = PNG.sync.read(fs.readFileSync(SOURCE));
if (source.width !== source.height) {
  console.warn(`⚠️  ${path.relative(ROOT, SOURCE)} 가 정사각형이 아닙니다 (${source.width}x${source.height}).`);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// Android/Chrome 설치 조건: 192px, 512px 아이콘
write(compose(source, 192, 1), "icon-192.png");
write(compose(source, 512, 1), "icon-512.png");
// 원형/스퀴클로 잘리는 런처용
write(compose(source, 512, MASKABLE_CONTENT_RATIO), "icon-maskable-512.png");
// iOS 홈 화면 아이콘 (투명도를 지원하지 않아 배경을 합성해둔다)
write(compose(source, 180, 1), "apple-touch-icon.png");
