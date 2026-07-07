export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    let id: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        id = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/embed/")[1];
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/shorts/")[1];
      }
    }

    if (!id) return null;
    id = id.split("&")[0].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
