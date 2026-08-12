/**
 * Static configuration for the Creative Studio.
 *
 * Previously all of this lived in `data/characters.js` alongside the character
 * list, which meant one file owned four unrelated jobs. Characters stayed put;
 * everything the editor needs to describe itself lives here.
 */

/**
 * `ratio: null`     → free-form, the user sizes both axes independently.
 * `ratio: 'source'` → follows the image's own proportions.
 * Anything else is a fixed width ÷ height.
 */
export const aspectRatios = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'original', label: 'Original', ratio: 'source' },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
]

/**
 * The ratios that earn a pill above the canvas. The rest — free-form, the
 * image's own proportions, portrait video — live behind "Custom", which also
 * takes a typed width and height. Four pills and an escape hatch, rather than
 * seven pills nobody reads.
 */
export const aspectPills = ['1:1', '4:3', '16:9', '3:2']
export const customAspects = ['free', 'original', '9:16']

export const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  exposure: 0, // -100..100
  contrast: 100,
  saturation: 100,
  warmth: 0, // -100 (cool) .. 100 (warm)
  blur: 0,
  sharpen: 0,
  filter: 'none',
}

/**
 * The toolbar beneath the canvas: one button per thing you might want to
 * change, named the way a photograph is talked about rather than the way the
 * pipeline is built. `key` maps to a field in `adjustments`; `reset` is the
 * value a double-click returns the slider to, and the origin its fill grows
 * from.
 *
 * `icon` is a string, not a component, so this module stays plain data — it is
 * imported by the reducer and the renderer, which have no business pulling in
 * React. `EditToolbar` owns the string → glyph mapping.
 *
 * `mode: true` means the tool has no popover: selecting it changes what the
 * stage is doing instead of opening controls.
 */
export const editTools = [
  {
    id: 'crop',
    label: 'Crop',
    icon: 'crop',
    mode: true,
    hint: 'Drag inside the frame to reposition, or pull a corner to resize.',
  },
  { id: 'rotate', label: 'Rotate', icon: 'rotate', actions: true },
  {
    id: 'brightness',
    label: 'Brightness',
    icon: 'sun',
    sliders: [
      { key: 'brightness', label: 'Brightness', min: 20, max: 180, step: 1, suffix: '%', reset: 100 },
      { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1, reset: 0 },
    ],
  },
  {
    id: 'contrast',
    label: 'Contrast',
    icon: 'contrast',
    sliders: [
      { key: 'contrast', label: 'Contrast', min: 20, max: 180, step: 1, suffix: '%', reset: 100 },
    ],
  },
  {
    id: 'saturation',
    label: 'Saturation',
    icon: 'droplet',
    sliders: [
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, suffix: '%', reset: 100 },
      { key: 'warmth', label: 'Warmth', min: -100, max: 100, step: 1, reset: 0 },
    ],
  },
  { id: 'filters', label: 'Filters', icon: 'filters', presets: true },
  {
    id: 'blur',
    label: 'Blur',
    icon: 'blur',
    sliders: [{ key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.5, suffix: 'px', reset: 0 }],
  },
  {
    id: 'sharpen',
    label: 'Sharpen',
    icon: 'sharpen',
    sliders: [{ key: 'sharpen', label: 'Sharpen', min: 0, max: 100, step: 1, suffix: '%', reset: 0 }],
    hint: 'Zoom to 100% to judge sharpening — it is invisible on a fitted view.',
  },
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

/**
 * Download sizes, expressed as a fraction of the crop's long edge. Deriving
 * them from the crop means every option offered is real detail rather than an
 * upscale — a 2000×1500 photo cropped to 1:1 can only give 1500×1500.
 */
export const resolutionTiers = [
  { id: 'small', label: 'Small', scale: 0.4, note: 'Social posts and email' },
  { id: 'medium', label: 'Medium', scale: 0.66, note: 'Websites and presentations' },
  { id: 'large', label: 'Large', scale: 1, note: 'Print and large displays' },
]

export const exportFormats = [
  { id: 'image/jpeg', label: 'JPEG', ext: 'jpg', lossy: true, note: 'Smallest file' },
  { id: 'image/png', label: 'PNG', ext: 'png', lossy: false, note: 'Lossless' },
  { id: 'image/webp', label: 'WebP', ext: 'webp', lossy: true, note: 'Best for web' },
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

/**
 * Filters for the character strip. Gender sits alongside the roles rather than
 * above them, so it is one way to narrow the list instead of the first choice
 * every user is forced to make.
 */
export const characterFilters = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'corporate', label: 'Corporate', match: (c) => c.role === 'corporate' },
  { id: 'lifestyle', label: 'Lifestyle', match: (c) => c.role === 'lifestyle' },
  { id: 'fashion', label: 'Fashion', match: (c) => c.role === 'fashion' },
  { id: 'fitness', label: 'Fitness', match: (c) => c.role === 'fitness' },
  { id: 'wellness', label: 'Wellness', match: (c) => c.role === 'wellness' },
  { id: 'traditional', label: 'Traditional', match: (c) => c.role === 'traditional' },
  { id: 'student', label: 'Student', match: (c) => c.role === 'student' },
  { id: 'women', label: 'Women', match: (c) => c.gender === 'female' },
  { id: 'men', label: 'Men', match: (c) => c.gender === 'male' },
]

/** Zoom limits for the stage view. */
export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 4
export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.66, 1, 1.5, 2, 3, 4]

/** Undo depth. EditState is ~20 numbers, so this costs almost nothing. */
export const HISTORY_LIMIT = 60
