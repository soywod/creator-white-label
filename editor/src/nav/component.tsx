import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from "react";
import Select from "react-select";
import {ChromePicker} from "react-color";
import {fabric} from "fabric";
import {PickerFileMetadata} from "filestack-js";
import cn from "classnames";

import {useAsyncContext} from "../async";
import {
  useCanvas,
  useActiveObjs,
  useActiveTextObjs,
  fitTextboxToContent,
  useToolbox,
  useDragAndDrop,
  usePopover,
  DragEventsContainer,
} from "../canvas";
import {fontFamilies} from "../font/service";
import TextBoldTool from "../text/tool-bold";
import TextItalicTool from "../text/tool-italic";
import TextUnderlineTool from "../text/tool-underline";
import AlignTool from "../text/tool-align";
import ColorTool, {ColorPalette} from "../text/tool-color";
import LayerTool from "../toolbar/tool-layer";
import DuplicateTool from "../toolbar/tool-duplicate";
import OpacityTool from "../toolbar/tool-opacity";
import DeleteTool from "../toolbar/tool-delete";
import CreateTool from "../text/tool-create";
import {PixabayGallery} from "../pixabay";
import {ReactComponent as IconMaterial} from "./material.svg";
import {ReactComponent as IconDimension} from "./dimension.svg";
import {ReactComponent as IconFixation} from "./fixation.svg";
import {ReactComponent as IconText} from "./text.svg";
import {ReactComponent as IconBackground} from "./background.svg";
import {ReactComponent as IconDownload} from "./download.svg";
import {ReactComponent as IconFile} from "./file.svg";
import {ReactComponent as IconPicto} from "./picto.svg";
import {ReactComponent as IconPhoto} from "./photo.svg";
import {ReactComponent as IconClose} from "./close.svg";
import {ReactComponent as IconSettings} from "./settings.svg";
import {ReactComponent as IconPlus} from "./add-circle.svg";
import {ReactComponent as IconColor} from "./color.svg";
import {ReactComponent as IconCustomColor} from "./custom-color.svg";
import {ReactComponent as IconDelete} from "./delete.svg";
import {ReactComponent as IconAdd} from "./add.svg";
import filestack from "../filestack";
import cs from "./component.module.scss";
import {Tool, useTool} from "../toolbar/tool";
import {PictoDrawer} from "../picto";
import {ProductModal} from "../product";
import {DimensionModal} from "../dimension";
import {FixationModal} from "../fixation";
import {useOrder} from "../order";

type DrawerProps = {
  footer?: FC;
  onClose?: () => void;
};

