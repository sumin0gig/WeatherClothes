# 옷 이미지

이 폴더에 옷 PNG를 넣고 `npm run gen:images`를 실행하면 앱과 위젯에 바로 반영돼요.
등록되지 않은 옷은 자리표시자(옷걸이 + 카테고리 약자)로 보여요.

## 파일 이름

`카테고리_이름_재질_번호.png` — `src/outfit/catalog.ts`의 `id`와 똑같아야 해요.

예) `bottom_jeans_denim_01.png`, `top_shirt_linen_01.png`

현재 카탈로그 전체 목록은 `npm run gen:images -- --verbose`로 볼 수 있어요.

## 권장 규격

- 정사각형
- 배경 투명
- 512×512px 이하 (위젯은 이미지 메모리 제한이 있어요)

## 새 옷 추가하기

1. `src/outfit/catalog.ts`에 항목을 추가해요 (`bands`, `material` 포함).
2. 같은 `id`로 PNG를 이 폴더에 넣어요.
3. `npm run gen:images`
4. 앱을 다시 빌드해요 (이미지는 번들에 포함돼요).
