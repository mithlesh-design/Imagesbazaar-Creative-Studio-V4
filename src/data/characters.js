/**
 * Recurring ImagesBazaar models that can be referenced in a generation prompt.
 *
 * One flat list with explicit fields rather than a `{ male, female }` split
 * with the role buried in a display string. Gender is one filter among several
 * instead of the primary axis, and `role` is now a value the picker can filter
 * on rather than prose it would have to parse.
 *
 * Avatars are initials, never photographs — no likeness is implied. `hue` gives
 * each one a distinct colour so a strip of twelve is actually scannable, which
 * a row of identical grey circles is not.
 */
export const characters = [
  { id: 'rajesh', name: 'Rajesh', gender: 'male', role: 'corporate', age: '30s', hue: 210 },
  { id: 'amit', name: 'Amit', gender: 'male', role: 'lifestyle', age: '20s', hue: 152 },
  { id: 'vikram', name: 'Vikram', gender: 'male', role: 'corporate', age: '40s', hue: 258 },
  { id: 'arjun', name: 'Arjun', gender: 'male', role: 'fitness', age: '20s', hue: 22 },
  { id: 'karan', name: 'Karan', gender: 'male', role: 'lifestyle', age: '30s', hue: 340 },
  { id: 'rohit', name: 'Rohit', gender: 'male', role: 'student', age: 'teens', hue: 190 },
  { id: 'priya', name: 'Priya', gender: 'female', role: 'corporate', age: '30s', hue: 288 },
  { id: 'sneha', name: 'Sneha', gender: 'female', role: 'lifestyle', age: '20s', hue: 96 },
  { id: 'ananya', name: 'Ananya', gender: 'female', role: 'fashion', age: '20s', hue: 320 },
  { id: 'meera', name: 'Meera', gender: 'female', role: 'traditional', age: '40s', hue: 12 },
  { id: 'kavya', name: 'Kavya', gender: 'female', role: 'wellness', age: '30s', hue: 168 },
  { id: 'divya', name: 'Divya', gender: 'female', role: 'student', age: 'teens', hue: 236 },
]

/** Human-readable label for a character, used in chips and tooltips. */
export const describeCharacter = (c) =>
  `${c.role.charAt(0).toUpperCase()}${c.role.slice(1)}, ${c.age}`
