'use client';
import { createContext, useContext, type ReactNode, type ComponentProps } from 'react';
import type { ImageProps } from 'next/image';
import MediaImage from '../MediaImage';
import type { PublicBootstrap } from '@/app/lib/cms-types';
import { contactValues } from '@/app/lib/site-contact';
const Context = createContext<PublicBootstrap | null>(null);
export function CmsProvider({ data, children }: { data: PublicBootstrap; children: ReactNode }) {
  return (
    <Context.Provider value={data}>
      <div>{children}</div>
    </Context.Provider>
  );
}
export function useCms() {
  const data = useContext(Context);
  if (!data) throw Error('Site provider required');
  return data;
}
export function useContactData() {
  const { settings } = useCms();
  return { settings, ...contactValues(settings) };
}
export function PageText({ value, children }: { value: string; children?: ReactNode }) {
  return <>{children ?? value}</>;
}
export const CmsTitle = PageText;
export function CmsIntro({ value }: { value: string }) {
  return <>{value}</>;
}
export function ManagedSection({ title: _title, children, ...props }: ComponentProps<'section'> & { title: string }) {
  void _title;
  return <section {...props}>{children}</section>;
}
export function EditableImage(props: ImageProps) {
  return <MediaImage {...props} />;
}
export function EditableFaq({ fallback }: { fallback: { question: string; answer: string }[] }) {
  return (
    <div>
      {fallback.map((item) => (
        <details key={item.question} className="cms-faq">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
export const CmsCtaTitle = ({ value }: { value: string }) => <>{value}</>;
export const CmsCtaText = CmsCtaTitle;
