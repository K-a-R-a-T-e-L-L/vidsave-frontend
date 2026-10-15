import JsonLd from '../JsonLd';
export default function FaqSchema({ items }: { items: { question: string; answer: string }[] }) {
  const complete = items.filter(({ question, answer }) => question.trim() && answer.trim());
  if (!complete.length) return null;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'ru-RU',
        mainEntity: complete.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      }}
    />
  );
}
