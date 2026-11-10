import { Directory, File, Paths } from "expo-file-system";

/**
 * Photos live in <documents>/photos and the database stores only the file name.
 * Storing a full URI would break on iOS, where the app container path can change
 * between installs and updates.
 *
 * The image picker and camera hand back files in the cache directory, which the
 * OS may clear. Always copy them in with savePhoto before storing the name.
 */

const KNOWN_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "heif", "webp"]);

export function newPhotoName(sourceUri: string, now: number = Date.now(), random: number = Math.random()): string {
  const path = sourceUri.split(/[?#]/)[0];
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1).toLowerCase() : "";
  const safeExt = KNOWN_EXTENSIONS.has(ext) ? ext : "jpg";
  const suffix = Math.floor(random * 36 ** 6).toString(36).padStart(6, "0");
  return `${now.toString(36)}-${suffix}.${safeExt}`;
}

function photosDir(): Directory {
  const dir = new Directory(Paths.document, "photos");
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Copy a picked or captured image into app storage. Returns the stored file name. */
export async function savePhoto(sourceUri: string): Promise<string> {
  const name = newPhotoName(sourceUri);
  await new File(sourceUri).copy(new File(photosDir(), name));
  return name;
}

/** Full URI for rendering a stored photo. */
export function photoUri(name: string): string {
  return new File(Paths.document, "photos", name).uri;
}

/**
 * Delete stored photos. Missing files are ignored: the goal is that nothing
 * unreferenced is left behind, and a failure here must not block the user.
 */
export function deletePhotos(names: readonly string[]): void {
  for (const name of names) {
    try {
      const file = new File(Paths.document, "photos", name);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn(`Could not delete photo ${name}`, error);
    }
  }
}
