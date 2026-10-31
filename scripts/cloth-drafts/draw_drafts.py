"""옷벤토리 옷 이미지 초안 생성기 — 먹색 선 일러스트, 512x512 투명 PNG.

  python3 scripts/cloth-drafts/draw_drafts.py            # 26장 전부 다시 그림
  python3 scripts/cloth-drafts/draw_drafts.py top_knit_wool_01   # 일부만

assets/clothes/<id>.png 를 덮어쓴다. 사용자가 직접 수정한 PNG가 있으면 덮어쓰지 않도록
id를 지정해서 실행할 것. rsvg-convert(librsvg) 필요.
"""
import os, subprocess, sys, tempfile

INK = "#16181D"
CX = 256
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "clothes"))

W_MAIN = 16    # 외곽선
W_DET = 10     # 디테일 선
W_STITCH = 6   # 박음질 점선


def mirror(pts):
    return [(2 * CX - x, y) for x, y in pts]


def P(*pts):
    """점 목록 → 'M x y L ...' (열린 경로)"""
    s = f"M {pts[0][0]} {pts[0][1]}"
    for x, y in pts[1:]:
        s += f" L {x} {y}"
    return s


def main(d, extra=""):
    return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{W_MAIN}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'


def det(d, w=W_DET):
    return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'


def stitch(d):
    return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{W_STITCH}" stroke-linecap="round" stroke-dasharray="2 16"/>'


def dot(x, y, r=9, filled=True):
    if filled:
        return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{INK}"/>'
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{INK}" stroke-width="{W_DET}"/>'


def body(left, neck=None):
    """왼쪽 외곽 점들(목→밑단 순서)을 받아 좌우 대칭 실루엣.
    neck: ('round', depth) | ('v', depth) | None(직선)"""
    right = mirror(left)[::-1]
    pts = left + right
    d = f"M {pts[0][0]} {pts[0][1]}"
    # 왼쪽 목 → 왼쪽 밑단 → 오른쪽 밑단 → 오른쪽 목
    for x, y in pts[1:]:
        d += f" L {x} {y}"
    lx, ly = left[0]
    rx, ry = right[-1]
    if neck is None:
        d += " Z"
    elif neck[0] == "round":
        d += f" Q {CX} {ly + neck[1] * 2} {lx} {ly} Z"
    elif neck[0] == "v":
        d += f" L {CX} {ly + neck[1]} Z"
    return d


def hsym(path_fn):
    """왼쪽용 path 문자열 생성 함수 → 좌/우 두 개"""
    return path_fn(lambda x: x) + path_fn(lambda x: 2 * CX - x)


# ───────────────────────── 상의 ─────────────────────────

def top_tshirt():
    L = [(212, 104), (148, 124), (78, 196), (118, 244), (160, 212), (162, 424)]
    s = main(body(L, ("round", 22)))
    s += stitch(f"M 170 400 L 342 400")
    s += hsym(lambda m: stitch(f"M {m(92)} {212} L {m(128)} {250-14}"))
    s += det(f"M 216 112 Q 256 150 296 112", 8)
    return s


def top_sleeveless():
    s = ""
    d = (f"M 204 92 Q 196 170 152 196 L 160 428 L 352 428 L 360 196 "
         f"Q 316 170 308 92 Q 256 196 204 92 Z")
    s += main(d)
    s += stitch("M 170 404 L 342 404")
    s += det("M 210 104 Q 256 176 302 104", 8)
    return s


def longsleeve(top=104, nw=44, sw=110, hem=428, cuff=416, slim=0):
    """긴팔 공통 실루엣. 반환 (svg, 왼쪽 점들)"""
    L = [(CX - nw, top), (CX - sw + slim, top + 20), (CX - sw - 56 + slim * 2, cuff),
         (CX - sw - 10 + slim * 2, cuff + 6), (CX - sw + 12 + slim, top + 120), (CX - sw + 14 + slim, hem)]
    return L


