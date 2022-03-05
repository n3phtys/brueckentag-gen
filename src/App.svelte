<script lang="ts">
  import ConfigForm from "./components/ConfigForm.svelte";
  import DayList from "./components/DayList.svelte";
</script>

<main>
  <div id="app" class="container">
    <h1>Die besten Brückentage für das angegebene Jahr</h1>

    <ConfigForm />
    <DayList />
  </div>
</main>

<style>
</style>
