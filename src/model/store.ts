import { writable } from "svelte/store";
import { getFeiertage, scoreAll } from "./feiertage";
import type { Day } from "./model";
import { Params, synchronizeFromUrlToParams } from "./router";

//reinitialize once with exact params
export let params: Params = synchronizeFromUrlToParams();

export const computedSortedResults = writable([] as Day[]);
export const bundeslaender = writable([params.bundesland] as string[]);
export const selectedYear = writable(params.jahr);
export const previousYear = writable(params.jahr);
export const selectedBundesland = writable(params.bundesland);
export const previousBundesland = writable(params.bundesland);

// we execute the function once as fire and forget to initialize variables
computeRemoteDataForYear();
// whenever hash is changed, rerun computation
window.addEventListener(
  "hashchange",
  () => {
    params = synchronizeFromUrlToParams();
    computeRemoteDataForYear();
  },
  false
);

export async function computeRemoteDataForYear(): Promise<any> {
  const year: number = params.jahr;
  let existing = await getFeiertage(year);
  console.log({ existing });
  let bls = Object.keys(existing);
  console.log({ bls });
  bundeslaender.set(bls);
  scoreAll(year, existing, params);
  return existing;
}
