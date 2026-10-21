"""Sahne sahne dikey (9:16) video: her sahnede drone klipleri ve/veya fotoğraflar, o sahnenin
seslendirmesi, altyazısı ve üst bantta proje adı. Sonda logolu kapanış kartı.

Kullanım:  python scripts/reel_scenes.py <spec.json>
spec.json:
{
  "out": "....mp4", "voice": "tr-TR-AhmetNeural", "end": ["Ücretsiz keşif için yazın", "0 (312) 988 03 88"],
  "scenes": [
    {"text": "Seslendirme cümlesi.", "label": ["BAĞLICA", "10 kW On Grid"],
     "media": [{"clip": "D:/.../DJI_0877.MP4", "start": 3}, {"image": "foto.jpg"}]}
  ]
}
Gerekenler: pip install imageio-ffmpeg edge-tts pillow (scripts/reel.py ile aynı).
"""
import asyncio, json, os, subprocess, sys, tempfile, time

import edge_tts
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import FF, FPS, H, W, NAVY, SUN, clean_image, duration, end_png, font, subtitles, tts  # noqa: E402

ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2"]


def label_png(lines, path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 170
    for i, t in enumerate(lines):
        f = font(62 if i == 0 else 50, True)
        tw = d.textlength(t, font=f)
        pad = 32
        hgt = 86 if i == 0 else 74
        d.rounded_rectangle((W / 2 - tw / 2 - pad, y, W / 2 + tw / 2 + pad, y + hgt), 20, fill=(SUN if i == 0 else NAVY) + (235,))
        d.text((W / 2, y + hgt / 2), t, font=f, fill=NAVY if i == 0 else (255, 255, 255), anchor="mm")
        y += hgt + 18
    img.save(path)


def speak(text, voice, mp3):
    time.sleep(1.5)  # ses servisi art arda isteklerde kısıtlıyor
    for attempt in range(6):
        try:
            return asyncio.run(tts(text, voice, mp3))
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 5:
                raise
            time.sleep(10 + attempt * 10)


def ff(args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)


def scene_video(i, sc, voice, tmp):
    mp3 = os.path.join(tmp, f"s{i}.mp3")
    words = speak(sc["text"], voice, mp3)
    dur = duration(mp3) + 0.35
    ass = os.path.join(tmp, f"s{i}.ass")
    subtitles(words, ass)
    lab = os.path.join(tmp, f"s{i}.png")
    label_png(sc.get("label", []), lab)

    media = sc["media"]
    part = dur / len(media)
    inputs, filters = [], []
    for k, m in enumerate(media):
        if "clip" in m:
            inputs += ["-ss", str(m.get("start", 0)), "-t", f"{part + 0.1:.3f}", "-i", m["clip"]]
            # Yatay drone görüntüsünden dikey kesit; isteğe bağlı yatay kaydırma (0 sol, 0.5 orta, 1 sağ)
            cx = m.get("x", 0.5)
            filters.append(
                f"[{k}:v]fps={FPS},scale=-2:{H},crop={W}:{H}:(iw-{W})*{cx}:0,setsar=1,trim=0:{part:.3f},setpts=PTS-STARTPTS[m{k}]"
            )
        else:
            src = clean_image(m["image"], os.path.join(tmp, f"s{i}_{k}.jpg"))
            frames = int(part * FPS)
            inputs += ["-framerate", str(FPS), "-loop", "1", "-t", f"{part:.3f}", "-i", src]
            filters.append(
                f"[{k}:v]scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
                f"zoompan=z='min(1+on/{frames}*0.1,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS},setsar=1[m{k}]"
            )
    n = len(media)
    filters.append("".join(f"[m{k}]" for k in range(n)) + f"concat=n={n}:v=1:a=0[cat]")
    inputs += ["-framerate", str(FPS), "-loop", "1", "-t", f"{dur:.3f}", "-i", lab]
    inputs += ["-i", mp3]
    sub = ass.replace("\\", "/").replace(":", "\\:")
    filters.append(f"[cat][{n}:v]overlay=0:0:shortest=1,subtitles='{sub}',trim=0:{dur:.3f},setpts=PTS-STARTPTS[v]")
    filters.append(f"[{n+1}:a]apad,atrim=0:{dur:.3f}[a]")
    out = os.path.join(tmp, f"s{i}.mp4")
    ff([*inputs, "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]", *ENC, "-t", f"{dur:.3f}", out])
    return out


def end_video(lines, tmp, d=3.0):
    png = os.path.join(tmp, "end.png")
    end_png(lines, png)
    out = os.path.join(tmp, "end.mp4")
    ff(["-framerate", str(FPS), "-loop", "1", "-t", str(d), "-i", png, "-f", "lavfi", "-t", str(d), "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", "fade=t=in:st=0:d=0.4", *ENC, "-shortest", out])
    return out


def main(spec_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    tmp = tempfile.mkdtemp(prefix="reelsc_")
    voice = spec.get("voice", "tr-TR-AhmetNeural")
    parts = [scene_video(i, sc, voice, tmp) for i, sc in enumerate(spec["scenes"])]
    parts.append(end_video(spec.get("end", ["Ücretsiz keşif için yazın"]), tmp))
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{p.replace(chr(92), '/')}'\n")
    ff(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", spec["out"]])
    print(f"OK {spec['out']} ({duration(spec['out']):.1f} sn, {len(parts) - 1} sahne)")


if __name__ == "__main__":
    main(sys.argv[1])
