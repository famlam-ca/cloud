export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./server/workers/provision-worker")
    await import("./server/workers/delete-instance-worker")
    await import("./server/workers/firewall-sync-worker")
    await import("./server/workers/power-action-worker")
    await import("./server/workers/cleanup-activity-worker")
  }
}
