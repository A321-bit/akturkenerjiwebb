import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

// Yazılardaki markdown tablolarını (| a | b |) gösterebilmek için GFM.
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };
// Geniş tablolar mobilde sayfayı yana taşırmasın; tablo kendi içinde kayar.
const mdxComponents = {
  // Yazı içi fotoğraflar: ![alt](url "alt yazı"). "-opt.webp" dosyalarının
  // 800px kopyası telefonlarda kullanılır; başlık (title) fotoğraf altı yazısı olur.
  img: ({ src, alt, title }: React.ComponentProps<"img">) => {
    const url = typeof src === "string" ? src : "";
    return (
      <span className="my-7 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          srcSet={url.endsWith("-opt.webp") ? `${url.replace(/-opt\.webp$/, "-opt-800.webp")} 800w, ${url} 1600w` : undefined}
          sizes="(min-width: 768px) 768px, 100vw"
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="mx-auto my-0 max-h-[520px] w-auto rounded-xl"
        />
        {title && <span className="mt-2 block text-center text-[13px] text-slate-soft">{title}</span>}
      </span>
    );
  },
  table: (props: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

// Blog yazıları ve hizmet sayfası rehberleri için ortak markdown gösterimi.
// İçerik admin panelden düz metin olarak giriliyor; MDX "{", "}" ve "<"
// karakterlerini kod sanıp sayfayı hata verdirir (ör. "<5 kW"). Bunlar
// düz karakter olarak gösterilsin diye kaçışlanır.
function escapeMdx(source: string): string {
  return source.replace(/[{}]/g, (c) => "\\" + c).replace(/</g, "&lt;");
}

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={escapeMdx(source)} options={mdxOptions} components={mdxComponents} />;
}
