export const mediaWidths = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;
export const mediaQualities = [75, 85] as const;
export function mediaImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  return src + '?w=' + width + '&q=' + (quality === 75 ? 75 : 85);
}