def top_longsleeve():
    L = longsleeve()
    s = main(body(L, ("round", 22)))
    s += stitch("M 168 404 L 344 404")
    s += hsym(lambda m: stitch(f"M {m(92)} 394 L {m(138)} 398"))
    s += det("M 216 112 Q 256 150 296 112", 8)
    return s


def rib_band(x1, x2, y1, y2, n):
    s = det(f"M {x1} {y1} L {x2} {y1}", 8)
    step = (x2 - x1) / n
    for i in range(1, n):
        x = x1 + step * i
        s += det(f"M {x:.1f} {y1 + 8} L {x:.1f} {y2 - 8}", 5)
    return s


def top_sweatshirt():
    L = [(206, 104), (140, 126), (82, 388), (136, 400), (160, 228), (160, 430)]
    s = main(body(L, ("round", 24)))
    s += rib_band(162, 350, 392, 430, 10)
    s += det("M 210 116 Q 256 160 302 116", 8)
    # 소매 시보리
    s += hsym(lambda m: det(f"M {m(86)} 362 L {m(140)} 372", 8))
    # 라글란 박음질
    s += hsym(lambda m: stitch(f"M {m(214)} 124 L {m(162)} 226"))
    return s


def top_knit():
    L = [(206, 104), (140, 126), (82, 388), (136, 400), (160, 228), (160, 430)]
    s = main(body(L, ("round", 24)))
    s += rib_band(162, 350, 392, 430, 10)
    s += det("M 210 116 Q 256 160 302 116", 8)
    s += hsym(lambda m: det(f"M {m(86)} 362 L {m(140)} 372", 8))
    # 꽈배기 무늬
    for ox in (-56, 0, 56):
        x = CX + ox
        d = f"M {x} 168"
        y = 168
        while y < 372:
            d += f" Q {x + 18} {y + 13} {x} {y + 26} Q {x - 18} {y + 39} {x} {y + 52}"
            y += 52
        s += det(d, 6)
    return s


def top_shirt():
    L = [(220, 100), (146, 122), (86, 400), (134, 410), (162, 226), (164, 438)]
    s = main(body(L, None))
    # 칼라
    s += det("M 220 100 L 206 150 L 252 168 L 256 118", 9)
    s += det("M 292 100 L 306 150 L 260 168 L 256 118", 9)
    # 플라켓 + 단추
    s += stitch("M 256 172 L 256 432")
    for y in (200, 256, 312, 368):
        s += dot(272, y, 7)
    # 가슴 주머니
    s += det("M 300 200 L 340 200 L 340 244 L 320 252 L 300 244 Z", 7)
    s += hsym(lambda m: stitch(f"M {m(94)} 380 L {m(136)} 386"))
    return s


# ───────────────────────── 아우터 ─────────────────────────

def coat_shape(top=96, hem=460, sw=118, nw=40, hw=128):
    return [(CX - nw, top), (CX - sw, top + 22), (CX - sw - 58, 400), (CX - sw - 8, 410),
            (CX - sw + 10, top + 130), (CX - hw, hem)]


def outer_padding():
    s = ""
    # 후드
    s += main("M 206 116 Q 196 40 256 36 Q 316 40 306 116")
    L = [(206, 112), (128, 134), (70, 404), (126, 414), (148, 236), (140, 470)]
    s += main(body(L, ("round", 10)))
    # 지퍼
    s += det("M 256 124 L 256 470", 8)
    # 퀼팅 라인
    for y in (184, 244, 304, 364, 424):
        s += hsym(lambda m, y=y: det(f"M {m(146 if y > 230 else 152)} {y} L {m(244)} {y}", 6))
    # 소매 퀼팅
    for (x1, y1, x2, y2) in ((92, 230, 138, 238), (82, 310, 132, 318)):
        s += hsym(lambda m, a=(x1, y1, x2, y2): det(f"M {m(a[0])} {a[1]} L {m(a[2])} {a[3]}", 6))
    return s


