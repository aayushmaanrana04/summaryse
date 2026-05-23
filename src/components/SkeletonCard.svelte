<script>
</script>

<div class="skeleton-card">
  <div class="skeleton-header">
    <div class="skeleton-line skeleton-title"></div>
  </div>

  <div class="skeleton-body">
    <div class="skeleton-line skeleton-text"></div>
    <div class="skeleton-line skeleton-text"></div>
    <div class="skeleton-line skeleton-text skeleton-short"></div>
  </div>
</div>

<style>
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    animation: fadeInSkeleton 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .skeleton-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-line {
    height: 12px;
    background: linear-gradient(
      90deg,
      rgba(30, 41, 59, 0.08) 0%,
      rgba(30, 41, 59, 0.12) 50%,
      rgba(30, 41, 59, 0.08) 100%
    );
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeletonWave 1.5s infinite;
  }

  .skeleton-title {
    width: 60%;
    height: 14px;
  }

  .skeleton-text {
    width: 100%;
  }

  .skeleton-short {
    width: 75%;
  }

  @keyframes skeletonWave {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @keyframes fadeInSkeleton {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
