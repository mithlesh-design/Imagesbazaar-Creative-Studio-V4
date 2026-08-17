# 🎨 AnimatedBackground Component Folder

This separate folder contains the complete, portable **AnimatedBackground** component. You can copy this entire folder into any other project (`React`, `Next.js`, `Vite`, `Remix`, `Gatsby`, etc.).

---

## 📁 Folder Contents

```
AnimatedBackground/
├── AnimatedBackground.jsx      # Core React component with customizable props
├── AnimatedBackground.css      # Self-contained animations and responsive CSS
├── ExampleUsage.jsx            # Ready-to-use example snippets
├── index.js                    # Barrel export
└── README.md                   # Documentation and props table
```

---

## 🚀 How to Use in Another Project

### Step 1: Copy the Folder
Copy the `AnimatedBackground` folder into your project (for example under `src/components/AnimatedBackground`).

### Step 2: Import & Render

```jsx
import React from 'react';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  return <AnimatedBackground />;
}
```

### Step 3: (Optional) Wrap Page / Hero Content

```jsx
import React from 'react';
import AnimatedBackground from './components/AnimatedBackground';

export default function Hero() {
  return (
    <AnimatedBackground lineColor="#FCFAF8" lineCount={20}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h1>Welcome to My Agency</h1>
      </div>
    </AnimatedBackground>
  );
}
```

---

## ⚙️ Customization Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `imageUrl` | `string` | Higgs/CloudFront WebP | Custom background image URL. |
| `showImage` | `boolean` | `true` | Show or hide the background image. |
| `showLines` | `boolean` | `true` | Show or hide the curved lines pulse animation. |
| `lineColor` | `string` | `'#FCFAF8'` | CSS color of the curved lines. |
| `lineBorderWidth` | `number` | `2.5` | Border thickness of the lines in pixels. |
| `lineCount` | `number` | `20` | Number of animated lines on each side. |
| `animationDuration` | `number` | `5` | Pulse animation duration in seconds. |
| `staggerDelay` | `number` | `0.25` | Delay increment between each line in seconds. |
| `backgroundColor` | `string` | `'#ffffff'` | Container background color. |
| `overlayColor` | `string` | `undefined` | Optional color tint overlay (e.g. `'rgba(0,0,0,0.05)'`). |
| `className` | `string` | `''` | Extra CSS class names. |
| `style` | `object` | `{}` | Inline CSS styles for the container. |
| `children` | `ReactNode`| `undefined` | Elements rendered on top of the background. |
