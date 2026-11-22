export const serviceCities = [
  { slug: 'topki', name: 'Топки', location: 'в Топках' },
  { slug: 'kemerovo', name: 'Кемерово', location: 'в Кемерове' },
  { slug: 'leninsk-kuznetskiy', name: 'Ленинск-Кузнецкий', location: 'в Ленинске-Кузнецком' },
  { slug: 'belovo', name: 'Белово', location: 'в Белове' },
  { slug: 'novokuznetsk', name: 'Новокузнецк', location: 'в Новокузнецке' },
  { slug: 'yurga', name: 'Юрга', location: 'в Юрге' },
  { slug: 'anzhero-sudzhensk', name: 'Анжеро-Судженск', location: 'в Анжеро-Судженске' },
  { slug: 'gurevsk', name: 'Гурьевск', location: 'в Гурьевске' },
  { slug: 'prokopyevsk', name: 'Прокопьевск', location: 'в Прокопьевске' },
  { slug: 'kiselevsk', name: 'Киселёвск', location: 'в Киселёвске' },
];

export const cityPath = (slug: string) => '/goroda/' + slug;
export type CityDirection = 'videonablyudenie' | 'kondicionery' | 'elektromontazh';
