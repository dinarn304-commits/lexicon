const TR_MAP = {
  'ğ': 'g', 'Ğ': 'g',
  'ş': 's', 'Ş': 's',
  'ç': 'c', 'Ç': 'c',
  'ö': 'o', 'Ö': 'o',
  'ü': 'u', 'Ü': 'u',
  'ı': 'i',
  'İ': 'i',
};

export function slugify(title) {
  if (!title) return 'untitled';
  let s = title;
  for (const [from, to] of Object.entries(TR_MAP)) {
    s = s.split(from).join(to);
  }
  s = s.toLowerCase();
  s = s.normalize('NFD').replace(/\p{M}/gu, '');
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  return s || 'untitled';
}

export function ensureUniqueSlug(baseSlug, existingSlugs) {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let n = 2;
  while (existingSlugs.has(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}
