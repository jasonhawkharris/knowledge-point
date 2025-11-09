<script>
  import { createEventDispatcher } from 'svelte'

  export let node = null
  export let selectedFiles = new Set()
  export let level = 0

  const dispatch = createEventDispatcher()

  let expanded = level === 0

  function toggleExpand() {
    if (node.isDirectory) {
      expanded = !expanded
    }
  }

  function handleClick() {
    dispatch('select', { path: node.path, isDirectory: node.isDirectory })
  }
</script>

<div class="tree-item" style="padding-left: {level * 16}px">
  <div class="item-content" on:click={toggleExpand}>
    {#if node.isDirectory}
      <span class="toggle">{expanded ? '▼' : '▶'}</span>
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="name">{node.name}</span>
    {:else}
      <span class="toggle" />
      <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
      <label class="file-label">
        <input type="checkbox" checked={selectedFiles.has(node.path)} on:change={handleClick} />
        <span class="name">{node.name}</span>
      </label>
    {/if}
  </div>

  {#if node.isDirectory && expanded && node.children}
    <div class="children">
      {#each node.children as child (child.path)}
        <svelte:self node={child} {selectedFiles} level={level + 1} on:select />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-item {
    user-select: none;
  }

  .item-content {
    display: flex;
    align-items: center;
    padding: 6px 4px;
    cursor: pointer;
    border-radius: 5px;
    transition: background 0.15s;
  }

  .item-content:hover {
    background: #f1f5f9;
  }

  .toggle {
    display: inline-block;
    width: 14px;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
    flex-shrink: 0;
  }

  .folder-icon,
  .file-icon {
    width: 16px;
    height: 16px;
    margin: 0 6px;
    flex-shrink: 0;
    color: #0f766e;
  }

  .file-icon {
    color: #64748b;
  }

  .name {
    font-size: 12px;
    color: #0f172a;
    font-weight: 500;
  }

  .file-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    flex: 1;
  }

  input[type='checkbox'] {
    cursor: pointer;
    accent-color: #0f766e;
    width: 16px;
    height: 16px;
  }

  .children {
    margin-top: 1px;
  }
</style>
