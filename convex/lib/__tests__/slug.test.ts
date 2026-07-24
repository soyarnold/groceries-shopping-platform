import { describe, expect, it } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Fresh Market")).toBe("fresh-market");
  });

  it("strips accents and punctuation", () => {
    expect(slugify("Café & Pantry!")).toBe("cafe-pantry");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("   ")).toBe("");
  });
});