const DrawerFile: FC<DrawerProps> = props => {
  const canvas = useCanvas();
  const [_, setLoading] = useAsyncContext();
  const popover = usePopover();
  const defaultFiles = JSON.parse(localStorage.getItem("files") || "[]");
  const [files, setFiles] = useState<PickerFileMetadata[]>(defaultFiles);

  const imgEvts = useDragAndDrop((url: string) => {
    if (!canvas) return;
    props.onClose && props.onClose();
    setLoading(true);
    fabric.Image.fromURL(
      url,
      img => {
        if (!canvas.clipPath) return;
        const canvasCenter = canvas.getVpCenter();
        const overlayBoundingRect = canvas.clipPath.getBoundingRect();
        img.set({
          originX: "center",
          originY: "center",
          left: canvasCenter.x,
          top: canvasCenter.y,
        });
        if (overlayBoundingRect.width / overlayBoundingRect.height > img.getScaledWidth() / img.getScaledHeight()) {
          img.scaleToWidth(overlayBoundingRect.height / canvas.getZoom() / 2);
        } else {
          img.scaleToWidth(overlayBoundingRect.width / canvas.getZoom() / 2);
        }
        canvas.add(img);
        canvas.setActiveObject(img);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        popover.showPopover(img);
        setLoading(false);
      },
      {crossOrigin: "anonymous"},
    );
  });

  const svgEvts = useDragAndDrop((url: string) => {
    if (!canvas) return;
    props.onClose && props.onClose();
    setLoading(true);
    fabric.loadSVGFromURL(
      url,
      (objs, opts) => {
        if (!canvas.clipPath) return;
        const svg = fabric.util.groupSVGElements(objs, opts);
        const canvasCenter = canvas.getVpCenter();
        const overlayBoundingRect = canvas.clipPath.getBoundingRect();
        svg.set({
          originX: "center",
          originY: "center",
          left: canvasCenter.x,
          top: canvasCenter.y,
        });
        if (overlayBoundingRect.width / overlayBoundingRect.height > svg.getScaledWidth() / svg.getScaledHeight()) {
          svg.scaleToWidth(overlayBoundingRect.height / canvas.getZoom() / 2);
        } else {
          svg.scaleToWidth(overlayBoundingRect.width / canvas.getZoom() / 2);
        }
        canvas.add(svg);
        canvas.setActiveObject(svg);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        popover.showPopover(svg);
        setLoading(false);
      },
      undefined,
      {crossOrigin: "anonymous"},
    );
  });

  async function uploadMedia() {
    const picker = filestack.getClient().picker({
      lang: window.navigator.language.split("-")[0],
      accept: ["image/*", "video/*", "application/*", "text/plain"],
      onUploadDone: ({filesUploaded}) => {
        const nextFiles = files.concat(filesUploaded);
        setFiles(nextFiles);
        localStorage.setItem("files", JSON.stringify(nextFiles));
      },
    });

    picker.open();
  }

  function deleteFile(id: string) {
    const nextFiles = files.filter(f => f.handle !== id);
    setFiles(nextFiles);
    localStorage.setItem("files", JSON.stringify(nextFiles));
  }

  return (
    <>
      <button className={cs.drawerFileUploadButton} onClick={uploadMedia}>
        <IconDownload className={cs.drawerFileUploadButtonIcon} />
        Téléchargez vos fichiers
      </button>
      <div className={cs.drawerFileFiles}>
        {files.map(file => (
          <FileView key={file.uploadId} file={file} events={{image: imgEvts, svg: svgEvts}} onDelete={deleteFile} />
        ))}
      </div>
    </>
  );
};

type FileType = "image" | "svg";
type Evts = {
  image: string;
  svg: string;
};

type FileViewProps = {
  file: PickerFileMetadata;
  events: {[T in FileType]: DragEventsContainer<Evts[T]>};
  onDelete: (id: string) => void;
};

const filestackConvertURL = "https://cdn.filestackcontent.com/";
const formatToPng = "output=format:png,density:500,compress:false,quality:100/";

const FileView: FC<FileViewProps> = props => {
  const {file, events} = props;
  const [fileType, fileSubtype] = file.mimetype.split("/");

  function deleteFile(evt: React.MouseEvent<HTMLAnchorElement>) {
    evt.preventDefault();
    evt.stopPropagation();

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      props.onDelete(file.handle);
    }
  }

  const evts = useMemo(() => {
    switch (fileType) {
      case "image": {
        switch (fileSubtype) {
          case "svg+xml":
            return events.svg(filestackConvertURL + file.handle);
          default:
            return events.image(filestackConvertURL + formatToPng + file.handle);
        }
      }
      default:
        return events.image(filestackConvertURL + formatToPng + file.handle);
    }
  }, [events, file.handle, fileSubtype, fileType]);

  return (
    <button className={cs.drawerFileFileContainer} {...evts}>
      <div className={cs.drawerFileFile}>
        <img
          className={cs.drawerFileThumbnail}
          draggable={false}
          src={filestackConvertURL + formatToPng + file.handle}
          alt=""
        />
        <div className={cs.drawerFileFilename}>{file.filename}</div>
        <div className={cs.drawerFileFileInfos}>{file.mimetype}</div>
        <div className={cs.drawerFileFileActions}>
          <a className={cs.drawerFileFileAction} href="#delete" onClick={deleteFile}>
            <IconDelete className={cs.drawerFileFileActionIcon} />
          </a>
          <span className={cs.drawerFileFileAction}>
            <IconAdd className={cs.drawerFileFileActionIcon} />
          </span>
        </div>
      </div>
    </button>
  );
};

