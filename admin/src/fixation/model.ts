export class FixationCondition {
  id: number = 0;
  shapeId: number = 0;
  areaMin: number = 0;
  areaMax: number = 0;
  paddingH: number = 0;
  paddingV: number = 0;
  posTl: boolean = false;
  posTc: boolean = false;
  posTr: boolean = false;
  posCl: boolean = false;
  posCr: boolean = false;
  posBl: boolean = false;
  posBc: boolean = false;
  posBr: boolean = false;

  constructor(shapeId: number) {
    this.shapeId = shapeId
  }
}

export class Fixation {
  id: number = 0;
  name: string = "";
  previewUrl: string = "";
  iconUrl: string = "";
  videoUrl: string | null = null;
  price: number = 0;
  diameter: number = 0;
  drillDiameter: number = 0;
  conditions: FixationCondition[] = [];
}

export default Fixation;
