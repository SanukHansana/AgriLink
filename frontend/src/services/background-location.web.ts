export async function backgroundSharingJob(): Promise<string | null> { return null; }
export async function stopBackgroundSharing() {}
export async function startBackgroundSharing(_jobId: string) { throw new Error('Browsers support foreground location sharing. Use a native development or production build for background tracking.'); }