def lapels(top=100, depth=230, width=56, notch=True, w=9):
    def side(m):
        if notch:
            d = (f"M {m(CX - 40)} {top} L {m(CX - 40 - 18)} {top + 50} L {m(CX - 40 - width)} {top + 66} "
                 f"L {m(CX - 30)} {depth} ")
        else:
            d = f"M {m(CX - 40)} {top} L {m(CX - 40 - width)} {top + 70} L {m(CX - 4)} {depth}"
        return det(d, w)
    return side(lambda x: x) + side(lambda x: 2 * CX - x)


def outer_coat():
    L = coat_shape()
    s = main(body(L, ("v", 150)))
    s += lapels(100, 250, 60)
    s += det("M 256 250 L 256 460", 8)
    for y in (290, 360):
        s += dot(226, y) + dot(286, y)
    s += hsym(lambda m: det(f"M {m(160)} 330 L {m(196)} 322", 8))
    s += hsym(lambda m: stitch(f"M {m(80)} 380 L {m(126)} 388"))
    return s


def outer_leather():
    L = [(214, 104), (140, 124), (84, 380), (136, 392), (156, 230), (156, 380)]
    s = main(body(L, ("v", 40)))
    # 넓은 라펠 (비대칭)
    s += det("M 214 104 L 178 170 L 206 196 L 236 300", 9)
    s += det("M 298 104 L 334 170 L 306 196 L 276 230", 9)
    # 사선 지퍼
    s += det("M 298 112 L 236 300 L 236 380", 8)
    s += stitch("M 308 130 L 250 300")
    # 지퍼 포켓
    s += det("M 176 276 L 214 250", 8) + det("M 300 330 L 340 304", 8)
    # 허리 벨트
    s += det("M 158 350 L 354 350", 8)
    s += f'<rect x="324" y="340" width="20" height="20" fill="none" stroke="{INK}" stroke-width="6"/>'
    return s


def outer_trench():
    L = coat_shape(hem=462, hw=134)
    s = main(body(L, ("v", 150)))
    s += lapels(100, 250, 60)
    s += det("M 256 250 L 256 462", 8)
    # 더블 단추
    for y in (230, 270):
        s += dot(226, y, 7) + dot(286, y, 7)
    # 벨트
    s += det("M 140 312 L 372 312 M 140 340 L 372 340", 8)
    s += f'<rect x="240" y="306" width="32" height="40" fill="none" stroke="{INK}" stroke-width="7"/>'
    s += det("M 300 340 Q 320 380 306 410", 8)
    # 견장
    s += hsym(lambda m: det(f"M {m(150)} 132 L {m(196)} 116", 8))
    s += hsym(lambda m: stitch(f"M {m(80)} 374 L {m(126)} 382"))
    return s


def outer_field():
    L = [(214, 100), (138, 122), (80, 396), (134, 406), (152, 236), (146, 432)]
    s = main(body(L, None))
    # 스탠드 칼라
    s += det("M 214 100 L 214 74 Q 256 66 298 74 L 298 100", 9)
    s += det("M 256 74 L 256 432", 8)
    s += stitch("M 268 82 L 268 432")
    # 포켓 4개
    for (x, y, w, h) in ((176, 176, 54, 56), (282, 176, 54, 56), (166, 316, 64, 72), (282, 316, 64, 72)):
        s += det(f"M {x} {y} L {x + w} {y} L {x + w} {y + h} L {x} {y + h} Z", 7)
        s += det(f"M {x - 4} {y} L {x + w + 4} {y} L {x + w + 4} {y + 18} L {x - 4} {y + 18} Z", 6)
    # 허리 스트링
    s += stitch("M 152 290 L 360 290")
    return s


def outer_blazer():
    L = coat_shape(hem=420, hw=124)
    s = main(body(L, ("v", 170)))
    s += lapels(100, 270, 56)
    s += det("M 256 270 L 256 420", 8)
    s += dot(268, 300) + dot(268, 350)
    s += hsym(lambda m: det(f"M {m(156)} 360 L {m(206)} 360", 8))
    s += det("M 300 196 L 336 192", 8)
    return s


