<script>
  import { createEventDispatcher } from 'svelte'
  import TreeNode from './TreeNode.svelte'

  const dispatch = createEventDispatcher()

  let selectedFiles = new Set()
  let rootNode = null
  let loading = false

  async function handleBrowse() {
    loading = true
    try {
      console.log('window.electron:', window.electron)
      console.log('window:', Object.keys(window).slice(0, 20))
      
      if (!window.electron) {
        throw new Error('Electron API not available. Preload script failed to load.')
      }
      
      const tree = await window.electron.ipcRenderer.invoke('select-directory')
      if (tree) {
        rootNode = tree
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
      alert(`Error: ${error.message}`)
    } finally {
      loading = false
    }
  }

  function toggleFile(filePath, isDirectory) {
    if (isDirectory) return

    if (selectedFiles.has(filePath)) {
      selectedFiles.delete(filePath)
    } else {
      selectedFiles.add(filePath)
    }
    selectedFiles = selectedFiles
    dispatch('select', Array.from(selectedFiles))
  }
</script>

<div class="file-tree">
  <div class="tree-header">
    <h2>Files</h2>
    <button on:click={handleBrowse} disabled={loading}>{loading ? 'Loading...' : 'Browse'}</button>
  </div>
  <div class="tree-content">
    {#if rootNode}
      <TreeNode node={rootNode} on:select={(e) => toggleFile(e.detail.path, e.detail.isDirectory)} {selectedFiles} />
    {:else}
      <p class="placeholder">Select a folder to browse files</p>
    {/if}
  </div>
</div>

<style>
  .file-tree {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tree-header {
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
  }

  h2 {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .placeholder {
    color: #64748b;
    font-size: 12px;
    text-align: center;
    padding: 30px 12px;
    font-style: italic;
  }
</style>
