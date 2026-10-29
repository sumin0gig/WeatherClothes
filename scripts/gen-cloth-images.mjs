#!/usr/bin/env node
/**
 * assets/clothes/*.png 를 읽어 src/outfit/images.ts 의 매핑을 다시 만든다.
 *   npm run gen:images
 *
 * - 파일명(확장자 제외)이 카탈로그 id와 같아야 한다: 카테고리_이름_재질_번호.png
 * - 카탈로그에 없는 파일은 경고만 하고 건너뛴다.
 * - 이미지가 없는 카탈로그 항목은 앱/위젯에서 자리표시자로 보인다.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets/clothes');
const catalogPath = join(root, 'src/outfit/catalog.ts');
const imagesPath = join(root, 'src/outfit/images.ts');

const START = '// @generated-start';
const END = '// @generated-end';

const catalogIds = [
  ...readFileSync(catalogPath, 'utf8').matchAll(/id:\s*'([a-z0-9_]+)'/g),
].map(m => m[1]);
const files = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter(f => f.toLowerCase().endsWith('.png'))
  : [];

const matched = [];
for (const file of files.sort()) {
  const id = file.replace(/\.png$/i, '');
  if (!catalogIds.includes(id)) {
    console.warn(
      `⚠ 카탈로그에 없는 파일: ${file} (src/outfit/catalog.ts 의 id와 같은 이름인지 확인)`,
    );
    continue;
  }
  if (file !== `${id}.png`) {
    console.warn(`⚠ 확장자는 소문자 .png 여야 해요: ${file}`);
    continue;
  }
  matched.push(id);
}

const lines = matched.map(
  id => `  ${id}: require('../../assets/clothes/${id}.png'),`,
);
const body = [
  `${START} (scripts/gen-cloth-images.mjs 가 이 사이를 다시 쓴다)`,
  'export const CLOTH_IMAGES: Partial<Record<string, ImageRequireSource>> = {',
  ...(lines.length
    ? lines
    : [
        "  // bottom_jeans_denim_01: require('../../assets/clothes/bottom_jeans_denim_01.png'),",
      ]),
  '};',
  END,
].join('\n');

const source = readFileSync(imagesPath, 'utf8');
const start = source.indexOf(START);
const end = source.indexOf(END);
if (start < 0 || end < 0) {
  console.error(`✖ ${imagesPath} 에서 ${START} / ${END} 표시를 찾지 못했어요.`);
  process.exit(1);
}
writeFileSync(
  imagesPath,
  source.slice(0, start) + body + source.slice(end + END.length),
);

const missing = catalogIds.filter(id => !matched.includes(id));
console.log(
  `✔ 이미지 ${matched.length}개 등록, 자리표시자 ${missing.length}개`,
);
if (missing.length && process.argv.includes('--verbose')) {
  for (const id of missing) console.log(`  - ${id}.png`);
}
