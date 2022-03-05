export interface Params {
  jahr: number;
  reichweite: number;
  wochenende: number[];
  urlaub: string[];
  bundesland: string;
}

export function synchronizeFromUrlToParams(): Params {
  const params = stringToParams(getHash());
  if (null == params) {
    writeHash(getDefaultRoute());
    return stringToParams(getHash())!!;
  } else {
    return params;
  }
}

export function synchronizeToUrlFromParams(params: Params) {
  writeHash(paramsToString(params));
}

function getDefaultRoute() {
  const year = new Date().getFullYear();
  return `/comp/j/${year}/b/BW/r/20/w/0,6/u/${year}-12-24,${year}-12-31`;
}

function paramsToString(p: Params) {
  return `/comp/j/${p.jahr}/b/${p.bundesland}/r/${p.reichweite}/w/${p.wochenende
    .map((x) => "" + x)
    .join(",")}/u/${p.urlaub.join(",")}`;
}

function stringToParams(str: string): Params | null {
  if (!str) {
    return null;
  }
  try {
    const path = str.split("/");
    return {
      jahr: parseInt(path[3]),
      reichweite: parseInt(path[7]),
      wochenende: path[9].split(",").map((x) => parseInt(x)),
      urlaub: path[11].split(","),
      bundesland: path[5],
    } as Params;
  } catch (e) {
    console.warn("Error: ", e);
    return null;
  }
}

function getHash(): string {
  return window.location.hash.slice(1);
}

function writeHash(value: string) {
  window.location.hash = value;
}
