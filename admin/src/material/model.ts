export class Material {
  id: number = 0;
  appId: number = 0;
  title: string = "";
  description: string = "";
  preview: string = "";
  background: string = "";
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  weight?: number;
  fixedPrice?: number;
  surfacePrice?: number;
  manufacturingTime?: number;
}

export default Material;
