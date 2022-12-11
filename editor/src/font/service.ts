import {fabric} from "fabric";
import qs from "query-string";
import WebFontLoader from "webfontloader";

export let fontFamilies: string[];

type ResponseFont = {family: string};
type ResponseFonts = {items: ResponseFont[]};

export async function initFonts() {
  const url = qs.stringifyUrl({
    url: "https://www.googleapis.com/webfonts/v1/webfonts",
    query: {key: process.env.REACT_APP_GOOGLE_FONTS_API_KEY, sort: "popularity"},
  });
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then((res: ResponseFonts) => res.items.slice(0, 50).map(item => item.family))
    .then((families: string[]) => {
      fontFamilies = families;
      families.forEach(family => {
        // @ts-ignore
        fabric.fontPaths[family] = qs.stringifyUrl({
          url: "https://fonts.googleapis.com/css",
          query: {family: `${family}:regular,bold,italic`},
        });
      });
      return new Promise<void>(resolve => {
        WebFontLoader.load({
          google: {families},
          active: resolve,
        });
      });
    });
}

export default {initFonts};
