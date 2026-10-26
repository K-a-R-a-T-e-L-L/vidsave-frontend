import Image from 'next/image';

// Pre-encoded responsive files avoid an extra server-side image conversion.
export default function Artwork({
  src,
  alt = '',
  className,
  width = 1200,
  height = 900,
}: {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <picture className={className}>
      <source media="(max-width: 740px)" srcSet={`${src}-640.webp`} />
      <Image src={`${src}-1200.webp`} alt={alt} width={width} height={height} unoptimized loading="lazy" />
    </picture>
  );
}
