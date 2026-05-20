import LZString from 'lz-string';

async function decompressDeflate(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.endsWith('.user.js')) {
      return new Response('Not found', { status: 404 });
    }

    // ?z= is deflate-raw + base64url (new format)
    // ?s= is LZString (legacy format)
    const zParam = url.searchParams.get('z');
    const sParam = url.searchParams.get('s');

    if (!zParam && !sParam) {
      return new Response('Missing ?z= parameter', { status: 400 });
    }

    let script;
    try {
      if (zParam) {
        script = await decompressDeflate(zParam);
      } else {
        script = LZString.decompressFromEncodedURIComponent(sParam);
      }
    } catch {
      return new Response('Could not decompress script', { status: 400 });
    }

    if (!script) {
      return new Response('Could not decompress script', { status: 400 });
    }

    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' },
    });
  },
};
