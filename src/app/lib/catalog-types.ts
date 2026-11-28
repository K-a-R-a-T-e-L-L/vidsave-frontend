export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  legacyFeedId?: number | null;
  direction?: 'surveillance' | 'climate' | 'electrical' | 'none' | null;
};

export type ServiceTariff = { label: string; priceRub: string };
export type CatalogService = {
  id: string;
  legacyId: number | null;
  name: string;
  slug: string;
  description: string;
  details: string | null;
  category: Pick<CatalogCategory, 'id' | 'name' | 'slug' | 'direction'>;
  tariffs?: ServiceTariff[];
  priceRub: string | null;
  priceMode: 'fixed' | 'from' | 'on_request';
  unitLabel: string | null;
  sortOrder: number;
  homeOrder?: number | null;
  updatedAt?: string;
  imagePath: string | null;
  imageAlt?: string;
  mediaId?: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};
