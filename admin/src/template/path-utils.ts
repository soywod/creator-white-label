import base64 from "base-64";

import {Folder, isFolder} from "../_shared/folder";
import Template from "./model";

export function encodePath(folders: Array<Folder<Template>>): string {
  return base64.encode(folders.map(f => f.id).join(","));
}

export function decodePath(templatesTree: Folder<Template>, encodedPath: string | null): Array<Folder<Template>> {
  if (!encodedPath) return [templatesTree];
  const [path] = base64
    .decode(encodedPath)
    .split(",")
    .reduce(
      ([path, folders], id): [Array<Folder<Template>>, Array<Folder<Template>>] => {
        const matchingFolder = folders.find(f => f.id === Number(id));
        if (matchingFolder) {
          const matchingSubfolders = matchingFolder.children.reduce(
            (folders, node) => (isFolder(node) ? [...folders, node.folder] : folders),
            [] as Array<Folder<Template>>,
          );
          return [[...path, matchingFolder], matchingSubfolders];
        } else {
          return [path, folders];
        }
      },
      [[], [templatesTree]] as [Array<Folder<Template>>, Array<Folder<Template>>],
    );
  return path;
}
