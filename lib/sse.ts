import { getErrorMessage } from "./errors";

/** Server-Sent-Events helper for Next.js route handlers. */
export interface SSEMessage {
  event?: string;
  data: unknown;
}

/**
 * Wrap an async producer in a streaming Response.  The producer is handed a
 * `send` function; any thrown error is emitted as an `error` event so the
 * client always learns why a stream ended.  `send` is a no-op after the client
 * disconnects, so a dropped connection never crashes the server.
 */
export function sseStream(
  producer: (send: (message: SSEMessage) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (message: SSEMessage) => {
        if (closed) return;
        const frame =
          (message.event ? `event: ${message.event}\n` : "") +
          `data: ${JSON.stringify(message.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(frame));
        } catch {
          closed = true;
        }
      };

      try {
        await producer(send);
      } catch (error) {
        send({ event: "error", data: { message: getErrorMessage(error) } });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
