import type { ContentItem } from '@/app/lib/cms-types';
import type { CatalogService, CatalogCategory } from '@/app/lib/catalog-types';
import Footer from '../Footer';
import Header from '../Header';
import Home from '../Home';

export default function Layout({
  services,
  categories,
  posts,
  projects,
}: {
  services: CatalogService[];
  categories: CatalogCategory[];
  posts: ContentItem[];
  projects: ContentItem[];
}) {
  return (
    <div className="public-site">
      <Header />
      <main id="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <Home services={services} catalogCategories={categories} posts={posts} projects={projects} />
      </main>
      <Footer />
    </div>
  );
}
