/**
 * Client-safe SSE-over-fetch reader.  Lets a POST endpoint stream Server-Sent
 * Events (EventSource only supports GET).  Parses `event:` / `data:` frames and
 * invokes `onEvent` for each.
 */
export interface StreamEvent {
  event: string;
  data: unknown;
}

export async function postSSE(
  url: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json?.error) message = json.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseFrame(frame);
      if (parsed) onEvent(parsed);
      boundary = buffer.indexOf("\n\n");
    }
  }

  // Flush any trailing multibyte sequence, then process a final unterminated frame.
  buffer += decoder.decode();
  const trailing = parseFrame(buffer);
  if (trailing) onEvent(trailing);
}

function parseFrame(raw: string): StreamEvent | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let event = "message";
  const dataLines: string[] = [];
  for (const line of trimmed.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;

  const dataString = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(dataString) };
  } catch {
    return { event, data: dataString };
  }
}