const DrawerBackground: FC<DrawerProps> = () => {
  const canvas = useCanvas();
  const [_, setLoading] = useAsyncContext();
  const order = useOrder();
  const tool = useTool();
  const evts = useDragAndDrop((url: string) => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    const overlayWidth = canvas.clipPath.getScaledWidth();
    const overlayHeight = canvas.clipPath.getScaledHeight();
    const canvasLeft = canvas.getVpCenter().x;
    const canvasTop = canvas.getVpCenter().y;
    setLoading(true);
    filestack
      .getClient()
      .storeURL(url)
      .then(
        ({url}: any) =>
          new Promise(resolve => {
            fabric.Image.fromURL(
              url,
              img => {
                img.applyFilters([new fabric.Image.filters.Brightness({brightness: -0.2})]);
                img.set({
                  left: canvasLeft,
                  top: canvasTop,
                  originX: "center",
                  originY: "center",
                });
                if (img.getScaledWidth() / img.getScaledHeight() > overlayWidth / overlayHeight) {
                  img.scaleToHeight(overlayHeight);
                } else {
                  img.scaleToWidth(overlayWidth);
                }
                canvas.backgroundColor = undefined;
                canvas.setBackgroundImage(img, resolve);
              },
              {crossOrigin: "anonymous"},
            );
          }),
      )
      .finally(() => {
        setLoading(false);
        canvas.requestRenderAll();
      });
  });

  const defaultCustomColor = canvas && canvas.backgroundColor ? canvas.backgroundColor.toString() : undefined;
  const [customColor, setCustomColor] = useState(defaultCustomColor);
  const updateCustomColor = useCallback(
    (color: string) => {
      if (!canvas) return;
      canvas.backgroundImage = undefined;
      canvas.setBackgroundColor(color, () => {
        if (!canvas) return;
        setCustomColor(color);
        canvas.requestRenderAll();
      });
    },
    [canvas],
  );

  const colors =
    order.product && order.product.transparency > 0
      ? [{value: `rgba(255, 255, 255, ${1 - order.product.transparency * 0.01})`, className: cs.color}]
      : [];

  return (
    <>
      <ColorPalette className={cs.colorPalette} onClick={updateCustomColor} colors={colors}>
        <Tool className={cs.colorPaletteBtn} tool={tool} icon={IconCustomColor}>
          <ChromePicker
            disableAlpha
            color={customColor}
            onChange={c => updateCustomColor(c.hex)}
            styles={{
              default: {
                picker: {width: "13rem", border: "none", borderRadius: "0.25rem 0.25rem 0 0", boxShadow: "none"},
              },
            }}
          />
        </Tool>
      </ColorPalette>
      <PixabayGallery evts={evts} placeholder="Rechercher un arrière-plan…" defaultSearch="texture" />
    </>
  );
};

const DrawerPhoto: FC<DrawerProps> = props => {
  const canvas = useCanvas();
  const popover = usePopover();
  const [_, setLoading] = useAsyncContext();
  const evts = useDragAndDrop((url: string) => {
    props.onClose && props.onClose();
    setLoading(true);
    filestack
      .getClient()
      .storeURL(url)
      .then(
        ({url}: any) =>
          new Promise(resolve =>
            fabric.Image.fromURL(
              url,
              img => {
                if (!canvas) return;
                if (!canvas.clipPath) return;
                const canvasCenter = canvas.getVpCenter();
                const overlayBoundingRect = canvas.clipPath.getBoundingRect();
                img.set({
                  originX: "center",
                  originY: "center",
                  left: canvasCenter.x,
                  top: canvasCenter.y,
                });
                if (
                  overlayBoundingRect.width / overlayBoundingRect.height >
                  img.getScaledWidth() / img.getScaledHeight()
                ) {
                  img.scaleToWidth(overlayBoundingRect.height / canvas.getZoom() / 2);
                } else {
                  img.scaleToWidth(overlayBoundingRect.width / canvas.getZoom() / 2);
                }

                canvas.add(img);
                canvas.setActiveObject(img);
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                popover.showPopover(img);
                resolve(img);
              },
              {crossOrigin: "anonymous"},
            ),
          ),
      )
      .finally(() => {
        setLoading(false);
      });
  });

  return <PixabayGallery evts={evts} placeholder="Rechercher une photo…" defaultSearch="activité" />;
};

