/** A WebRTC connection alone does not establish that AI output is playing. */
export function liveReadiness(onReady: () => void) {
  let connected = false, accepted = false, generating = false, frame = false, finished = false;
  const check = () => {
    if (!finished && connected && accepted && generating && frame) { finished = true; onReady(); }
  };
  return {
    connected() { connected = true; check(); },
    garmentAccepted() { accepted = true; frame = false; },
    generationStarted() { generating = true; check(); },
    framePresented() { if (generating && accepted) frame = true; check(); },
    isPending() { return !finished; },
    cancel() { finished = true; },
  };
}

export async function encodeLiveGarment(blob: Blob): Promise<string> {
  // Prepare the image before minting a 30-second connection token.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare the outfit image.'));
    reader.onerror = () => reject(new Error('Could not read the outfit image.'));
    reader.readAsDataURL(blob);
  });
}

export function liveError(error: unknown) {
  const value = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : {};
  const code = typeof value.code === 'string' && /^[A-Z_]{3,60}$/.test(value.code) ? value.code : '';
  const raw = typeof value.message === 'string' ? value.message : '';
  const text = raw.toLowerCase();
  let message: string;
  if (text.includes('insufficient') || text.includes('credits') || text.includes('balance')) message = 'The studio’s Decart balance is unavailable. The studio owner needs to check Decart credits.';
  else if (code === 'TOKEN_EXPIRED') message = 'The connection token expired before AI could start. Please try again.';
  else if (code.includes('ICE') || code.includes('WEBSOCKET') || code.includes('TIMEOUT')) message = 'The live video connection could not start. Try another network, or turn off your VPN and try again.';
  else if (text.includes('capacity') || text.includes('session limit')) message = 'Decart is busy or another AI session is still closing. Please wait a moment before retrying.';
  else if (code === 'INVALID_API_KEY' || code === 'TOKEN_INVALID' || /unauthorized|permission denied|not allowed/.test(text)) message = 'Decart refused the live connection. The studio owner needs to check the server key and token permissions.';
  else message = raw || 'AI try-on could not start. Please try again.';
  // Provider errors can contain credential-bearing URLs. Never display those.
  message = message.replace(/(?:https?|wss?):\/\/\S+/gi, '[connection address]').replace(/(?:api_key|apiKey|token|authorization)\s*[=:]\s*[^\s&,]+/gi, '[credential removed]').slice(0, 400);
  return code ? `${message} (${code})` : message;
}
