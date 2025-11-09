<script>
  import { onMount } from 'svelte'

  let appVersion = '0.1.0'

  onMount(async () => {
    if (window.electron) {
      appVersion = await window.electron.ipcRenderer.invoke('get-app-version')
    }
  })
</script>

<header>
  <div class="header-content">
    <h1>Knowledge Point</h1>
    <p class="version">v{appVersion}</p>
  </div>
</header>

<style>
  header {
    background: linear-gradient(135deg, #0f766e 0%, #14534d 100%);
    border-bottom: 1px solid #0d4f4a;
    padding: 18px 24px;
    box-shadow: 0 2px 8px rgba(15, 118, 110, 0.12);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.8px;
  }

  .version {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
</style>