const DrawerText: FC<DrawerProps> = props => {
  const canvas = useCanvas();
  const activeTextObjs = useActiveTextObjs();
  const activeTextObj = activeTextObjs.length === 1 ? activeTextObjs[0] : undefined;
  const textInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textInput.current) {
      textInput.current.focus();
      textInput.current.selectionStart = textInput.current.value.length;
    }
  }, [textInput.current]);

  // Font size

  const getFontSize = useCallback(() => {
    return activeTextObj ? activeTextObj.fontSize || 0 : 0;
  }, [activeTextObj]);

  const updateFontSize = useCallback(() => {
    setFontSize(getFontSize());
  }, [getFontSize]);

  const handleFontSizeChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas) return;
      if (!activeTextObj) return;
      const nextFontSize = Number.parseInt(evt.target.value) || 0;
      setFontSize(nextFontSize);
      activeTextObj.set({fontSize: nextFontSize});
      fitTextboxToContent(activeTextObj);
      canvas.requestRenderAll();
    },
    [canvas, activeTextObj],
  );

  const [fontSize, setFontSize] = useState(getFontSize());
  const fontSizeStr = fontSize === 0 ? "" : String(fontSize);

  useEffect(() => {
    updateFontSize();
  }, [updateFontSize]);

  useEffect(() => {
    if (!activeTextObj) return;
    activeTextObj.on("scaled", updateFontSize);
    return () => {
      activeTextObj.off("scaled", updateFontSize);
    };
  }, [activeTextObj, updateFontSize]);

  // Text

  const getText = useCallback(() => {
    return (activeTextObj && activeTextObj.text) || "";
  }, [activeTextObj]);

  const updateText = useCallback(() => {
    setText(getText());
  }, [getText]);

  const [text, setText] = useState(getText());

  const handleTextChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!canvas) return;
      if (!activeTextObj) return;
      setText(evt.target.value);
      activeTextObj.set({text: evt.target.value});
      fitTextboxToContent(activeTextObj);
      canvas.requestRenderAll();
    },
    [canvas, activeTextObj],
  );

  useEffect(() => {
    updateText();
  }, [updateText]);

  useEffect(() => {
    if (!activeTextObj) return;
    activeTextObj.on("changed", updateText);
    return () => {
      activeTextObj.off("changed", updateText);
    };
  }, [activeTextObj, updateText]);

  // Font family

  const [fontFamily, setFontFamily] = useState<string | undefined>();
  useEffect(() => {
    setFontFamily((activeTextObj && activeTextObj.fontFamily) || undefined);
  }, [activeTextObj]);

  const updateFontFamily = useCallback(
    (fontFamily?: string) => {
      if (!canvas) return;
      if (!activeTextObj) return;
      activeTextObj.removeStyle("fontFamily");
      setFontFamily(fontFamily);
      activeTextObj.set({fontFamily});
      fitTextboxToContent(activeTextObj);
      canvas.requestRenderAll();
    },
    [canvas, activeTextObj],
  );

  // JSX

  return (
    <>
      <h3 className={cs.drawerTextTitle}>Taille de police</h3>
      <div className={cs.drawerTextFontSize}>
        <input
          type="range"
          className={cs.drawerTextFontSizeRangeInput}
          min="1"
          max="256"
          value={fontSizeStr}
          onChange={handleFontSizeChange}
          disabled={fontFamily === undefined}
        />
        <input
          type="number"
          className={cs.drawerTextFontSizeNumberInput}
          min="1"
          max="256"
          value={fontSizeStr}
          onChange={handleFontSizeChange}
          disabled={fontFamily === undefined}
        />
      </div>
      <h3 className={cs.drawerTextTitle}>Police de caractère</h3>
      <Select
        maxMenuHeight={500}
        onChange={(opt: any) => updateFontFamily(opt ? opt.value : undefined)}
        options={fontFamilies.map(family => ({
          value: family,
          label: family,
        }))}
        value={{value: fontFamily, label: fontFamily}}
        isDisabled={fontFamily === undefined}
        styles={{
          singleValue: (provided: any) => ({
            ...provided,
            color: "#131021",
          }),
          control: (provided: any, state: any) => ({
            ...provided,
            borderWidth: 2,
            borderColor: state.isFocused ? "#3240ff" : "#d6d6d6",
            boxShadow: "none",
            borderRadius: "0.25rem",
            fontFamily: "Orkney",
            fontSize: "0.9rem",
            color: "#131021",
            "&:hover": {
              borderColor: "#3240ff",
            },
          }),
          option: (provided: any, state: any) => ({
            ...provided,
            fontFamily: state.label,
          }),
        }}
      />
      <h3 className={cs.drawerTextTitle}>Texte</h3>
      <div className={cs.textDrawerText}>
        <textarea
          ref={textInput}
          className={cs.textDrawerTextInput}
          autoFocus
          rows={7}
          value={text}
          onChange={handleTextChange}
          disabled={fontFamily === undefined}
          placeholder="Votre texte ici"
        />
        <div className={cs.textDrawerTextTools}>
          <TextBoldTool />
          <TextItalicTool />
          <TextUnderlineTool />
          <AlignTool />
          <ColorTool icon={IconColor} />
        </div>
      </div>
      <div className={cs.textDrawerOtherTools}>
        <LayerTool className={cs.textDrawerOtherTool} label="Positionner" />
        <DuplicateTool className={cs.textDrawerOtherTool} label="Dupliquer" />
        <OpacityTool className={cs.textDrawerOtherTool} label="Opacifier" />
        <DeleteTool className={cs.textDrawerOtherTool} onClick={props.onClose} label="Supprimer" />
        <CreateTool
          className={cs.textDrawerOtherTool}
          onClick={() => textInput.current && textInput.current.focus()}
          label="Nouveau texte"
        />
      </div>
    </>
  );
};

