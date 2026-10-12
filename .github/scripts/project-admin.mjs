import fs from 'node:fs';

const body = process.env.ISSUE_BODY || '';
const title = process.env.ISSUE_TITLE || '';
const catalogPath = 'content/projects.json';
const publicPath = 'data/projects.js';

const readCatalog = () => JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const writeCatalog = (projects) => fs.writeFileSync(catalogPath, `${JSON.stringify(projects, null, 2)}\n`);
const writePublic = (projects) => {
  const published = projects
    .filter(project => project.status === 'published')
    .sort((a, b) => (b.publishedOrder || 0) - (a.publishedOrder || 0));
  fs.writeFileSync(publicPath, `window.PFW_PROJECTS = ${JSON.stringify(published, null, 2)};\n`);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const field = (label) => {
  const match = body.match(new RegExp(`### ${escapeRegex(label)}\\s*\\n\\s*([\\s\\S]*?)(?=\\n### |$)`, 'i'));
  if (!match) return '';
  const value = match[1].trim();
  if (!value || value === '_No response_') return '';
  return value;
};

const slug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-+/g, '-');

const normalizeStatus = (value) => {
  const v = value.toLowerCase();
  if (v.startsWith('publish')) return 'published';
  if (v.startsWith('hidden')) return 'hidden';
  if (v.startsWith('draft')) return 'draft';
  return '';
};

const normalizeType = (value) => {
  const v = value.toLowerCase();
  if (v.includes('documentary')) return 'documentary';
  if (v.includes('short')) return 'shortfilm';
  if (v.includes('series')) return 'series';
  return '';
};

const firstAssetValue = (value) => {
  if (!value) return '';
  const markdown = value.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdown) return markdown[1].trim();
  const link = value.match(/https?:\/\/[^\s)]+/);
  if (link) return link[0].trim();
  return value.split('\n')[0].trim();
};

const youtubeId = (value) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || '';
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const parts = url.pathname.split('/').filter(Boolean);
    const embedIndex = parts.findIndex(part => part === 'embed' || part === 'shorts');
    if (embedIndex >= 0) return parts[embedIndex + 1] || '';
  } catch (_) {}
  return trimmed;
};

const boolValue = (value, current = false) => {
  if (!value || value.toLowerCase().includes('keep current')) return current;
  return value.toLowerCase().startsWith('yes');
};

const numberValue = (value, fallback) => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

let projects = readCatalog();
let operation = '';
if (title.startsWith('[Project Admin] Create:')) operation = 'create';
if (title.startsWith('[Project Admin] Edit:')) operation = 'edit';
if (title.startsWith('[Project Admin] Status:')) operation = 'status';
if (title.startsWith('[Project Admin] Delete:')) operation = 'delete';
if (!operation) throw new Error('Unsupported Pixel Filmworks admin request title.');

const rawId = field('Project ID');
const id = slug(rawId);
if (!id) throw new Error('Project ID is required.');

if (operation === 'create') {
  if (projects.some(project => project.id === id)) throw new Error(`Project ${id} already exists.`);
  const projectTitle = field('Title');
  const status = normalizeStatus(field('Status')) || 'draft';
  const type = normalizeType(field('Type'));
  const year = numberValue(field('Year'), new Date().getFullYear());
  if (!projectTitle || !type) throw new Error('Title and Type are required.');
  const maxOrder = projects.reduce((max, project) => Math.max(max, Number(project.publishedOrder) || 0), 0);
  const project = {
    id,
    title: projectTitle,
    status,
    type,
    year,
    durationLabel: field('Duration') || undefined,
    genre: field('Genre') || undefined,
    description: field('Description') || undefined,
    tags: field('Tags') ? field('Tags').split(',').map(tag => tag.trim()).filter(Boolean) : [],
    series: field('Series') || undefined,
    episode: numberValue(field('Episode'), undefined),
    detailUrl: `/project/?id=${encodeURIComponent(id)}`,
    thumbnail: firstAssetValue(field('Thumbnail')),
    background: firstAssetValue(field('Background')) || undefined,
    logo: firstAssetValue(field('Logo')) || undefined,
    youtubeId: youtubeId(field('YouTube video')),
    trailerUrl: field('Trailer URL') || undefined,
    featured: boolValue(field('Featured'), false),
    publishedOrder: maxOrder + 1
  };
  Object.keys(project).forEach(key => project[key] === undefined && delete project[key]);
  projects.push(project);
}

if (operation === 'edit') {
  const index = projects.findIndex(project => project.id === id);
  if (index < 0) throw new Error(`Project ${id} does not exist.`);
  const current = projects[index];
  const setIf = (key, value) => { if (value !== '' && value !== undefined) current[key] = value; };
  setIf('title', field('Title'));
  setIf('status', normalizeStatus(field('Status')));
  setIf('type', normalizeType(field('Type')));
  setIf('year', numberValue(field('Year'), undefined));
  setIf('durationLabel', field('Duration'));
  setIf('genre', field('Genre'));
  setIf('description', field('Description'));
  if (field('Tags')) current.tags = field('Tags').split(',').map(tag => tag.trim()).filter(Boolean);
  setIf('series', field('Series'));
  setIf('episode', numberValue(field('Episode'), undefined));
  setIf('thumbnail', firstAssetValue(field('Thumbnail')));
  setIf('background', firstAssetValue(field('Background')));
  setIf('logo', firstAssetValue(field('Logo')));
  setIf('youtubeId', youtubeId(field('YouTube video')));
  setIf('trailerUrl', field('Trailer URL'));
  if (field('Featured')) current.featured = boolValue(field('Featured'), Boolean(current.featured));
  projects[index] = current;
}

if (operation === 'status') {
  const index = projects.findIndex(project => project.id === id);
  if (index < 0) throw new Error(`Project ${id} does not exist.`);
  const status = normalizeStatus(field('Status'));
  if (!status) throw new Error('A valid status is required.');
  projects[index].status = status;
}

if (operation === 'delete') {
  const confirm = field('Confirmation');
  if (confirm !== `DELETE ${id}`) throw new Error(`Confirmation must be exactly: DELETE ${id}`);
  const next = projects.filter(project => project.id !== id);
  if (next.length === projects.length) throw new Error(`Project ${id} does not exist.`);
  projects = next;
}

writeCatalog(projects);
writePublic(projects);
console.log(`Pixel Filmworks admin operation '${operation}' completed for '${id}'.`);
