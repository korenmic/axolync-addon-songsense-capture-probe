import { clearCaptureSessionState } from '../runtime/captureSessionStore.js';
import {
  persistCaptureActionDiagnostic,
  persistCaptureSummarySnapshot,
} from '../runtime/captureSummaryState.js';

function resolveAddonIdentity(context = {}) {
  return {
    addonId: context.addonId,
    addonVersion: context.addonVersion,
  };
}

export async function clearCaptureAction(_input = {}, context = {}) {
  context.throwIfCancelled?.();
  const cleared = clearCaptureSessionState(resolveAddonIdentity(context));
  const summary = await persistCaptureSummarySnapshot(context, null);
  const outcome = {
    actionId: context.actionId ?? 'clear_capture',
    status: cleared.status,
    reason: cleared.status,
    summary,
  };
  await persistCaptureActionDiagnostic(context, outcome);
  return outcome;
}
