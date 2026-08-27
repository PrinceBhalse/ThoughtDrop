import { ImageResponse } from "next/og";
import { createClient } from "@/utils/supabase/server";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const alt = "ThoughtDrop idea";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function IdeaOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("title, category, status, communities(name)")
    .eq("id", id)
    .single();

  const title = idea?.title ?? "Thought not found";
  const category = idea?.category ?? "Idea";
  const community = (idea?.communities as unknown as { name?: string }[] | { name?: string } | null)
    ? Array.isArray(idea?.communities)
      ? (idea?.communities as unknown as { name?: string }[])[0]?.name
      : (idea?.communities as unknown as { name?: string } | null)?.name
    : undefined;
  const status = idea?.status ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 64px",
          background: "linear-gradient(135deg, #0b0d12 0%, #101423 100%)",
          color: "#e7e9ee",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg
              width="44"
              height="44"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 6C21.5 6 13 14.5 13 25c0 7 4 13 10 16v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c6-3 10-9 10-16 0-10.5-8.5-19-19-19z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M26 28c0-4 3-7 6-7s6 3 6 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M26 48c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-3-7-6-10-3 3-6 6-6 10z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: "26px", fontWeight: 700, color: "#a6adbb" }}>
              ThoughtDrop
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                fontSize: "20px",
                padding: "10px 20px",
                borderRadius: "999px",
                background: "rgba(79,110,247,0.18)",
                color: "#c3cdff",
              }}
            >
              {category}
            </span>
            {community && (
              <span
                style={{
                  fontSize: "20px",
                  padding: "10px 20px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.06)",
                  color: "#a6adbb",
                }}
              >
                /d/{community}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "58px",
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              color: "#ffffff",
            }}
          >
            {title}
          </h1>
          {status && (
            <span style={{ fontSize: "22px", color: "#8b93a3" }}>
              Status: {status}
            </span>
          )}
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "24px",
          }}
        >
          <span style={{ fontSize: "22px", color: "#8b93a3" }}>
            Drop your thoughts. Watch them ripple.
          </span>
          <span style={{ fontSize: "22px", color: "#4f6ef7", fontWeight: 600 }}>
            thoughtdrop.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
