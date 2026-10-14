export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
export type PageField = {
  role?: 'control';
  id: string;
  label: string;
  text: string;
  visible: boolean;
  order: number;
  imageId?: string | null;
};
export type CmsPage = {
  id: string;
  document: {
    title: string;
    description: string;
    fields: PageField[];
    faq: { question: string; answer: string }[];
    ctaTitle: string;
    ctaText: string;
  };
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  noindex: boolean;
  ogImageId: string | null;
  updatedAt: string;
};
export type Settings = Record<
  | 'companyName'
  | 'phone'
  | 'additionalPhone'
  | 'email'
  | 'additionalEmail'
  | 'address'
  | 'legalName'
  | 'legalAddress'
  | 'inn'
  | 'egrip'
  | 'geography'
  | 'hours'
  | 'telegram'
  | 'vk'
  | 'avito'
  | 'heroLight'
  | 'heroDark'
  | 'ctaTitle'
  | 'ctaText'
  | 'seoTitle'
  | 'seoDescription'
  | 'analyticsId'
  | 'consentText'
  | 'policyVersion',
  string
> & {
  latitude: number;
  longitude: number;
  privacyBody: RichNode;
  consentBody: RichNode;
  privacyPublished: boolean;
  telegramConfigured: boolean;
};
export type CmsBootstrap = {
  media?: Record<string, { alt: string; width: number; height: number }>;
  settings: Settings;
  pages: CmsPage[];
};
export type PublicSettings = Omit<Settings, 'privacyBody' | 'consentBody'>;
export type PublicBootstrap = Omit<CmsBootstrap, 'settings'> & { settings: PublicSettings };
export type ContentItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  coverId: string | null;
  coverUrl: string | null;
  coverAlt?: string;
  ogImageUrl: string | null;
  body?: RichNode;
  categories?: ContentItem[];
  categoryIds?: string[];
  objectType?: string;
  task?: string;
  solution?: string;
  result?: string;
  galleryIds?: string[];
  gallery?: { id: string; alt: string }[];
  services?: import('./catalog-types').CatalogService[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ContentList = { items: ContentItem[]; total: number; page: number; limit: number };
