async function getFeiertage(year) {
    const feiertageCacheKey = 'BRUECKENTAG_GEN_FEIERTAGE_' + year;
    //check if has localStorage filled
    const cachedValue = localStorage.getItem(feiertageCacheKey);
    if (cachedValue != null) {
        //turn existing data into ready promise for async function usage
        console.log('reusing feiertage result from localStorage');
        return Promise.resolve(JSON.parse(cachedValue));
    } else {
        console.log('querying feiertage result from API feiertage-api.de');
        // else query HTTP 
        const urlApi = 'https://feiertage-api.de/api/?jahr=' + year;
        let response = await fetch(urlApi);
        let data = await response.json()
        localStorage.setItem(feiertageCacheKey, JSON.stringify(data));
        return data
    }
}



function orElseNum(firstValue, defaultValue) {
    if (firstValue == null) {
        return defaultValue;
    } else {
        return parseInt(firstValue);
    }
}
function orElseStr(firstValue, defaultValue) {
    if (firstValue == null) {
        return defaultValue;
    } else {
        return firstValue;
    }
}
function orElseNumArray(firstValue, defaultValue) {
    if (firstValue == null) {
        return defaultValue;
    } else {
        const arr = [];
        const input = firstValue.split(',');
        for (let i = 0; i < input.length; i++) {
            arr.push(parseInt(input[i]));
        }
        return arr;
    }
}
function orElseDateStringArray(firstValue, defaultValue) {
    if (firstValue == null) {
        return defaultValue;
    } else {
        return firstValue.split(',');
    }
}
function isLeapYear(year) {
    return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
}
function getDaysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function isWeekend(dayIdx, params) {
    const pivotDate = getDateFromDayOfYear(params, dayIdx);
    const weekDay = pivotDate.getDay();
    for (let weekendDayIndex = 0; weekendDayIndex < params.wochenende.length; weekendDayIndex++) {
        const weekendDay = params.wochenende[weekendDayIndex];
        if (weekendDay == weekDay) {
            return true;
        }
    }
    return false;
}
function isAlreadyBlocked(dayIdx, params) {
    const pivotDate = formatDate(getDateFromDayOfYear(params, dayIdx));
    for (let freierTagIndex = 0; freierTagIndex < params.urlaub.length; freierTagIndex++) {
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

function isFreeDay(dayInYear, feiertage, params) {
    return isWeekend(dayInYear, params) || isAlreadyBlocked(dayInYear, params) || isFeiertag(dayInYear, params, feiertage);
}

function getFreeDayBlock(feiertage, params, dayInYearToStart, lengthOfNewBlock) {
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
        daysAlreadyFree: (firstFreeDay < dayInYearToStart && isFreeDay(lastFreeDay, feiertage, params)) ? (freeDays) : (- 1)
    }
}

function translateDaysToNewYear(newYear, arrayOfOldIsoDateStrings) {
    const r = [];
    const delimiter = '-';
    console.log('translating urlaub to new year');
    console.log(arrayOfOldIsoDateStrings);
    for (let i = 0; i < arrayOfOldIsoDateStrings.length; i++) {
        const oldDate = arrayOfOldIsoDateStrings[i];
        console.log(oldDate);
        const arr = oldDate.split(delimiter);
        console.log(arr);
        const newDate = '' + newYear + delimiter + arr[1] + delimiter + arr[2];
        r.push(newDate);
    }
    console.log(r);
    console.log('done translating');
    return r;
}


function getDateFromDayOfYear(params, dayInYear) {
    const date = new Date(params.jahr, 0); // initialize a date in `year-01-01`
    return new Date(date.setDate(dayInYear)); // add the number of days
}

Vue.filter('round', function (value, decimals) {
    if (!value) {
        value = 0;
    }

    if (!decimals) {
        decimals = 0;
    }

    value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return value;
});

const Computer = Vue.component('computer-tag', {
    template: `
    <div>
        
        <div class="form-group">
             <label for="bundesland">Bundesland:</label>
            <select id="bundesland" class="form-control" v-model="selectedBundesland">
                <option disabled value="">Bitte ein Bundesland auswählen</option>
                <option v-for="bl in bundeslaender">{{bl}}</option>
            </select>
        </div>
        <div class="form-group">
            <label for="jahr">Jahr:</label>
            <input type="number" class="form-control" id="jahr" v-model="selectedYear">
        </div>
        <div v-if="selectedYear != previousYear || selectedBundesland != previousBundesland">
            <button type="submit" class="btn btn-default" v-on:click="saveChanges()">Jahr und Bundesland speichern</button>
        </div>

        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Datum Start</th>
                        <th scope="col">Datum Ende</th>
                        <th scope="col">Urlaubstage</th>
                        <th scope="col">Bewertung (Freie Tage / Urlaubstage)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="score in computedSortedResults" v-bind:class="{ highestscore: score.score >= 4.0 , highscore: score.score >= 3.0 , mediumscore: score.score > 2.0 , lowscore: score.score <= 2.0  }" v-if="score.score > 1.8 || showLowScore">
                        <th>{{score.ersterTag}}</th>
                        <td>{{score.letzterTag}}</td>
                        <td>{{score.brueckenTage}}</td>
                        <td>{{score.score | round(3)}}</td>
                    </tr>
                </tbody>
            </table>
        </div>

    </div>`,
    data: function () {
        return {
            progressTotal: 1, //how many day combinations to score
            progressCurrent: 1, //how many are already scored
            computedSortedResults: [], //the finished scored results, sorted descendingly
            showLowScore: false, //score <= 1.8 will not be shown by default (to keep DOM small),
            bundeslaender: [],
            selectedYear: this.getParams().jahr,
            selectedBundesland: this.getParams().bundesland,
            previousYear: this.getParams().jahr,
            previousBundesland: this.getParams().bundesland,
        };
    },
    methods: {
        getParams: function () {
            const curYear = (new Date()).getFullYear();
            const selectedYear = orElseNum(this.$route.params.jahr, curYear)
            return {
                jahr: selectedYear,
                reichweite: orElseNum(this.$route.params.tagereichweite, 20),
                bundesland: orElseStr(this.$route.params.bundesland, 'BW'),
                wochenende: orElseNumArray(this.$route.params.wochenende, [0, 6]),
                urlaub: orElseDateStringArray(this.$route.params.urlaub, ['' + selectedYear + '-12-24', '' + selectedYear + '-12-31'])
            };
        },
        urlify: function (obj) {
            const out = {};
            for (let k in obj) {
                out[k] = (obj[k] != null) ? ('' + obj[k]) : null;
            }
            console.log(out);
            return out;
        },
        loadBundeslaender: async function () {
            const feiertage = await getFeiertage(this.getParams().jahr);
            this.bundeslaender = [];
            for (let bl in feiertage) {
                this.bundeslaender.push(bl);
            }
        },
        saveChanges: function () {
            //change given url 
            const newParams = this.getParams();
            newParams.jahr = this.selectedYear;
            newParams.urlaub = translateDaysToNewYear(newParams.jahr, newParams.urlaub);
            newParams.bundesland = this.selectedBundesland;
            router.push({ name: 'comp', params: this.urlify(newParams) });
        },
        startScoreClicked: function () {
            const params = this.getParams();
            this.setProgressTotal(params);
            this.scoreAll(params);
        },
        setProgressTotal: function (params) {
            const n = params.reichweite;
            //subtract the last days because using them goes over the year (out of scope therefore)
            this.progressTotal = getDaysInYear(params.jahr) * n - (n * (n + 1) / 2);
        },
        scoreAll: async function (params) {
            let feiertage = await getFeiertage(params.jahr);
            const alreadyFround = {};
            this.computedSortedResults = [];

            console.log(getDateFromDayOfYear(params, 122));
            console.log(getFreeDayBlock(feiertage, params, 122, 2));

            this.progressCurrent = 0;
            const totalDays = getDaysInYear(params.jahr);
            for (let d = 1; d <= totalDays; d++) {
                for (let r = 1; r <= params.reichweite; r++) {
                    if (d + r <= totalDays) {
                        if (isFreeDay(d, feiertage, params)) {
                            this.progressCurrent += 1;
                            continue;
                        }
                        const freeBlock = getFreeDayBlock(feiertage, params, d, r);
                        const firstFreeDay = freeBlock.firstFreeDay;
                        const lastFreeDay = freeBlock.lastFreeDay;
                        const freieTage = freeBlock.lastFreeDay - freeBlock.firstFreeDay + 1;
                        const brueckentage = freieTage - freeBlock.daysAlreadyFree //decrease by already free days;
                        const sd = formatDate(getDateFromDayOfYear(params, d));
                        const ed = formatDate(getDateFromDayOfYear(params, firstFreeDay));
                        const ld = formatDate(getDateFromDayOfYear(params, lastFreeDay));
                        if (alreadyFround[ed] == null) {
                            alreadyFround[ed] = {};
                        }
                        if (alreadyFround[ed][ld] == null) {
                            this.computedSortedResults.push({
                                seedTag: sd,
                                ersterTag: ed,
                                letzterTag: ld,
                                reichweite: r,
                                anzahlFreieTage: freieTage,
                                brueckenTage: brueckentage,
                                freieTage: freieTage,
                                score: brueckentage > 0 ? freieTage / brueckentage : -1
                            });
                            alreadyFround[ed][ld] = true;
                        } else {
                            //console.log('skipping duplicate : ' + ed + " : " + ld);
                        }
                        this.progressCurrent += 1;
                    }
                }
            }

            this.computedSortedResults.sort(function (a, b) { return b.score - a.score });
            //console.log('done scoring');
        }
    },
    watch: {
        $route(to, from) {
            //console.log('route switched:');
            //console.log(from);
            //console.log(to);
            this.previousYear = this.getParams().jahr,
                this.previousBundesland = this.getParams().bundesland,
                this.startScoreClicked();
        }
    },
    mounted: function () {
        //console.log('was mounted');
        this.loadBundeslaender();
        this.startScoreClicked();
    }
});

const routes = [
    { path: '/comp/j/:jahr/b/:bundesland/r/:reichweite/w/:wochenende/u/:urlaub', name: 'comp', component: Computer },
    {
        path: '*', redirect: to => {
            const year = (new Date()).getFullYear();
            return `/comp/j/${year}/b/BW/r/20/w/0,6/u/${year}-12-24,${year}-12-31`
        }
    }
]

const router = new VueRouter({
    routes // short for `routes: routes`
})


const app = new Vue({
    router
}).$mount('#app')

