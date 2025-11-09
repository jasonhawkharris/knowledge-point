<script>
  import Header from '$components/Header.svelte'
  import FileTree from '$components/FileTree.svelte'
  import Chat from '$components/Chat.svelte'
  import './app.css'

  let selectedFiles = []

  function handleFileSelect(event) {
    selectedFiles = event.detail
  }
</script>

<div class="container">
  <Header />
  <div class="main">
    <div class="sidebar">
      <FileTree on:select={handleFileSelect} />
    </div>
    <div class="chat-area">
      <Chat {selectedFiles} />
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8fafc;
  }

  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 280px;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    background: #ffffff;
  }

  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
  }
</style>
