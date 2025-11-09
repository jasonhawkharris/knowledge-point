<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let apiKey = ''
  let error = ''

  function handleSubmit() {
    if (!apiKey.trim()) {
      error = 'API key is required'
      return
    }

    dispatch('submit', apiKey)
    apiKey = ''
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }
</script>

<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2>Configure OpenAI API Key</h2>
      <p>Enter your OpenAI API key to get started</p>
    </div>

    <div class="modal-content">
      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="form-group">
        <label for="api-key">API Key</label>
        <input
          id="api-key"
          type="password"
          bind:value={apiKey}
          on:keydown={handleKeydown}
          placeholder="sk-..."
          autofocus
        />
        <p class="help-text">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank"
            >OpenAI's API Keys page</a
          >
        </p>
      </div>
    </div>

    <div class="modal-footer">
      <button on:click={handleSubmit} class="primary">Continue</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 400px;
    overflow: hidden;
  }

  .modal-header {
    padding: 24px;
    background: linear-gradient(135deg, #0f766e 0%, #14534d 100%);
    color: #ffffff;
  }

  .modal-header h2 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .modal-header p {
    font-size: 13px;
    opacity: 0.9;
  }

  .modal-content {
    padding: 24px;
  }

  .error {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-bottom: 16px;
    border: 1px solid #fecaca;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'Courier New', monospace;
    background: #f8fafc;
    color: #0f172a;
    transition: border-color 0.2s;
  }

  input:focus {
    border-color: #0f766e;
    background: #ffffff;
    outline: none;
  }

  .help-text {
    font-size: 11px;
    color: #64748b;
    margin-top: 8px;
    line-height: 1.4;
  }

  .help-text a {
    color: #0f766e;
    text-decoration: none;
    font-weight: 600;
  }

  .help-text a:hover {
    text-decoration: underline;
  }

  .modal-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  button {
    padding: 10px 20px;
  }

  button.primary {
    background: #0f766e;
  }

  button.primary:hover:not(:disabled) {
    background: #115e59;
  }
</style>
