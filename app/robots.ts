import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";

// Yapay zekâ arama ve asistan botları (ChatGPT, Claude, Perplexity, Gemini,
// Apple, Bing Copilot) açıkça izinli: cevaplarda siteden alıntı yapılabilsin.
// llms.txt ve llms-full.txt bu botlar için sitenin özetidir.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

const DISALLOW = ["/admin", "/api"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
