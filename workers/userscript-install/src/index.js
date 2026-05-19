import LZString from 'lz-string';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.endsWith('.user.js')) {
      return new Response('Not found', { status: 404 });
    }

    const compressed = url.searchParams.get('s');
    if (!compressed) {
      return new Response('Missing ?s= parameter', { status: 400 });
    }

    const script = LZString.decompressFromEncodedURIComponent(compressed);
    if (!script) {
      return new Response('Could not decompress script', { status: 400 });
    }

    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' },
    });
  },
};
