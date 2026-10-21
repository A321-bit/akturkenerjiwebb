"""Proje fotoğraflarından dikey (9:16) kısa video üretir: Türkçe yapay zekâ seslendirme,
senkronlu altyazı, başlık bandı ve logolu kapanış kartı. Reels / Shorts / TikTok için.

Kullanım:  python scripts/reel.py <spec.json>
spec.json: {"out": "...mp4", "title": ["ANKARA BAĞLICA", "10 kW Villa GES"],
            "script": "Seslendirme metni...", "images": ["a.jpg", ...],
            "voice": "tr-TR-AhmetNeural", "end": ["Ücretsiz keşif", "0 (312) 988 03 88"]}
Gerekenler: pip install imageio-ffmpeg edge-tts pillow
"""
import asyncio, json, os, subprocess, sys, tempfile, time

import edge_tts
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "public", "akturk-enerji-logo.png")
FONT_B = "C:/Windows/Fonts/segoeuib.ttf"
FONT_R = "C:/Windows/Fonts/segoeui.ttf"
NAVY, BLUE, SUN = (18, 53, 91), (31, 95, 160), (245, 183, 0)


async def tts(text, voice, mp3):
    """Seslendirme + kelime zamanları (altyazı için)."""
    words = []
    com = edge_tts.Communicate(text, voice, rate="+6%", boundary="WordBoundary")
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return words


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    h, m, s = out.split("Duration: ")[1].split(",")[0].split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def ass_time(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def subtitles(words, path):
    """3–4 kelimelik parçalar; noktalama işaretinde parça biter."""
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 4 or w[2].endswith((".", ",", "?", "!")):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    head = (
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        "Style: Sub,Segoe UI,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,6,2,2,70,70,430,1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    lines = []
    for i, c in enumerate(chunks):
        start = c[0][0]
        end = chunks[i + 1][0][0] if i + 1 < len(chunks) else c[-1][1] + 0.4
        text = " ".join(w[2] for w in c).replace(",", ",").strip()
        lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Sub,,0,0,0,,{text}")
    open(path, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")


def font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)


def title_png(lines, path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 190
    for i, t in enumerate(lines):
        f = font(66 if i == 0 else 54, True)
        tw = d.textlength(t, font=f)
        pad = 34
        box = (W / 2 - tw / 2 - pad, y, W / 2 + tw / 2 + pad, y + (90 if i == 0 else 78))
        d.rounded_rectangle(box, 22, fill=(SUN if i == 0 else NAVY) + (235,))
        d.text((W / 2, y + (45 if i == 0 else 39)), t, font=f, fill=NAVY if i == 0 else (255, 255, 255), anchor="mm")
        y += 108
    img.save(path)


def end_png(lines, path):
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    logo = Image.open(LOGO).convert("RGBA")
    lw = 860
    logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
    img.paste(logo, ((W - lw) // 2, 640), logo)
    y = 640 + logo.height + 90
    for i, t in enumerate(lines):
        f = font(64 if i == 0 else 52, i == 0)
        d.text((W / 2, y), t, font=f, fill=BLUE if i == 0 else NAVY, anchor="mm")
        y += 96
    d.rectangle((0, H - 170, W, H), fill=NAVY)
    d.text((W / 2, H - 85), "akturkenerji.com", font=font(54), fill=(255, 255, 255), anchor="mm")
    img.save(path)


def clean_image(src, dst):
    """Fotoğrafın altında/üstünde kalmış düz renkli (bozuk yükleme) bantları keser."""
    from PIL import ImageStat
    im = Image.open(src).convert("RGB")
    w, h = im.size

    def flat(y):
        row = im.crop((0, y, w, y + 1))
        return max(ImageStat.Stat(row).stddev) < 2.0

    top, bot = 0, h
    while bot - top > h // 2 and flat(bot - 1):
        bot -= 1
    while bot - top > h // 2 and flat(top):
        top += 1
    im.crop((0, top, w, bot)).save(dst, quality=95)
    return dst


def main(spec_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    tmp = tempfile.mkdtemp(prefix="reel_")
    mp3 = os.path.join(tmp, "voice.mp3")
    for attempt in range(4):  # ses servisi ara sıra boş yanıt veriyor
        try:
            words = asyncio.run(tts(spec["script"], spec.get("voice", "tr-TR-AhmetNeural"), mp3))
            break
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 3:
                raise
            time.sleep(3 + attempt * 3)
    a = duration(mp3)
    end_d = 3.0
    total = a + 0.6 + end_d
    subtitles(words, os.path.join(tmp, "sub.ass"))
    title_png(spec["title"], os.path.join(tmp, "title.png"))
    end_png(spec.get("end", ["Ücretsiz keşif için bize yazın"]), os.path.join(tmp, "end.png"))

    imgs = [clean_image(p, os.path.join(tmp, f"img{i}.jpg")) for i, p in enumerate(spec["images"])]
    n = len(imgs)
    xf = 0.6
    seg = (a + 0.6 + xf * (n - 1)) / n  # görsellerin toplamı seslendirmeyi kapsasın
    inputs, filters = [], []
    for i, p in enumerate(imgs):
        inputs += ["-framerate", str(FPS), "-loop", "1", "-t", f"{seg:.3f}", "-i", p]
        frames = int(seg * FPS)
        # Kapla (cover) + yavaş yakınlaşma, çift indekslerde sağa, tek indekslerde sola kayma
        zx = "iw/2-(iw/zoom/2)" + ("+(on/%d)*40" % frames if i % 2 == 0 else "-(on/%d)*40" % frames)
        filters.append(
            f"[{i}:v]scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
            f"zoompan=z='min(1+on/{frames}*0.12,1.12)':x='{zx}':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS},setsar=1[v{i}]"
        )
    chain = "[v0]"
    for i in range(1, n):
        off = seg * i - xf * i
        filters.append(f"{chain}[v{i}]xfade=transition=fade:duration={xf}:offset={off:.3f}[x{i}]")
        chain = f"[x{i}]"
    k = n
    inputs += ["-framerate", str(FPS), "-loop", "1", "-t", f"{end_d:.3f}", "-i", os.path.join(tmp, "end.png")]
    filters.append(f"[{k}:v]scale={W}:{H},setsar=1,fps={FPS},settb=AVTB[end]")
    inputs += ["-framerate", str(FPS), "-loop", "1", "-t", f"{total:.3f}", "-i", os.path.join(tmp, "title.png")]
    filters.append(f"[{k+1}:v]format=rgba,fade=t=in:st=0.2:d=0.4:alpha=1,fade=t=out:st=4.2:d=0.5:alpha=1[ttl]")
    sub = os.path.join(tmp, "sub.ass").replace("\\", "/").replace(":", "\\:")
    filters.append(f"{chain}trim=0:{a + 0.6:.3f},setpts=PTS-STARTPTS[body]")
    filters.append(f"[body][ttl]overlay=0:0:shortest=1,subtitles='{sub}',fps={FPS},settb=AVTB[bodys]")
    filters.append(f"[bodys][end]xfade=transition=fade:duration=0.5:offset={a + 0.1:.3f},format=yuv420p[vout]")
    inputs += ["-i", mp3]
    audio = f"[{k+2}:a]apad=pad_dur={end_d + 1},atrim=0:{total - 0.5:.3f},afade=t=out:st={total - 1.2:.3f}:d=0.7[aout]"
    filters.append(audio)
    cmd = [FF, "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", str(FPS), "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", spec["out"]]
    subprocess.run(cmd, check=True)
    print(f"OK {spec['out']}  ({duration(spec['out']):.1f} sn, seslendirme {a:.1f} sn)")


if __name__ == "__main__":
    main(sys.argv[1])
