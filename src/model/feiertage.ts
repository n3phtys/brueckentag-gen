import type { Day } from "./model";
import type { Params } from "./router";

export async function getFeiertage(year): Promise<any> {
  const feiertageCacheKey = "BRUECKENTAG_GEN_FEIERTAGE_" + year;
  //check if has localStorage filled
  const cachedValue = localStorage.getItem(feiertageCacheKey);
  if (cachedValue != null) {
    //turn existing data into ready promise for async function usage
    console.log("reusing feiertage result from localStorage");
    return Promise.resolve(JSON.parse(cachedValue));
  } else {
    console.log("querying feiertage result from API feiertage-api.de");
    // else query HTTP
    const urlApi = "https://feiertage-api.de/api/?jahr=" + year;
    let response = await fetch(urlApi);
    let data = await response.json();
    localStorage.setItem(feiertageCacheKey, JSON.stringify(data));
    return data;
  }
}

export function scoreAll(feiertage: any, params: Params): Day[] {
  const alreadyFround = {};
  let results: Day[] = [];
  const start = new Date();
  const totalDays = getDaysInYear(params.jahr);
  for (let d = 1; d <= totalDays; d++) {
    for (let r = 1; r <= params.reichweite; r++) {
      if (d + r <= totalDays) {
        if (isFreeDay(d, feiertage, params)) {
          continue;
        }
        const freeBlock = getFreeDayBlock(feiertage, params, d, r);
        const firstFreeDay = freeBlock.firstFreeDay;
        const lastFreeDay = freeBlock.lastFreeDay;
        const freieTage = freeBlock.lastFreeDay - freeBlock.firstFreeDay + 1;
        const brueckentage = freieTage - freeBlock.daysAlreadyFree; //decrease by already free days;
        const sd = formatDate(getDateFromDayOfYear(params, d));
        const ed = formatDate(getDateFromDayOfYear(params, firstFreeDay));
        const ld = formatDate(getDateFromDayOfYear(params, lastFreeDay));
        if (alreadyFround[ed] == null) {
          alreadyFround[ed] = {};
        }
        if (alreadyFround[ed][ld] == null) {
          results.push({
            seedTag: sd,
            ersterTag: ed,
            letzterTag: ld,
            reichweite: r,
            anzahlFreieTage: freieTage,
            brueckenTage: brueckentage,
            freieTage: freieTage,
            score: brueckentage > 0 ? freieTage / brueckentage : -1,
          } as Day);
          alreadyFround[ed][ld] = true;
        } else {
        }
      }
    }
  }
  const output = results.sort(function (a, b) {
    return b.score - a.score;
  });
  console.log([
    "computation done after:",
    start.toString(),
    new Date().toString(),
    "items: " + output.length,
  ]);
  return output;
}
function getDaysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

function formatDate(date): string {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}
function isLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}
function isFreeDay(dayInYear, feiertage, params) {
  return (
    isWeekend(dayInYear, params) ||
    isAlreadyBlocked(dayInYear, params) ||
    isFeiertag(dayInYear, params, feiertage)
  );
}

function getFreeDayBlock(
  feiertage,
  params,
  dayInYearToStart,
  lengthOfNewBlock
) {
  let firstFreeDay = dayInYearToStart;
  let lastFreeDay = dayInYearToStart + lengthOfNewBlock - 1;
  for (let i = 1; i < 1000; i++) {
    const dayIdx = firstFreeDay - i;
    if (!isFreeDay(dayIdx, feiertage, params)) {
      firstFreeDay = dayIdx + 1;
      break;
    }
  }
  for (let i = 1; i < 1000; i++) {
    const dayIdx = lastFreeDay + i;
    if (!isFreeDay(dayIdx, feiertage, params)) {
      lastFreeDay = dayIdx - 1;
      break;
    }
  }
  let freeDays = 0;
  for (let i = firstFreeDay; i <= lastFreeDay; i++) {
    if (isFreeDay(i, feiertage, params)) {
      freeDays += 1;
    }
  }
  return {
    firstFreeDay: firstFreeDay,
    lastFreeDay: lastFreeDay,
    daysAlreadyFree:
      firstFreeDay < dayInYearToStart &&
      isFreeDay(lastFreeDay, feiertage, params)
        ? freeDays
        : -1,
  };
}

function isWeekend(dayIdx, params) {
  const pivotDate = getDateFromDayOfYear(params, dayIdx);
  const weekDay = pivotDate.getDay();
  for (
    let weekendDayIndex = 0;
    weekendDayIndex < params.wochenende.length;
    weekendDayIndex++
  ) {
    const weekendDay = params.wochenende[weekendDayIndex];
    if (weekendDay == weekDay) {
      return true;
    }
  }
  return false;
}
function isAlreadyBlocked(dayIdx, params) {
  const pivotDate = formatDate(getDateFromDayOfYear(params, dayIdx));
  for (
    let freierTagIndex = 0;
    freierTagIndex < params.urlaub.length;
    freierTagIndex++
  ) {
    const freierTag = params.urlaub[freierTagIndex];
    if (freierTag == pivotDate) {
      return true;
    }
  }
  return false;
}
function isFeiertag(dayIdx, params, feiertage) {
  const allFeiertage = feiertage[params.bundesland];
  const pivotDate = formatDate(getDateFromDayOfYear(params, dayIdx));
  for (let feiertagsName in allFeiertage) {
    if (allFeiertage[feiertagsName].datum == pivotDate) {
      return true;
    }
  }
  return false;
}
function getDateFromDayOfYear(params, dayInYear) {
  const date = new Date(params.jahr, 0); // initialize a date in `year-01-01`
  return new Date(date.setDate(dayInYear)); // add the number of days
}