def outer_cardigan():
    L = [(220, 100), (148, 120), (90, 390), (140, 400), (164, 226), (164, 430)]
    s = main(body(L, ("v", 170)))
    s += rib_band(166, 346, 396, 430, 9)
    # 앞판 여밈 라인
    s += det("M 220 100 L 248 270 L 248 430", 8)
    s += det("M 292 100 L 264 270", 8)
    for y in (296, 336, 376):
        s += dot(264, y, 8, filled=False)
    s += hsym(lambda m: det(f"M {m(94)} 366 L {m(142)} 374", 7))
    return s


# ───────────────────────── 하의 ─────────────────────────

def pants(top=80, wl=104, crotch=200, hem=460, ho=124, hi=26, wb=26):
    """ho: 밑단 바깥 x거리, hi: 밑단 안쪽 x거리(중심 기준)"""
    d = (f"M {CX - wl} {top} L {CX + wl} {top} L {CX + ho} {hem} L {CX + hi} {hem} "
         f"L {CX} {crotch} L {CX - hi} {hem} L {CX - ho} {hem} Z")
    s = main(d)
    s += det(f"M {CX - wl + 1} {top + wb} L {CX + wl - 1} {top + wb}", 8)
    return s


def bottom_jeans():
    s = pants()
    # 앞주머니
    s += hsym(lambda m: det(f"M {m(158)} 106 Q {m(196)} 110 {m(200)} 146", 7))
    # 지퍼 J스티치
    s += stitch("M 270 108 L 270 170 Q 270 186 256 190")
    # 벨트고리
    for x in (176, 236, 336):
        s += det(f"M {x} 74 L {x} 112", 7)
    s += dot(256, 93, 7)
    # 밑단 박음질
    s += hsym(lambda m: stitch(f"M {m(138)} 440 L {m(222)} 440"))
    return s


def bottom_slacks():
    s = pants(ho=118, hi=30)
    s += hsym(lambda m: det(f"M {m(170)} 106 L {m(190)} 160", 7))
    s += hsym(lambda m: stitch(f"M {m(200)} 120 L {m(186)} 440"))
    s += det("M 256 106 L 256 180", 7)
    s += dot(256, 93, 7)
    return s


def bottom_chino():
    s = pants(hem=430)
    s += hsym(lambda m: det(f"M {m(162)} 106 L {m(186)} 156", 7))
    s += stitch("M 268 108 L 268 176")
    s += dot(256, 93, 7)
    # 롤업 커프
    s += hsym(lambda m: det(f"M {m(132)} 430 L {m(130)} 460 L {m(230)} 460 L {m(228)} 430", 9))
    return s


def bottom_shorts():
    s = pants(top=130, crotch=260, hem=360, ho=140, hi=18)
    s += hsym(lambda m: det(f"M {m(166)} 156 Q {m(198)} 160 {m(202)} 194", 7))
    s += stitch("M 268 158 L 268 220")
    s += dot(256, 143, 7)
    s += hsym(lambda m: stitch(f"M {m(126)} 340 L {m(232)} 340"))
    return s


def bottom_fleece():
    d = ("M 152 80 L 360 80 L 380 410 L 290 410 L 256 200 L 222 410 L 132 410 Z")
    s = main(d)
    s += det("M 153 112 L 359 112", 8)
    # 허리 끈
    s += det("M 244 112 Q 236 150 224 164 M 268 112 Q 276 150 288 164", 7)
    # 밑단 시보리
    s += main("M 140 410 L 146 456 L 222 456 L 222 410")
    s += main("M 372 410 L 366 456 L 290 456 L 290 410")
    s += hsym(lambda m: rib_v(m, 150, 216, 418, 450))
    # 기모 느낌 점
    for (x, y) in ((190, 200), (210, 280), (178, 340), (322, 200), (302, 280), (334, 340)):
        s += dot(x, y, 4)
    return s


def rib_v(m, x1, x2, y1, y2, n=5):
    s = ""
    step = (x2 - x1) / n
    for i in range(1, n):
        x = x1 + step * i
        s += det(f"M {m(x):.1f} {y1} L {m(x):.1f} {y2}", 5)
    return s


