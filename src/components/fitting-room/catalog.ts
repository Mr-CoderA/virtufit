export type Garment = { id: string; name: string; detail: string; image: string; prompt: string; custom?: boolean; category?: string };
export const catalog: Garment[] = [
  { id: 'blazer', name: 'The tailored suit', detail: 'Navy · Tailored', image: '/garments/decart-blazer.png', prompt: 'Substitute the current top with the navy blue tailored blazer, light blue collared shirt and blue tie from the reference image, matching the fabric and fitted silhouette.' },
  { id: 'bomber', name: 'The bomber', detail: 'Black · Everyday', image: '/garments/decart-bomber.png', prompt: 'Substitute the current top with the bomber jacket from the reference image, matching its exact color, material, zipper, ribbed cuffs and relaxed silhouette.' },
  { id: 'hoodie', name: 'The hoodie', detail: 'Soft · Relaxed', image: '/garments/decart-hoodie.png', prompt: 'Substitute the current top with the hoodie from the reference image, matching its exact color, hood, pocket, logo, cotton fabric and relaxed fit.' },
  { id: 'polo', name: 'The classic polo', detail: 'Cotton · Smart casual', image: '/garments/decart-polo.png', prompt: 'Substitute the current top with the short sleeved polo shirt from the reference image, matching its exact color, small logo, collar, buttons and textured cotton fabric.' },
  { id: 'crewneck', name: 'The crewneck', detail: 'Knit · Essential', image: '/garments/decart-crewneck.png', prompt: 'Substitute the current top with the crewneck sweatshirt from the reference image, matching its exact color, small logo, ribbed neckline, cuffs and relaxed fit.' }
];
