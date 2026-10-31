# 옷 이미지

이 폴더에 옷 PNG를 넣고 `npm run gen:images`를 실행하면 앱과 위젯에 바로 반영돼요.
등록되지 않은 옷은 자리표시자(옷걸이 + 카테고리 약자)로 보여요.

## 지금 들어 있는 이미지 = 초안

지금 들어 있는 26장은 임시 초안이에요(먹색 선 일러스트, 2026-10-31).
`scripts/cloth-drafts/draw_drafts.py`가 그렸고, 직접 수정한 PNG로 **같은 파일명으로 덮어쓰면** 돼요.
교체한 뒤에는 `npm run gen:images`를 다시 실행해 주세요(파일명이 그대로면 생략해도 돼요).

> 초안은 선이 먹색(#16181D)이라 다크 모드의 어두운 타일 위에서는 잘 안 보여요.
> 직접 넣는 이미지는 다크 모드에서도 보이는 색인지 확인해 주세요.

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
