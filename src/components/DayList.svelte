<script lang="ts">
  import { vacationOptions } from "../model/store";

  export let showLowScore = false; //score <= 1.8 will not be shown by default (to keep DOM small),
  export function round(decimals: number, value: number): string {
    if (!value) {
      value = 0;
    }

    if (!decimals) {
      decimals = 0;
    }

    return (
      "" + Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
    );
  }
</script>

<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th scope="col">Datum Start</th>
        <th scope="col">Datum Ende</th>
        <th scope="col">Freie Tage</th>
        <th scope="col">Urlaubstage</th>
        <th scope="col">Bewertung (Freie Tage / Urlaubstage)</th>
      </tr>
    </thead>
    <tbody>
      {#each $vacationOptions as score}
        {#if score.score > 1.8 || showLowScore}
          <tr
            class={score.score >= 4.0
              ? "highestscore"
              : score.score >= 3.0
              ? "highscore"
              : score.score > 2.0
              ? "mediumscore"
              : "lowscore"}
          >
            <th>{score.ersterTag}</th>
            <td>{score.letzterTag}</td>
            <td>{score.anzahlFreieTage}</td>
            <td>{score.brueckenTage}</td>
            <td>{round(3, score.score)}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  .lowscore {
    background-color: darkred;
    color: white;
  }

  .mediumscore {
    background-color: orange;
    color: white;
  }

  .highscore {
    background-color: forestgreen;
    color: white;
  }

  .highestscore {
    background-color: dodgerblue;
    color: white;
  }
</style>
