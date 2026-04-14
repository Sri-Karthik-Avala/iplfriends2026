// Stores the image crop focal point as a URL fragment on image_url so we don't
// need a separate DB column. Example: "/uploads/siri.jpeg#pos=50,20" means the
// object-position for cropped avatars should be "50% 20%". If the URL has no
// fragment, we fall back to a portrait-friendly default (50% 30%).

const DEFAULT_X = 50;
const DEFAULT_Y = 30;

export function parseImagePos(url: string | null | undefined): {
  src: string;
  objectPosition: string;
  x: number;
  y: number;
} {
  if (!url) {
    return { src: '', objectPosition: `${DEFAULT_X}% ${DEFAULT_Y}%`, x: DEFAULT_X, y: DEFAULT_Y };
  }
  const match = url.match(/^(.*?)#pos=(\d{1,3}),(\d{1,3})$/);
  if (!match) {
    return { src: url, objectPosition: `${DEFAULT_X}% ${DEFAULT_Y}%`, x: DEFAULT_X, y: DEFAULT_Y };
  }
  const x = Math.max(0, Math.min(100, Number(match[2])));
  const y = Math.max(0, Math.min(100, Number(match[3])));
  return { src: match[1], objectPosition: `${x}% ${y}%`, x, y };
}

export function buildImageUrl(src: string, x: number, y: number): string {
  const cleanSrc = (src || '').replace(/#pos=\d{1,3},\d{1,3}$/, '');
  const nx = Math.round(Math.max(0, Math.min(100, x)));
  const ny = Math.round(Math.max(0, Math.min(100, y)));
  if (nx === DEFAULT_X && ny === DEFAULT_Y) return cleanSrc;
  return `${cleanSrc}#pos=${nx},${ny}`;
}
