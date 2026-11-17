# AID React + Vite

React + Vite migration of the supplied AID static website. The original CSS is retained; no Tailwind or other CSS framework is used.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Pages
- `/` Home
- `/company` Company
- `/capabilities` Capabilities
- `/projects` Projects
- `/careers` Careers
- `/contact` Contact

Images, videos, vendor scripts and the original CSS/animation scripts are served from `public/`. The homepage hero video uses `/videos/aid-hero-new.mp4`, with muted autoplay, looping, inline playback and the original poster.
