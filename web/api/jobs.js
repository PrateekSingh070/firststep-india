import { prepareFeed } from '../lib/feed.js';
const source =
  'https://firststep-india-jobs.wigglyfern512.chatgpt.site/api/jobs';
export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const upstream = await fetch(source, {
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok)
      return response
        .status(502)
        .json({ error: 'Job feed temporarily unavailable' });
    return response.status(200).json(prepareFeed(await upstream.json()));
  } catch {
    return response
      .status(502)
      .json({ error: 'Could not read a valid job feed. Please retry.' });
  }
}
