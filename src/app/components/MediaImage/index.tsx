'use client';
import Image, { type ImageProps } from 'next/image';
import { mediaImageLoader } from '@/app/lib/media-image';
export default function MediaImage(props: ImageProps) {
  const media = typeof props.src === 'string' && /^\/media\/[0-9a-f-]{36}$/i.test(props.src);
  const privateMedia = typeof props.src === 'string' && props.src.startsWith('/api/admin/');
  return (
    <Image
      {...props}
      alt={props.alt}
      loader={media ? mediaImageLoader : props.loader}
      quality={props.quality ?? (media ? 85 : 75)}
      unoptimized={privateMedia || (!media && props.unoptimized)}
    />
  );
}
