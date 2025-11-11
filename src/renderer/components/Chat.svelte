<script>
  import { onMount } from 'svelte'
  import ApiKeyModal from './ApiKeyModal.svelte'

  export let selectedFiles = []

  let messages = []
  let inputValue = ''
  let messagesContainer
  let loading = false
  let hasApiKey = false
  let showApiKeyModal = false
  let error = ''

  onMount(async () => {
    hasApiKey = await window.electron.ipcRenderer.invoke('has-api-key')
    if (!hasApiKey) {
      showApiKeyModal = true
    }
  })

  async function handleApiKeySubmit(event) {
    const apiKey = event.detail
    try {
      const result = await window.electron.ipcRenderer.invoke('set-api-key', apiKey)
      if (result.success) {
        hasApiKey = true
        showApiKeyModal = false
      } else {
        error = result.error
      }
    } catch (err) {
      error = err.message
    }
  }

  async function handleSend() {
    if (!inputValue.trim()) return
    if (!hasApiKey) {
      error = 'Please set your API key first'
      return
    }

    const userMessage = inputValue
    messages = [...messages, { role: 'user', content: userMessage }]
    inputValue = ''
    loading = true
    error = ''

    try {
      const result = await window.electron.ipcRenderer.invoke('send-message', {
        message: userMessage,
        selectedFiles,
        conversationHistory: messages.slice(0, -1),
      })

      if (result.success) {
        const assistantMessage = { role: 'assistant', content: result.response }
        messages = [...messages, assistantMessage]
        
        // Add tool call messages if any tools were called
        if (result.toolCalls && result.toolCalls.length > 0) {
          for (const toolCall of result.toolCalls) {
            messages = [...messages, {
              role: 'assistant',
              content: `🔧 Tool: ${toolCall.toolName}\nInput: ${JSON.stringify(toolCall.input, null, 2)}`
            }]
          }
        }
      } else {
        error = result.error
        messages = messages.slice(0, -1)
      }
    } catch (err) {
      error = err.message
      messages = messages.slice(0, -1)
    } finally {
      loading = false
      scrollToBottom()
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }, 0)
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }
</script>

<div class="chat">
  <div class="messages" bind:this={messagesContainer}>
    {#each messages as message}
      <div class={`message message-${message.role}`}>
        <div class="message-content">
          {message.content}
        </div>
      </div>
    {/each}
  </div>
  <div class="input-area">
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
    {#if selectedFiles.length > 0}
      <div class="context-pills">
        <span class="context-label">Context:</span>
        {#each selectedFiles as file}
          <span class="pill">{file}</span>
        {/each}
      </div>
    {/if}
    <div class="input-box">
      <textarea
        bind:value={inputValue}
        on:keydown={handleKeydown}
        placeholder="Ask a question about your files..."
        disabled={loading}
      />
      <button on:click={handleSend} disabled={!inputValue.trim() || loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </div>
</div>

{#if showApiKeyModal}
  <ApiKeyModal on:submit={handleApiKeySubmit} />
{/if}

<style>
  .chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #f8fafc;
  }

  .message {
    display: flex;
    margin-bottom: 2px;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-user {
    justify-content: flex-end;
  }

  .message-content {
    max-width: 70%;
    padding: 11px 16px;
    border-radius: 10px;
    word-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.5;
    font-size: 13px;
  }

  .message-user .message-content {
    background: #0f766e;
    color: #ffffff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 3px rgba(15, 118, 110, 0.2);
  }

  .message-assistant .message-content {
    background: #e2e8f0;
    color: #0f172a;
    border-bottom-left-radius: 4px;
  }

  .input-area {
    border-top: 1px solid #e2e8f0;
    padding: 16px;
    background: #ffffff;
  }

  .error-message {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-bottom: 12px;
    border: 1px solid #fecaca;
  }

  .context-pills {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
  }

  .context-label {
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .pill {
    background: #ecf8f7;
    color: #0f766e;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid #d0f4f1;
  }

  .input-box {
    display: flex;
    gap: 10px;
  }

  textarea {
    flex: 1;
    padding: 11px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    resize: none;
    height: 60px;
    max-height: 120px;
    background: #f8fafc;
    color: #0f172a;
    font-weight: 500;
    transition: border-color 0.2s;
  }

  textarea:focus {
    border-color: #0f766e;
    background: #ffffff;
  }

  textarea::placeholder {
    color: #94a3b8;
  }
</style>