def bottom_leggings():
    d = ("M 162 80 L 350 80 L 330 300 L 312 460 L 270 460 L 256 196 L 242 460 L 200 460 L 182 300 Z")
    s = main(d)
    s += det("M 163 128 L 349 128", 8)
    s += hsym(lambda m: stitch(f"M {m(208)} 160 L {m(224)} 440"))
    return s


# ───────────────────────── 원피스 / 이너 / 레그웨어 ─────────────────────────

def onepiece_dress():
    d = ("M 214 72 Q 204 130 176 150 L 186 236 L 108 452 L 404 452 L 326 236 L 336 150 "
         "Q 308 130 298 72 Q 256 130 214 72 Z")
    s = main(d)
    s += det("M 186 236 L 326 236", 8)
    # 주름
    for (x1, x2) in ((216, 192), (256, 256), (296, 320)):
        s += stitch(f"M {x1} 248 L {x2} 440")
    # 끈 매듭
    s += det("M 236 236 Q 222 270 230 290 M 276 236 Q 290 270 282 290", 7)
    s += stitch("M 120 430 L 392 430")
    return s


def inner_thermal():
    L = [(220, 100), (172, 112), (104, 412), (140, 418), (182, 214), (182, 430)]
    s = main(body(L, ("round", 18)))
    # 플랫락 박음질 (라글란)
    s += hsym(lambda m: stitch(f"M {m(224)} 116 L {m(184)} 214"))
    s += hsym(lambda m: stitch(f"M {m(184)} 222 L {m(184)} 420"))
    s += stitch("M 192 410 L 320 410")
    s += det("M 224 108 Q 256 140 288 108", 6)
    return s


def legwear_stockings():
    d = ("M 168 56 L 344 56 L 330 230 L 322 380 Q 318 420 342 436 L 372 446 Q 392 458 378 472 "
         "L 306 472 Q 286 468 286 446 L 280 380 L 256 168 L 232 380 L 226 446 Q 226 468 206 472 "
         "L 134 472 Q 120 458 140 446 L 170 436 Q 194 420 190 380 L 182 230 Z")
    s = main(d)
    s += det("M 169 94 L 343 94", 8)
    s += hsym(lambda m: stitch(f"M {m(150)} 446 Q {m(176)} 450 {m(186)} 470"))
    return s


# ───────────────────────── 소품 ─────────────────────────

def acc_scarf():
    s = ""
    # 목에 감긴 고리
    s += main("M 150 150 Q 150 80 256 80 Q 362 80 362 150 Q 362 210 256 214 Q 150 210 150 150 Z")
    s += main("M 196 150 Q 196 124 256 124 Q 316 124 316 150 Q 316 172 256 174 Q 196 172 196 150 Z")
    # 늘어진 끝 두 개
    s += main("M 200 206 L 186 420 L 258 420 L 262 214")
    s += main("M 270 210 L 318 400 L 378 380 L 330 196")
    # 프린지
    for x in range(194, 256, 14):
        s += det(f"M {x} 420 L {x} 452", 6)
    for i in range(5):
        x1 = 322 + i * 12
        y1 = 398 - i * 4
        s += det(f"M {x1} {y1} L {x1 + 8} {y1 + 30}", 6)
    # 스트라이프
    s += det("M 190 360 L 256 360", 7) + det("M 304 344 L 362 326", 7)
    return s


def acc_gloves():
    d = ("M 186 470 L 186 330 Q 150 300 132 250 Q 124 226 146 222 Q 168 222 180 256 L 196 270 "
         "L 196 140 Q 196 120 214 120 Q 232 120 232 140 L 232 240 "
         "L 236 104 Q 236 84 256 84 Q 276 84 276 104 L 278 240 "
         "L 282 122 Q 282 102 300 102 Q 318 102 318 122 L 318 250 "
         "L 324 164 Q 326 146 342 146 Q 358 148 356 166 L 350 300 Q 346 330 330 340 L 330 470 Z")
    s = main(d)
    s += det("M 186 400 L 330 400", 8)
    s += rib_band_v(190, 326, 410, 466, 8)
    s += stitch("M 214 300 Q 260 320 310 300")
    return s


