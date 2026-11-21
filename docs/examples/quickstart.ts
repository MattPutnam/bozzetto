import { owl, render } from "../../src";

export default () => {
  // #region quickstart
  const picture = render(owl, { seed: 3 });
  // picture.src: a data URI for <img src>; picture.svg: the markup
  // picture.alt: "An owl on a branch at dusk under the moon"
  // #endregion quickstart
  return picture.svg;
};
