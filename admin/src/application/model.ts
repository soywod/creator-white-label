export type Application = {
  id: number;
  name: string;
  materialIds: number[];
  pictoIds: number[];
  userIds: number[];
};

export function emptyApp(): Application {
  return {
    id: 0,
    name: "",
    materialIds: [],
    pictoIds: [],
    userIds: [],
  };
}
