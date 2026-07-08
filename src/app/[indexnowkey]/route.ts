import { indexNowKey } from "@/lib/indexnow";

/**
 * Serves the IndexNow verification file at /{INDEXNOW_KEY}.txt. Defined routes
 * (/prompts, /about, sitemap, robots, llms.txt) take precedence over this
 * root dynamic segment, so it only ever answers the key file or a 404.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ indexnowkey: string }> },
): Promise<Response> {
  const { indexnowkey } = await params;
  const key = indexNowKey();
  if (key && indexnowkey === `${key}.txt`) {
    return new Response(key, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
    });
  }
  return new Response("Not found", { status: 404 });
}
