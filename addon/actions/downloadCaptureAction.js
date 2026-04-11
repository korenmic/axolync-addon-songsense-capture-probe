export async function downloadCaptureAction(_input = {}, context = {}) {
  context.throwIfCancelled?.();
  return {
    status: 'not-ready',
    reason: 'download-capture-not-implemented-yet',
  };
}
