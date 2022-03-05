<script lang="ts">
  import { synchronizeToUrlFromParams } from "../model/router";

  import {
    bundeslaender,
    previousBundesland,
    previousYear,
    params,
    selectedBundesland,
    selectedYear,
  } from "../model/store";

  export function handleFormSubmit(
    year: number,
    bundesland: string | null,
    e: any
  ) {
    previousYear.set(year);
    !!bundesland && previousBundesland.set(bundesland);
    params.jahr = year;
    params.urlaub = ["" + year + "-12-24", "" + year + "-12-31"];
    if (!!bundesland) {
      params.bundesland = bundesland;
    }
    synchronizeToUrlFromParams(params);
  }
</script>

<div class="form-group">
  <label for="bundesland">Bundesland:</label>
  <select class="form-control" id="bundesland" bind:value={$selectedBundesland}>
    <option disabled value="">Bitte ein Bundesland auswählen</option>
    {#each $bundeslaender as bl}
      <option value={bl}>{bl}</option>
    {/each}
  </select>
</div>
<div class="form-group">
  <label for="jahr">Jahr:</label>
  <input
    type="number"
    class="form-control"
    id="jahr"
    bind:value={$selectedYear}
    min="2016"
    max="2099"
    step="1"
  />
</div>
{#if $selectedYear != $previousYear || $selectedBundesland != $previousBundesland}
  <div>
    <button
      type="submit"
      class="btn btn-default"
      on:click={(e) => handleFormSubmit($selectedYear, $selectedBundesland, e)}
      >Jahr und Bundesland speichern</button
    >
  </div>
{/if}
