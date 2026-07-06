import { ImageResponse } from "next/og";
import { site } from "@/lib/site-config";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0e1626 0%, #16223c 60%, #0e1626 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#f5f6f8" }}>AKTÜRK</span>
          <span style={{ color: "#3f74c4" }}>ENERJİ</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: "#8b93a1",
            display: "flex",
          }}
        >
          Ankara Güneş Enerjisi Sistemleri (GES)
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "10px 28px",
            borderRadius: 999,
            border: "1px solid #223252",
            color: "#f5be6f",
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          2016&apos;dan beri Ankara&apos;da
        </div>
      </div>
    ),
    { ...size }
  );
}
