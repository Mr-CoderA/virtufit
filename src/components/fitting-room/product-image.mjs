export const categories = [
  { id: 'auto', label: 'Match the product image' },
  { id: 'top', label: 'Top / shirt / sweater' },
  { id: 'outerwear', label: 'Jacket / outerwear' },
  { id: 'dress', label: 'Dress / one-piece' },
  { id: 'outfit', label: 'Full outfit / suit' },
  { id: 'bottoms', label: 'Trousers / skirt' },
  { id: 'kurta', label: 'Kurta / kameez' },
];

export function productPrompt(category = 'auto', description = '') {
  const actions = {
    auto: 'Substitute the corresponding clothing on the person with the garment or outfit shown in the reference image.',
    top: 'Substitute the current top with the top shown in the reference image. Keep the current bottoms unchanged.',
    outerwear: 'Substitute the current outer layer with the jacket or outerwear shown in the reference image. Keep the current bottoms unchanged.',
    dress: 'Substitute the current top and bottoms with the dress or one-piece garment shown in the reference image.',
    outfit: 'Substitute the current outfit, including top and bottoms, with the complete outfit shown in the reference image.',
    bottoms: 'Substitute the current bottoms with the trousers or skirt shown in the reference image. Keep the current top unchanged.',
    kurta: 'Substitute the current top with the long kurta or kameez shown in the reference image, preserving its length, neckline and embroidery.',
  };
  return `${actions[category] || actions.auto} Match its colors, fabric, pattern, details and silhouette. Preserve the person's face, body proportions and background.${description.trim() ? ` Additional garment details: ${description.trim()}` : ''}`;
}

export function productFraming(category = 'auto') {
  return ['dress', 'outfit', 'bottoms', 'auto'].includes(category)
    ? 'Stand back so your full outfit is visible.'
    : category === 'kurta' ? 'Keep your shoulders, torso and knees in view.'
    : 'Keep your upper body in view.';
}

export function validateProductFile(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPG or WebP image.';
  if (file.size > 12 * 1024 * 1024) return 'Choose an image under 12 MB.';
  if (file.size === 0) return 'That file is empty. Choose another image.';
  return '';
}
