# ImageMax Web Tools V4 UX

## Script Builder

The primary task is reading the generated one-shot Lua. The screen therefore uses a vertical workflow:

1. Top: choose a compact template and configure the current rule blocks.
2. Bottom: always-visible generated Lua with the selected ImageMax image context beside it.

Only six recommended templates are visible initially. Advanced recipes remain behind `전체 보기`, search and category filtering.

## GUI Builder

The canvas remains the real ImageMax 360 x 320 logical coordinate system. The preview no longer assumes 150% zoom; 125% is the default, and `화면 맞춤` calculates a usable preview scale from the workspace size.

Selected controls can be moved by drag or keyboard:
- Arrow: 1 logical pixel
- Shift + Arrow: 5 logical pixels

This makes small corrections substantially easier than drag-only editing.

## Function Reference

Every function card exposes a signature copy action. When an example exists in the data record, an example-copy action is also rendered.
