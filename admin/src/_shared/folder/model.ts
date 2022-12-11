export type TreeNode<T> = FolderTreeNode<T> | ItemTreeNode<T>;
export type FolderTreeNode<T> = {folder: Folder<T>};
export type ItemTreeNode<T> = {item: T};

export class Folder<T> {
  id: number = 0;
  parentId: number | null = null;
  name: string = "";
  category: string = "";
  children: TreeNode<T>[] = [];

  constructor(category: string, parentId: number | null = null, children: TreeNode<T>[] = []) {
    this.parentId = parentId;
    this.category = category;
    this.children = children;
  }
}

export function isFolder<T>(node?: TreeNode<T>): node is FolderTreeNode<T> {
  return node !== undefined && "folder" in node;
}

export default Folder;
