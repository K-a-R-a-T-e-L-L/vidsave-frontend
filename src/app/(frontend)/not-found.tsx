import Link from 'next/link';
import '@/app/styles/404.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Страница не найдена',
};

const NotFound = () => {
  return (
    <div className="page_not_found">
      <h1 className="page_not_found__h1">404</h1>
      <h2 className="page_not_found__h2">К сожалению такая не была найдена</h2>
      <h3 className="page_not_found__h3">
        Проверьте адрес страницы и если вы уверены что всё корректно, свяжитесь пожалуйста с владельцем +7-995-065-67-77
      </h3>
      <Link className="page_not_found__link" href={'/'}>
        Перейти на главную ↸
      </Link>
    </div>
  );
};

export default NotFound;
