import qs from "query-string";

const API_KEY = process.env.REACT_APP_PIXABAY_API_KEY;

export type Media =
  | {
      type: "photo";
      webformatURL: string;
      webformatWidth: number;
      webformatHeight: number;
      largeImageURL: string;
    }
  | {
      type: "video";
      duration: number;
      videos: {
        large: {
          url: string;
          width: number;
          height: number;
        };
        tiny: {
          url: string;
          width: number;
          height: number;
        };
      };
    };

type FetchMediasOpts = {
  q: string;
  page: number;
  type: "photo" | "video";
  signal: AbortSignal;
};

const cache: {[url: string]: Media[]} = {};

export async function fetchMedias(opts: FetchMediasOpts): Promise<Media[]> {
  const type = opts.type === "video" ? "videos/" : "";
  const url = qs.stringifyUrl({
    url: "https://pixabay.com/api/" + type,
    query: {
      key: API_KEY,
      lang: "fr",
      q: opts.q,
      page: String(opts.page),
      per_page: String(30),
    },
  });

  if (url in cache) return cache[url];
  const res = await fetch(url, {signal: opts.signal});
  if (!res.ok) throw new Error(res.statusText);
  const medias = (await res.json()).hits.map((m: Media) => ({...m, type: opts.type}));
  cache[url] = medias;
  return medias;
}

export default {fetchMedias};
