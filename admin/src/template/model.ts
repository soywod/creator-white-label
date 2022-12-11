export class Template {
  id: number = 0;
  folderId: number | null = null;
  name: string = "";
  tags: string = "";
  config: string = "";
  previewUrl: string = "";

  constructor(folderId: number | null) {
    this.folderId = folderId;
  }
}

export default Template;
