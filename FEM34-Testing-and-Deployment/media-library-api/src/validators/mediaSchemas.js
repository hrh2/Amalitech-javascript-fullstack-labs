// Zod schemas: the rules for every input. A schema is checked BEFORE the controller runs (middlewares/validate.js).
// Zod "parses": it checks the value, converts it (text "2" -> number 2, "a,b" -> ['a','b']) and drops unknown fields.
const { z } = require('zod');
const { CATEGORIES, SORT_FIELDS, PAGINATION } = require('../config/constants');

// Multipart forms and query strings only carry text, so "tags" arrives as "a,b" (or as repeated fields: an array of text).
// Turn both into one clean array before checking it. Anything else (a number, an object) is left alone so the check fails.
function toTagList(value) {
  if (typeof value === 'string') return value.split(',');
  if (Array.isArray(value)) return value.flatMap((item) => (typeof item === 'string' ? item.split(',') : [item]));
  return value;
}
const cleanTags = (value) => {
  const list = toTagList(value);
  return Array.isArray(list) ? list.map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : t)).filter((t) => t !== '') : list;
};

const tag = z.string({ error: 'Each tag must be text' }).max(30, 'A tag can be at most 30 characters');
const tags = z.preprocess(cleanTags, z.array(tag, { error: 'tags must be an array of text values' }).max(10, 'At most 10 tags'));

const title = z
  .string({ error: 'Title is required' })
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title can be at most 200 characters');

const category = z.enum(CATEGORIES, { error: `category must be one of: ${CATEGORIES.join(', ')}` });

/** POST /media: title is required, tags and category are optional. */
const createMediaBody = z.object({
  title,
  tags: tags.default([]),
  category: category.default('other'),
});

/** PUT /media/:id: any of the three metadata fields, but at least one. */
const updateMediaBody = z
  .object({ title: title.optional(), tags: tags.optional(), category: category.optional() })
  .refine((body) => Object.keys(body).length > 0, { error: 'Send at least one of: title, tags, category' });

const mediaIdParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'id must be a valid 24-character id'),
});

const whole = (name, min, max) => {
  let schema = z.coerce.number({ error: `${name} must be a number` }).int({ error: `${name} must be a whole number` }).min(min, `${name} must be at least ${min}`);
  if (max) schema = schema.max(max, `${name} can be at most ${max}`);
  return schema;
};

/** GET /media: page, limit, category, tags, search, sortBy, order. */
const listMediaQuery = z.object({
  page: whole('page', 1).default(PAGINATION.defaultPage),
  limit: whole('limit', 1, PAGINATION.maxLimit).default(PAGINATION.defaultLimit),
  category: category.optional(),
  tags: tags.optional(),
  search: z.string({ error: 'search must be text' }).trim().min(1, 'search cannot be empty').max(100, 'search can be at most 100 characters').optional(),
  sortBy: z.enum(SORT_FIELDS, { error: `sortBy must be one of: ${SORT_FIELDS.join(', ')}` }).default('createdAt'),
  order: z.enum(['asc', 'desc'], { error: 'order must be asc or desc' }).default('desc'),
});

module.exports = { createMediaBody, updateMediaBody, mediaIdParams, listMediaQuery };
