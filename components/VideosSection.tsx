import { getVideos } from "@/lib/data";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import Reveal from "@/components/Reveal";

export default async function VideosSection() {
  const videos = await getVideos();
  if (videos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <Reveal>
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Videolarımız
        </p>
        <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Sahadan ve projelerimizden görüntüler
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => {
          const embedUrl = getYouTubeEmbedUrl(v.youtubeUrl);
          if (!embedUrl) return null;
          return (
            <Reveal key={v.id ?? v.title} delay={i * 60}>
              <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
                <div className="aspect-video w-full">
                  <iframe
                    src={embedUrl}
                    title={v.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <p className="px-4 py-3 text-[14px] font-semibold text-ink">{v.title}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
