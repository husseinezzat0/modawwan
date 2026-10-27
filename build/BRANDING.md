# Modawwan — Measured Ink

The identity is built around a geometric Arabic meem. One open counter and one descending stem carry the name without lettering, pen imagery or decoration. The horizontal connection quietly recalls the order of a note and its margin.

The tile uses the application's existing amber (#d97706); the mark uses its ink colour (#1c1d21). Both are solid fills. The two-colour silhouette remains identical in light and dark environments.

A 512-unit canvas contains a 480-unit tile with 104-unit corner radii. The mark uses a 32-unit weight, a 64-unit counter and a circular arch. Its bounds are horizontally centred; the upper arch balances the lower left stem. Clear space is intentionally generous.

`icon.svg` is the editable master: two shapes, no fonts, embedded images, strokes, filters or gradients. `npm run build:icons` produces all application assets from it; `node scripts/preview_icons.cjs` renders the 16/32/48/256px light/dark review sheet. Preserve the counter and stem when editing; do not add visual effects.
