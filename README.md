# Motion Studio engine

The drawing, motion and player engine behind the **Motion Studio** Gemini Gem by DK.
A Gem's Canvas page loads these three files and holds only the editable parts (video settings, style, voice and the film plan),
so Gemini writes a 7 KB page instead of retyping a 175 KB engine on every build.

```html
<script src="https://cdn.jsdelivr.net/gh/devank28/motion-studio-engine@v2.1/engine-1-styles.js"></script>
<script> /* EDIT: VIDEO, STYLE, VOICE */ </script>
<script src="https://cdn.jsdelivr.net/gh/devank28/motion-studio-engine@v2.1/engine-2-motion.js"></script>
<script> /* EDIT: FILM */ </script>
<script src="https://cdn.jsdelivr.net/gh/devank28/motion-studio-engine@v2.1/engine-3-player.js"></script>
```

Versions are tags; a page pinned to a tag never changes.
