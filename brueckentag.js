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


function getFreeDayBlock(feiertage, params, dayInYearToStart, lengthOfNewBlock) {

    console.log('TODO: actually implement this method');
    return {
        firstFreeDay: 123,
        lastFreeDay: 123,
        daysAlreadyFree: 24
    }
}


function getDateFromDayOfYear(params, dayInYear) {
    const date = new Date(params.jahr, 0); // initialize a date in `year-01-01`
    return new Date(date.setDate(dayInYear)); // add the number of days
}


const Computer = Vue.component('computer-tag', {
    template: `<div>
        <div>params: {{JSON.stringify(getParams())}} </div>
        <div><router-link :to="{ name: 'comp', params: urlify(getParams()) }">A link to this very page</router-link></div>
        <div><button v-on:click="startScoreClicked()">Begin scoring process</button>  ( {{progressCurrent}} / {{progressTotal}} )</div>
        <ul>
            <li v-for="score in computedSortedResults" v-bind:class="{ highestscore: score.score >= 4.0 , highscore: score.score >= 3.0 , mediumscore: score.score > 2.0 , lowscore: score.score <= 2.0  }" v-if="score.score > 1.8 || showLowScore">
                {{ JSON.stringify(score) }}
            </li>
        </ul>
    </div>`,
    data: function () {
        return {
            progressTotal: 1, //how many day combinations to score
            progressCurrent: 1, //how many are already scored
            computedSortedResults: [], //the finished scored results, sorted descendingly
            showLowScore: false, //score <= 1.8 will not be shown by default (to keep DOM small)
        };
    },
    methods: {
        getParams: function () {
            const curYear = (new Date()).getFullYear();
            const selectedYear = orElseNum(this.$route.params.jahr, curYear)
            return {
                jahr: selectedYear,
                reichweite: orElseNum(this.$route.params.tagereichweite, 10),
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
            this.progressCurrent = 0;
            const totalDays = getDaysInYear(params.jahr);
            for (let d = 0; d < totalDays; d++) {
                for (let r = 1; r <= params.reichweite; r++) {
                    if (d + r <= totalDays) {
                        //TODO: push as sorted list
                        const freeBlock = getFreeDayBlock(feiertage, params, d, r);
                        const firstFreeDay = freeBlock.firstFreeDay;
                        const lastFreeDay = freeBlock.lastFreeDay;
                        const freieTage = freeBlock.lastFreeDay - freeBlock.firstFreeDay + 1;
                        const brueckentage = freieTage - freeBlock.daysAlreadyFree //decrease by already free days;
                        this.computedSortedResults.push({
                            seedTag: getDateFromDayOfYear(params, d),
                            ersterTag: getDateFromDayOfYear(params, firstFreeDay),
                            letzterTag: getDateFromDayOfYear(params, lastFreeDay),
                            reichweite: r,
                            brueckenTage: brueckentage,
                            freieTage: freieTage,
                            score: freieTage / brueckentage
                        });

                        this.progressCurrent += 1;
                    }
                }
            }
            console.log('done scoring');
        }
    },
    watch: {
        $route(to, from) {
            console.log('route switched:');
            console.log(from);
            console.log(to);
        }
    }
});

const routes = [
    { path: '/comp/j/:jahr/b/:bundesland/r/:reichweite/w/:wochenende/u/:urlaub', name: 'comp', component: Computer },
    { path: '*', component: Computer }
]

const router = new VueRouter({
    routes // short for `routes: routes`
})

const app = new Vue({
    router
}).$mount('#app')
