import React, {FC, useState, useRef} from "react";
import {Waypoint} from "react-waypoint";
import Gallery, {GalleryI, RenderImageProps} from "react-photo-gallery";

import {DragEventsContainer} from "../canvas";
import {Spinner} from "../async";
import $pixabay, {Media} from "./service";
import {ReactComponent as IconSearch} from "./search.svg";
import {ReactComponent as PixabayLogo} from "./logo.svg";
import cs from "./gallery.module.scss";

type CustomPhotoProps = {
  duration?: number;
  originWidth?: number;
  originHeight?: number;
};

const CustomGallery: GalleryI<CustomPhotoProps> = Gallery;

type PixabayGalleryProps = {
  placeholder: string;
  defaultSearch: string;
  evts: DragEventsContainer<string>;
};

export const PixabayGallery: FC<PixabayGalleryProps> = props => {
  const [medias, setMedias] = useState<Media[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const abortCtrl = useRef<AbortController>();

  async function fetchMedias(evt?: React.FormEvent<HTMLFormElement>) {
    if (evt) evt.preventDefault();
    if (isLoading) return;
    setLoading(true);

    try {
      abortCtrl.current = new AbortController();
      const {signal} = abortCtrl.current;
      const q = search.trim() || props.defaultSearch;

      if (evt) {
        // Comes from the form => should replace
        setPage(1);
        const nextMedias = await $pixabay.fetchMedias({type: "photo", q, page: 1, signal});
        setMedias(nextMedias);
      } else {
        // Comes from the scroll => should append
        const nextMedias = await $pixabay.fetchMedias({type: "photo", q, page, signal});
        setMedias([...medias, ...nextMedias]);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err.message);
      }
    }

    setLoading(false);
  }

  function changeSearch(evt: React.ChangeEvent<HTMLInputElement>) {
    if (abortCtrl.current) abortCtrl.current.abort();
    setSearch(evt.target.value);
  }

  function fetchNextPage() {
    setPage(page + 1);
    fetchMedias();
  }

  const galleryMedias = medias.map(media =>
    media.type === "photo"
      ? {
          src: media.webformatURL,
          srcSet: [media.largeImageURL],
          width: media.webformatWidth,
          height: media.webformatHeight,
          originWidth: media.webformatWidth,
          originHeight: media.webformatHeight,
        }
      : {
          src: media.videos.tiny.url,
          srcSet: [media.videos.large.url],
          width: media.videos.tiny.width,
          height: media.videos.tiny.height,
          originWidth: media.videos.large.width,
          originHeight: media.videos.large.height,
          duration: media.duration,
        },
  );

  return (
    <>
      <div className={cs.logoContainer}>
        <a className={cs.logoLink} href="https://pixabay.com/" target="_blank" rel="noopener noreferrer">
          <PixabayLogo className={cs.logo} />
        </a>
      </div>
      <form className={cs.search} onSubmit={fetchMedias}>
        <input
          className={cs.searchInput}
          type="text"
          placeholder={props.placeholder}
          value={search}
          onChange={changeSearch}
        />
        <button className={cs.searchSubmit} type="submit">
          <IconSearch className={cs.searchSubmitIcon} />
        </button>
      </form>
      <CustomGallery
        photos={galleryMedias}
        direction="row"
        targetRowHeight={3}
        margin={2}
        renderImage={imgProps => <PhotoView {...imgProps} evts={props.evts} />}
      />
      <Waypoint bottomOffset={-250} onEnter={fetchNextPage} />
      <footer className={cs.footer}>
        {!isLoading && abortCtrl.current && "Pas de résultat"}
        {isLoading && (
          <>
            <Spinner color="#131021" className={cs.itemSpinner} />
            Chargement…
          </>
        )}
      </footer>
    </>
  );
};

const PhotoView: FC<
  RenderImageProps<CustomPhotoProps> & {
    evts: DragEventsContainer<string>;
  }
> = props => {
  const {margin, photo, evts} = props;
  const loaderRef = React.createRef<HTMLDivElement>();
  const url = photo.srcSet && photo.srcSet.length > 0 ? photo.srcSet[0] : photo.src;

  return (
    <div className={cs.itemContainer} style={{margin}}>
      <Spinner ref={loaderRef} className={cs.itemSpinner} />
      <button className={cs.itemBtn} {...evts(url)}>
        <img
          className={cs.item}
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          onLoad={() => loaderRef.current && loaderRef.current.remove()}
        />
      </button>
    </div>
  );
};

export default PixabayGallery;
