# Geometry Overview

## Context

<https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_view/Coordinate_systems>

Positions in play:

* client => event.clientX and event.clientY
    * <https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>
* mouse => position within the canvas element
* document => position within the document


## Basic Transformations

* The canvas is positioned within the SPA
* We take the `event.clientX/clientY` and subtract the `<canvas>` upper/left to get the mouse position within
* Now we transform the "viewport" within the canvas by
    1. Translate by vx,vy
    2. Scale by vscale

```js
// Determine the client positioning of the canvas
cbbox = canvas_el.getBoundingClientRect();
canvas_root_x = cbbox.x;
canvas_root_y = cbbox.y;

// Transform from client coordinates to the canvas
canvas_x = event.clientX - canvas_root_x;
canvas_y = event.clientY - canvas_root_y;

// Transform from canvas to the document
doc_x = ( canvas_x - vx ) / vscale;
doc_y = ( canvas_y - vy ) / vscale;

// Now in the other direction:

// Transform document to canvas
canvas_x = ( doc_x * vscale ) + vx;
canvas_y = ( doc_y * vscale ) + vy;

// Transform from canvas to client
event_clientX = canvas_x + canvas_root_x;
event_clientY = canvas_y + canvas_root_y;
```

Note this doesn't take into account effects like `devicePixelRatio`.
