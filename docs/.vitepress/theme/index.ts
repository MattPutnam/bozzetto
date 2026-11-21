import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Figure from "./Figure.vue";
import KindGallery from "./KindGallery.vue";
import KindOptions from "./KindOptions.vue";
import LivePicture from "./LivePicture.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Figure", Figure);
    app.component("KindGallery", KindGallery);
    app.component("KindOptions", KindOptions);
    app.component("LivePicture", LivePicture);
  },
} satisfies Theme;
