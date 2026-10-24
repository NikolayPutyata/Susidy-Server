// The fixed ingredient dictionary the admin picks from (chip selector in
// the admin product form) — products store these ids, never free text, so
// the roll filters on the client match exactly. Mirrors the client's
// src/lib/ingredients.js; add a new ingredient in both places.
//
// `aliases` are only for scripts/migrateIngredients.js — they map the old
// comma-separated free-text tags admins typed by hand onto these ids.
export const INGREDIENTS = [
  {
    id: 'salmon',
    label: 'Лосось',
    aliases: ['лосось', 'семга', 'сьомга', 'salmon'],
  },
  { id: 'tuna', label: 'Тунець', aliases: ['тунець', 'тунец', 'tuna'] },
  { id: 'eel', label: 'Вугор', aliases: ['вугор', 'угорь', 'вугра', 'eel'] },
  {
    id: 'shrimp',
    label: 'Креветка',
    aliases: ['креветка', 'креветки', 'креветкою', 'shrimp'],
  },
  {
    id: 'crab',
    label: 'Краб',
    aliases: ['краб', 'сніжний краб', 'крабові палички', 'crab'],
  },
  { id: 'chicken', label: 'Курка', aliases: ['курка', 'курятина', 'chicken'] },
  {
    id: 'cheese',
    label: 'Сир',
    aliases: [
      'сир',
      'вершковий сир',
      'крем-сир',
      'крем сир',
      'філадельфія',
      'cheese',
    ],
  },
  {
    id: 'mayo',
    label: 'Майонез',
    aliases: ['майонез', 'японський майонез', 'mayo'],
  },
  { id: 'avocado', label: 'Авокадо', aliases: ['авокадо', 'avocado'] },
  {
    id: 'cucumber',
    label: 'Огірок',
    aliases: ['огірок', 'огірки', 'cucumber'],
  },
  {
    id: 'tobiko',
    label: 'Ікра тобіко',
    aliases: ['тобіко', 'ікра тобіко', 'масаго', 'ікра', 'tobiko'],
  },
  { id: 'sesame', label: 'Кунжут', aliases: ['кунжут', 'sesame'] },
];

export const INGREDIENT_IDS = INGREDIENTS.map((ingredient) => ingredient.id);