type BottomNavItemKind = "text" | "background" | "file" | "picto" | "photo";
type BottomNavItem = {
  kind: BottomNavItemKind;
  label: string;
  icon: FC<React.SVGProps<SVGSVGElement>>;
  drawer: FC<DrawerProps>;
};

const bottomItems: BottomNavItem[] = [
  {kind: "text", label: "Texte", icon: IconText, drawer: DrawerText},
  {kind: "background", label: "Arrière-plan", icon: IconBackground, drawer: DrawerBackground},
  {kind: "file", label: "Fichiers", icon: IconFile, drawer: DrawerFile},
  {kind: "picto", label: "Pictos", icon: IconPicto, drawer: PictoDrawer},
  {kind: "photo", label: "Photos", icon: IconPhoto, drawer: DrawerPhoto},
];

type TopNavItemKind = "material" | "dimension" | "fixation";
type TopNavItem = {
  kind: TopNavItemKind;
  label: string;
  icon: FC<React.SVGProps<SVGSVGElement>>;
  modal: FC<DrawerProps>;
};

const topItems: TopNavItem[] = [
  {kind: "material", label: "Matière", icon: IconMaterial, modal: ProductModal},
  {kind: "dimension", label: "Dimensions", icon: IconDimension, modal: DimensionModal},
  {kind: "fixation", label: "Fixations", icon: IconFixation, modal: FixationModal},
];

type NavItemProps = {
  icon: FC<React.SVGProps<SVGSVGElement>>;
  kind: TopNavItemKind | BottomNavItemKind;
  active?: boolean;
  onClick: () => void;
};

const NavItem: FC<NavItemProps> = props => {
  const activeTextObjs = useActiveTextObjs();

  return (
    <button className={cs.item} onClick={props.onClick} data-nav-item={props.kind}>
      <div className={cs.iconContainer}>
        <props.icon className={cn(cs.icon, {[cs.iconActive]: props.active})} />
        {props.kind === "text" && activeTextObjs.length === 1 && <IconSettings className={cs.iconSuffix} />}
        {props.kind === "text" && activeTextObjs.length !== 1 && <IconPlus className={cs.iconSuffix} />}
      </div>
      {props.children}
    </button>
  );
};

