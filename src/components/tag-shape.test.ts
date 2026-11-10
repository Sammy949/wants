import { TAG, tagPath } from "./tag-shape";

describe("tagPath", () => {
  it("draws the outer shape and the hole", () => {
    const d = tagPath(300, 80);
    expect(d.startsWith("M 18 0 H 284")).toBe(true);
    expect(d).toContain(`M ${TAG.holeX - TAG.holeR} 40`);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it("keeps corner radius within short cards", () => {
    expect(tagPath(300, 20)).toContain("A 10 10");
  });

  it("keeps the hole and nose left of the content inset", () => {
    expect(TAG.holeX + TAG.holeR).toBeLessThan(TAG.contentInset);
    expect(TAG.noseWidth).toBeLessThan(TAG.contentInset);
  });
});
