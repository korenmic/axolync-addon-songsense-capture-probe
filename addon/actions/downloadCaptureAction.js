import { getCaptureSessionState } from '../runtime/captureSessionStore.js';
import { encodeCaptureAsWav } from '../runtime/wavExport.js';
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

export async function downloadCaptureAction(_input = {}, context = {}) {
  context.throwIfCancelled?.();
  const captureState = getCaptureSessionState(resolveAddonIdentity(context));
  const summary = await persistCaptureSummarySnapshot(context, captureState);

  if (!captureState) {
    const outcome = {
      actionId: context.actionId ?? 'download_capture',
      status: 'no-capture',
      reason: 'no-capture',
      summary,
    };
    await persistCaptureActionDiagnostic(context, outcome);
    return outcome;
  }

  const encoded = encodeCaptureAsWav(captureState);
  if (typeof context.saveBytesAsDownload !== 'function') {
    const diagnostic = {
      actionId: context.actionId ?? 'download_capture',
      status: 'failed',
      reason: 'missing-download-capability',
      summary,
      fileName: encoded.fileName,
      mimeType: encoded.mimeType,
    };
    await persistCaptureActionDiagnostic(context, diagnostic);
    throw new Error('AddonActionContext does not expose saveBytesAsDownload on this host.');
  }

  const saveResult = await context.saveBytesAsDownload(encoded.fileName, encoded.mimeType, encoded.bytes);
  const outcome = {
    actionId: context.actionId ?? 'download_capture',
    status: 'downloaded',
    fileName: encoded.fileName,
    mimeType: encoded.mimeType,
    durationMs: encoded.durationMs,
    summary,
    saveResult: saveResult ?? null,
  };
  await persistCaptureActionDiagnostic(context, outcome);
  return outcome;
}
