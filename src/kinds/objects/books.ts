import { defineKind, el, hsl, pts, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { numberWord } from "../../draw/words";

/**
 * Books standing and leaning on a shelf, sometimes with a small plant.
 *
 * @category Objects
 */
export const books = /* @__PURE__ */ defineKind("books", "Bookshelf", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const shelfY = h * g.f(0.74, 0.8);
  const wall = hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90));
  const hue = g.f(0, 360);
  // Wall
  let out = el("rect", { width: w, height: h, fill: wall });
  // Shelf and the shadow under it
  out += el("rect", { y: shelfY, width: w, height: h * 0.05, fill: hsl(g.f(20, 35), 35, 45) });
  out += el("rect", { y: shelfY + h * 0.05, width: w, height: h * 0.02, fill: "#000", opacity: "0.1" });
  let x = w * g.f(0.04, 0.12);
  const end = w * g.f(0.85, 0.96);
  const plantAt = g.chance(0.5) ? g.i(2, 5) : -1;
  const startX = x;
  let bookCount = 0;
  let leaning = 0;
  let plant = false;
  for (let k = 0; x < end; k++) {
    if (k === plantAt) {
      // A small potted plant
      const potR = unit * 0.06;
      out += el("polygon", {
        points: pts([
          [x, shelfY - potR * 1.6],
          [x + potR * 1.6, shelfY - potR * 1.6],
          [x + potR * 1.3, shelfY],
          [x + potR * 0.3, shelfY],
        ]),
        fill: "#c4572f",
      });
      out += el("path", {
        d: blob(g, x + potR * 0.8, shelfY - potR * 2.6, potR * 1.1, potR * 1.0, 6, 0.25, 0.08),
        fill: "#4f8a5a",
      });
      x += potR * 1.6 + unit * 0.03;
      plant = true;
      continue;
    }
    const bookW = unit * g.f(0.04, 0.075);
    const bookH = h * g.f(0.28, 0.45);
    const color = hsl(hue + g.f(-70, 70), g.f(30, 60), g.f(30, 65));
    const lean = x > w * 0.4 && g.chance(0.12) ? g.f(8, 18) : 0;
    // A pale band across some spines
    const band = g.chance(0.6)
      ? el("rect", {
          x,
          y: shelfY - bookH * g.f(0.75, 0.85),
          width: bookW,
          height: bookH * 0.06,
          fill: "#fff",
          opacity: "0.45",
        })
      : "";
    const book = el("rect", { x, y: shelfY - bookH, width: bookW, height: bookH, fill: color }) + band;
    // A leaning book tips over its bottom right corner.
    out += lean ? el("g", { transform: s`rotate(${lean} ${x + bookW} ${shelfY})` }, book) : book;
    x += bookW + (lean ? bookH * Math.sin((lean * Math.PI) / 180) : unit * 0.004);
    bookCount++;
    if (lean) leaning++;
  }
  const leanText = leaning === 0 ? "" : leaning === 1 ? ", one leaning" : `, ${numberWord(leaning)} leaning`;
  note.alt(`A row of ${numberWord(bookCount)} books on a shelf${leanText}${plant ? ", beside a small plant" : ""}`);
  note.focus((startX + x) / 2, shelfY - h * 0.18);
  return out;
});