export const Nav: FC = () => {
  const canvas = useCanvas();
  const activeObjs = useActiveObjs();
  const activeTextObjs = useActiveTextObjs();
  const toolbox = useToolbox();
  const popover = usePopover();
  const [topItem, setTopItem] = useState<TopNavItem | undefined>();
  const [bottomItem, setBottomItem] = useState<BottomNavItem | undefined>();

  useEffect(() => {
    if (!canvas) return;
    const hideBottomItem = () => {
      if (activeTextObjs.length === 0) closeDrawer();
      else if (activeTextObjs.length > 0 && (!bottomItem || bottomItem.kind !== "text")) closeDrawer();
    };
    const hideBottomItemStrict = () => closeDrawer();
    canvas.on("mouse:down", hideBottomItem);
    canvas.on("object:moving", hideBottomItemStrict);
    return () => {
      canvas.off("mouse:down", hideBottomItem);
      canvas.off("object:moving", hideBottomItemStrict);
    };
  }, [canvas, activeTextObjs]);

  useEffect(() => {
    if (!canvas) return;
    if (!bottomItem) return;
    if (activeObjs.length === 0) return;
    if (bottomItem.kind !== "text") {
      setBottomItem(undefined);
    }
    if (activeObjs[0] instanceof fabric.IText) {
      popover.hidePopover();
    } else {
      setBottomItem(undefined);
    }
  }, [canvas, activeObjs, popover]);

  function updateBottomNavItem(item: BottomNavItem) {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.IText) {
        obj.exitEditing();
        obj.editable = false;
      }
    });
    if (item.kind === "text") {
      if (activeTextObjs.length === 1) {
        activeTextObjs[0].exitEditing();
      } else {
        const obj = toolbox.newTextbox();
        obj.editable = false;
        canvas.add(obj);
        canvas.setActiveObject(obj);
      }
    } else {
      canvas.discardActiveObject();
    }
    canvas.requestRenderAll();
    setTopItem(undefined);
    setBottomItem(item);
    popover.hidePopover();
  }

  function updateTopNavItem(item: TopNavItem) {
    setTopItem(item);
    setBottomItem(undefined);
  }

  function closeDrawer() {
    if (!canvas) return;
    setBottomItem(undefined);
    canvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.IText) {
        obj.editable = true;
      }
    });
  }

  function closeModal() {
    setTopItem(undefined);
  }

  return (
    <>
      <nav className={cs.nav}>
        {topItems.map(item => (
          <NavItem
            key={item.kind}
            icon={item.icon}
            kind={item.kind}
            active={topItem && topItem.kind === item.kind}
            onClick={() => updateTopNavItem(item)}
          >
            {item.label}
          </NavItem>
        ))}
        <div className={cs.separator} />
        {bottomItems.map(item => (
          <NavItem
            key={item.kind}
            icon={item.icon}
            kind={item.kind}
            active={bottomItem && bottomItem.kind === item.kind}
            onClick={() => updateBottomNavItem(item)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>
      <aside className={cn(cs.drawerContainer, {[cs.visible]: bottomItem})}>
        <div className={cs.drawer}>
          <button className={cs.drawerCloseTop} onClick={closeDrawer}>
            <IconClose className={cs.drawerCloseTopIcon} />
          </button>
          {bottomItem && <bottomItem.drawer onClose={closeDrawer} />}
        </div>
        <button className={cs.drawerCloseBottom} onClick={closeDrawer}>
          Fermer
        </button>
      </aside>
      <aside className={cn(cs.modalContainer, {[cs.visible]: topItem})}>
        <div className={cs.modal}>
          <button className={cs.modalCloseTop} onClick={closeModal}>
            <IconClose className={cs.modalCloseTopIcon} />
          </button>
          {topItem && <topItem.modal onClose={closeModal} />}
        </div>
      </aside>
    </>
  );
};

export default Nav;
