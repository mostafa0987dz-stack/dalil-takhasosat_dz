import { describe, expect, it } from "vitest";
import { algiersToIso, isoToAlgiersLocal, postState, validateBlogPost } from "../blog-validate";

const base = { slug: "choose-major", title: "كيف تختار تخصصك", content_md: "محتوى المقال الكافي للنشر والعرض هنا.", status: "draft" };

describe("validateBlogPost", () => {
  it("يقبل مقالاً صالحاً كمسودة", () => {
    const r = validateBlogPost(base);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.value.status).toBe("draft"); expect(r.value.published_at).toBeNull(); }
  });
  it("slug غير صالح يُرفض", () => {
    expect(validateBlogPost({ ...base, slug: "Bad Slug" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, slug: "-x" }).ok).toBe(false);
  });
  it("النشر بلا محتوى يُرفض، ومعه يأخذ تاريخ الآن", () => {
    expect(validateBlogPost({ ...base, status: "published", content_md: "قصير" }).ok).toBe(false);
    const now = new Date("2026-11-20T10:00:00Z");
    const r = validateBlogPost({ ...base, status: "published" }, now);
    expect(r.ok && r.value.published_at).toBe(now.toISOString());
  });
  it("روابط الصور: javascript مرفوض، http مقبول", () => {
    expect(validateBlogPost({ ...base, cover_image_url: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, cover_image_url: "https://a.dz/i.png" }).ok).toBe(true);
  });
  it("الوسوم تُنظَّف وتُزال المكررة", () => {
    const r = validateBlogPost({ ...base, tags: "أ، ب\nأ" });
    expect(r.ok && r.value.tags.join("|")).toBe("أ|ب");
  });
});

describe("التواريخ والحالة", () => {
  it("توقيت الجزائر UTC+1 ذهاباً وإياباً", () => {
    expect(algiersToIso("2026-11-20T14:30")).toBe("2026-11-20T13:30:00.000Z");
    expect(isoToAlgiersLocal("2026-11-20T13:30:00.000Z")).toBe("2026-11-20T14:30");
  });
  it("مجدول عندما يكون النشر في المستقبل", () => {
    const now = new Date("2026-11-20T10:00:00Z");
    expect(postState({ status: "published", published_at: "2026-11-21T00:00:00Z" }, now)).toBe("scheduled");
    expect(postState({ status: "published", published_at: "2026-11-19T00:00:00Z" }, now)).toBe("published");
    expect(postState({ status: "draft", published_at: null }, now)).toBe("draft");
  });
});
