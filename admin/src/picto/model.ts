export class Picto {
  id: number = 0;
  folderId: number | null = null;
  tags: string = "";
  url: string = "";

  constructor(folderId: number | null) {
    this.folderId = folderId;
  }
}

export default Picto;
