import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, readingMinutes, safeUrl } from "../markdown";

describe("safeUrl", () => {
  it("يقبل http/https والمسارات الداخلية ويرفض javascript وdata", () => {
    expect(safeUrl("https://a.dz/x")).toBe("https://a.dz/x");
    expect(safeUrl("/blog/x")).toBe("/blog/x");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html;base64,AAA")).toBeNull();
    expect(safeUrl("//evil.com")).toBeNull();
  });
});

describe("parseInline", () => {
  it("عريض ومائل وكود ورابط", () => {
    const r = parseInline("نص **عريض** و*مائل* و`كود` و[رابط](https://a.dz)");
    expect(r.map((x) => x.t)).toEqual(["text", "bold", "text", "italic", "text", "code", "text", "link"]);
  });
  it("رابط غير آمن يتحول إلى نص بلا href", () => {
    const r = parseInline("[اضغط](javascript:alert(1))");
    expect(r.some((x) => x.t === "link")).toBe(false);
    expect(r[0].t).toBe("text");
  });
  it("لا يفسّر HTML: الوسوم تبقى نصاً", () => {
    const r = parseInline("<script>alert(1)</script>");
    expect(r[0].t).toBe("text");
  });
});

describe("parseMarkdown", () => {
  const md = "# عنوان\n\nفقرة أولى\nتتمة\n\n## قسم\n- أ\n- ب\n\n1. واحد\n2. اثنان\n\n![صورة](https://a.dz/i.png)\n\n> اقتباس\n\n---\n";
  it("يبني الكتل الصحيحة", () => {
    const b = parseMarkdown(md);
    expect(b.map((x) => x.t)).toEqual(["heading", "paragraph", "heading", "list", "list", "image", "quote", "hr"]);
  });
  it("h1 يتحول إلى h2 (العنوان الرئيسي محجوز)", () => {
    const b = parseMarkdown("# عنوان");
    expect(b[0].t === "heading" && b[0].level).toBe(2);
  });
  it("صورة برابط غير آمن تُحذف", () => {
    const b = parseMarkdown("![x](javascript:alert(1))");
    expect(b.some((x) => x.t === "image")).toBe(false);
  });
  it("وقت القراءة لا يقل عن دقيقة", () => {
    expect(readingMinutes("كلمة")).toBe(1);
  });
});