def rib_band_v(x1, x2, y1, y2, n):
    s = ""
    step = (x2 - x1) / n
    for i in range(1, n):
        x = x1 + step * i
        s += det(f"M {x:.1f} {y1} L {x:.1f} {y2}", 5)
    return s


def acc_beanie():
    s = main("M 120 330 Q 116 150 256 136 Q 396 150 392 330")
    s += main("M 108 330 L 404 330 L 404 420 L 108 420 Z")
    s += rib_band_v(108, 404, 342, 408, 12)
    # 방울
    s += main('M 256 136 m -40 -40 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0')
    s += stitch("M 256 138 L 256 320")
    s += stitch("M 190 162 Q 176 240 178 320")
    s += stitch("M 322 162 Q 336 240 334 320")
    return s


def acc_umbrella():
    s = ""
    s += main("M 72 260 Q 92 100 256 92 Q 420 100 440 260 "
              "Q 410 236 380 260 Q 350 236 318 260 Q 287 236 256 260 "
              "Q 225 236 194 260 Q 162 236 132 260 Q 102 236 72 260 Z")
    s += det("M 256 92 Q 214 160 194 254", 7)
    s += det("M 256 92 Q 298 160 318 254", 7)
    s += det("M 256 92 Q 160 140 132 254", 7)
    s += det("M 256 92 Q 352 140 380 254", 7)
    s += det("M 256 70 L 256 92", 10)
    s += main("M 256 262 L 256 420 Q 256 462 222 462 Q 192 462 192 432")
    return s


ITEMS = {
    "outer_padding_down_01": outer_padding,
    "outer_coat_wool_01": outer_coat,
    "outer_leather_leather_01": outer_leather,
    "outer_trench_polyester_01": outer_trench,
    "outer_field_cotton_01": outer_field,
    "outer_blazer_wool_01": outer_blazer,
    "outer_cardigan_cotton_01": outer_cardigan,
    "top_knit_wool_01": top_knit,
    "top_sweatshirt_cotton_01": top_sweatshirt,
    "top_longsleeve_cotton_01": top_longsleeve,
    "top_shirt_linen_01": top_shirt,
    "top_tshirt_cotton_01": top_tshirt,
    "top_sleeveless_cotton_01": top_sleeveless,
    "bottom_fleece_fleece_01": bottom_fleece,
    "bottom_leggings_polyester_01": bottom_leggings,
    "bottom_jeans_denim_01": bottom_jeans,
    "bottom_slacks_polyester_01": bottom_slacks,
    "bottom_chino_cotton_01": bottom_chino,
    "bottom_shorts_cotton_01": bottom_shorts,
    "onepiece_dress_linen_01": onepiece_dress,
    "inner_thermal_rayon_01": inner_thermal,
    "legwear_stockings_nylon_01": legwear_stockings,
    "acc_scarf_wool_01": acc_scarf,
    "acc_gloves_wool_01": acc_gloves,
    "acc_beanie_wool_01": acc_beanie,
    "acc_umbrella_polyester_01": acc_umbrella,
}


def svg_doc(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
            f'{inner}</svg>\n')


if __name__ == "__main__":
    targets = sys.argv[1:] or list(ITEMS)
    unknown = [t for t in targets if t not in ITEMS]
    if unknown:
        sys.exit(f"모르는 id: {', '.join(unknown)}")
    with tempfile.TemporaryDirectory() as tmp:
        for name in targets:
            sp = os.path.join(tmp, f"{name}.svg")
            with open(sp, "w") as f:
                f.write(svg_doc(ITEMS[name]()))
            subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "-b", "none", sp,
                            "-o", os.path.join(OUT, f"{name}.png")], check=True)
    print(f"{len(targets)}장 → {OUT}")
