export async function clearCaptureAction(_input = {}, context = {}) {
  context.throwIfCancelled?.();
  return {
    status: 'not-ready',
    reason: 'clear-capture-not-implemented-yet',
  };
}
