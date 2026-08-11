/**
 * Recurring ImagesBazaar models that can be referenced in a generation prompt.
 * Avatars are initials rather than photographs — no likeness is implied.
 */
export const characters = {
  male: [
    { id: 'rajesh', name: 'Rajesh', note: 'Corporate, 30s' },
    { id: 'amit', name: 'Amit', note: 'Lifestyle, 20s' },
    { id: 'vikram', name: 'Vikram', note: 'Business, 40s' },
    { id: 'arjun', name: 'Arjun', note: 'Fitness, 20s' },
    { id: 'karan', name: 'Karan', note: 'Casual, 30s' },
    { id: 'rohit', name: 'Rohit', note: 'Student, teens' },
  ],
  female: [
    { id: 'priya', name: 'Priya', note: 'Corporate, 30s' },
    { id: 'sneha', name: 'Sneha', note: 'Lifestyle, 20s' },
    { id: 'ananya', name: 'Ananya', note: 'Fashion, 20s' },
    { id: 'meera', name: 'Meera', note: 'Traditional, 40s' },
    { id: 'kavya', name: 'Kavya', note: 'Wellness, 30s' },
    { id: 'divya', name: 'Divya', note: 'Student, teens' },
  ],
}

export const aspectRatios = [
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: 'custom', label: 'Custom', ratio: null }, // follows the image's own ratio
]

/**
 * Editing is grouped into a handful of plain-language tools rather than a wall
 * of sliders — the audience is not professional retouchers.
 * `key` maps to a field in the editor's `adjustments` object.
 */
export const toolGroups = [
  {
    id: 'crop',
    label: 'Crop',
    sliders: [
      { key: 'offsetX', label: 'Move across', min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'offsetY', label: 'Move up / down', min: 0, max: 100, step: 1, suffix: '%' },
    ],
  },
  {
    id: 'light',
    label: 'Light',
    sliders: [
      { key: 'brightness', label: 'Brightness', min: 20, max: 180, step: 1, suffix: '%', reset: 100 },
      { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1, reset: 0 },
      { key: 'contrast', label: 'Contrast', min: 20, max: 180, step: 1, suffix: '%', reset: 100 },
    ],
  },
  {
    id: 'colour',
    label: 'Colour',
    sliders: [
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, suffix: '%', reset: 100 },
      { key: 'warmth', label: 'Warmth', min: -100, max: 100, step: 1, reset: 0 },
    ],
  },
  { id: 'filters', label: 'Filters', presets: true },
  {
    id: 'detail',
    label: 'Detail',
    sliders: [
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, step: 1, suffix: '%', reset: 0 },
      { key: 'blur', label: 'Soften', min: 0, max: 20, step: 0.5, suffix: 'px', reset: 0 },
    ],
  },
  { id: 'rotate', label: 'Rotate', actions: true },
]

/**
 * Download sizes, expressed as a fraction of the largest frame the chosen
 * aspect ratio can cut from the source. Deriving them this way means every
 * option offered is real detail rather than an upscale — a 2000×1500 photo
 * cropped to 1:1 can only give 1500×1500, and the list reflects that.
 */
export const resolutionTiers = [
  { id: 'small', label: 'Small', scale: 0.4, note: 'Social posts and email' },
  { id: 'medium', label: 'Medium', scale: 0.66, note: 'Websites and presentations' },
  { id: 'large', label: 'Large', scale: 1, note: 'Print and large displays' },
]

/** Demo subscription plans shown at the download gate. No payment is taken. */
export const subscriptionPlans = [
  { id: 'starter', name: 'Starter', price: '₹1,499', period: '/month', detail: '25 downloads a month' },
  {
    id: 'professional',
    name: 'Professional',
    price: '₹3,999',
    period: '/month',
    detail: '100 downloads a month',
    popular: true,
  },
  { id: 'business', name: 'Business', price: '₹9,999', period: '/month', detail: 'Unlimited downloads' },
]

/** Filter presets, expressed as CSS filter fragments applied on the canvas. */
export const filterPresets = [
  { id: 'none', label: 'Original', css: '' },
  { id: 'mono', label: 'Mono', css: 'grayscale(1)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.72)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.32) saturate(1.35) hue-rotate(-12deg)' },
  { id: 'cool', label: 'Cool', css: 'saturate(1.1) hue-rotate(14deg) brightness(1.04)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.4) contrast(1.12) saturate(0.82)' },
  { id: 'fade', label: 'Fade', css: 'contrast(0.86) saturate(0.78) brightness(1.08)' },
  { id: 'punch', label: 'Punch', css: 'contrast(1.22) saturate(1.4)' },
]
