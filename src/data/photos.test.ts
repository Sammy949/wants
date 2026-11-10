import { newPhotoName } from "./photos";

describe("newPhotoName", () => {
  it("keeps a known extension, lowercased", () => {
    expect(newPhotoName("file:///cache/ImagePicker/ABC.JPG", 0, 0)).toBe("0-000000.jpg");
    expect(newPhotoName("file:///cache/x.heic", 0, 0)).toMatch(/\.heic$/);
  });

  it("falls back to jpg for unknown or missing extensions", () => {
    expect(newPhotoName("content://media/external/images/1234", 0, 0)).toMatch(/\.jpg$/);
    expect(newPhotoName("file:///cache/x.exe", 0, 0)).toMatch(/\.jpg$/);
  });

  it("ignores query strings", () => {
    expect(newPhotoName("file:///cache/x.png?v=2", 0, 0)).toMatch(/\.png$/);
  });

  it("produces different names for different times and randomness", () => {
    expect(newPhotoName("a.jpg", 1, 0.1)).not.toBe(newPhotoName("a.jpg", 2, 0.1));
    expect(newPhotoName("a.jpg", 1, 0.1)).not.toBe(newPhotoName("a.jpg", 1, 0.2));
  });
});
