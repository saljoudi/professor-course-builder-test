export const COURSE_THEMES = [
  {
    id: 'academic',
    name: 'Academic',
    description: 'Structured university layout with persistent module navigation.',
    preview: { label: 'A', layout: 'sidebar' }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bright card-based interface with strong visual hierarchy.',
    preview: { label: 'M', layout: 'cards' }
  },
  {
    id: 'dark-focus',
    name: 'Dark Focus',
    description: 'Low-glare immersive lesson view for focused study.',
    preview: { label: 'D', layout: 'focus' }
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Warm study-notes aesthetic with section tabs and callouts.',
    preview: { label: 'N', layout: 'notes' }
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Polished professional layout for graduate and executive courses.',
    preview: { label: 'E', layout: 'split' }
  }
];

export function normalizeTheme(id) {
  return COURSE_THEMES.some((t) => t.id === id) ? id : 'academic';
}
