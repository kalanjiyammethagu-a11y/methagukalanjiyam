import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAutoplayEmbedUrl,
  isDirectVideoFileUrl,
  isEmbedPlatformUrl,
  matchVideoCategorySlug,
  normalizeVideoEmbedUrl,
  odyseeUrlToLbryUri,
  resolveVideoMedia,
  resolveVideoPosterUrl,
} from "../../src/lib/video-utils.ts";

describe("Odysee & Video Media Resolution Unit Tests", () => {
  it("normalizes Odysee watch URLs to /$/embed/ while preserving existing %24 embed URLs and tokens", () => {
    assert.equal(
      normalizeVideoEmbedUrl("https://odysee.com/@Methagu_kalanjiyam:7/Introduction-Video:16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln"),
      "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/Introduction-Video:16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln"
    );

    const existingEncoded =
      "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln";
    assert.equal(normalizeVideoEmbedUrl(existingEncoded), existingEncoded);

    assert.equal(
      normalizeVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    assert.equal(
      normalizeVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("forces seeded Odysee URLs copied into legacy video_url column back to iframe embed mode", () => {
    const odyseeEmbed =
      "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln";
    const resolved = resolveVideoMedia({
      embed_url: odyseeEmbed,
      video_url: odyseeEmbed,
      video_path: null,
    });

    assert.equal(resolved.mode, "embed");
    assert.equal(resolved.embedUrl, odyseeEmbed);
    assert.equal(resolved.videoUrl, undefined);
    assert.equal(isEmbedPlatformUrl(odyseeEmbed), true);
    assert.equal(isDirectVideoFileUrl(odyseeEmbed), false);
  });

  it("keeps direct Supabase Storage MP4/WebM uploads in HTML5 video upload mode", () => {
    const storageMp4 = "http://127.0.0.1:54329/storage/v1/object/public/videos/video-123.mp4";
    const resolved = resolveVideoMedia({
      embed_url: "",
      video_url: storageMp4,
      video_path: "video-123.mp4",
    });

    assert.equal(resolved.mode, "upload");
    assert.equal(resolved.videoUrl, storageMp4);
    assert.equal(isDirectVideoFileUrl(storageMp4, "video-123.mp4"), true);
    assert.equal(isEmbedPlatformUrl(storageMp4), false);
  });

  it("resolves deleted local /images/video-posters/*.webp paths dynamically to Supabase Storage", () => {
    const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54329";
    try {
      assert.equal(
        resolveVideoPosterUrl({ poster_url: "/images/video-posters/7.webp", poster_path: "7.webp" }),
        "http://127.0.0.1:54329/storage/v1/object/public/video-posters/7.webp"
      );
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
    }
  });

  it("adds host-appropriate autoplay parameters and matches Memorial / Memorials category aliases", () => {
    const odyseeAuto = getAutoplayEmbedUrl("https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=abc");
    assert.ok(odyseeAuto.includes("autoplay=true"));
    assert.ok(odyseeAuto.includes("r=abc"));

    const ytAuto = getAutoplayEmbedUrl("https://youtu.be/dQw4w9WgXcQ");
    assert.ok(ytAuto.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));
    assert.ok(ytAuto.includes("autoplay=1"));

    assert.equal(
      normalizeVideoEmbedUrl("lbry://@Methagu_kalanjiyam#7/Introduction-Video#16"),
      "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/Introduction-Video:16"
    );

    assert.equal(
      odyseeUrlToLbryUri("https://odysee.com/@Methagu_kalanjiyam:7/Introduction-Video:16?r=abc"),
      "lbry://@Methagu_kalanjiyam#7/Introduction-Video#16"
    );
    assert.equal(
      odyseeUrlToLbryUri("https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=abc"),
      "lbry://@Methagu_kalanjiyam#7/Introduction-Video#16"
    );
    assert.equal(odyseeUrlToLbryUri("https://youtube.com/watch?v=123"), null);

    assert.equal(matchVideoCategorySlug("Memorial", "நினைவேந்தல்"), "memorial");
    assert.equal(matchVideoCategorySlug("Memorials", "Memorials"), "memorial");
    assert.equal(matchVideoCategorySlug("Overview", "அறிமுகம்"), "overview");
  });
});
