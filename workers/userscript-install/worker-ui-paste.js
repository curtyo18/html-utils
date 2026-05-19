// Paste this entire file into the Cloudflare Workers UI editor.
// No npm needed — lz-string is inlined below.

const LZString = (function() {
var f = String.fromCharCode;
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};
function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0; i<alphabet.length; i++) baseReverseDic[alphabet][alphabet.charAt(i)] = i;
  }
  return baseReverseDic[alphabet][character];
}
var LZString = {
  decompressFromEncodedURIComponent: function(input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },
  _decompress: function(length, resetValue, getNextValue) {
    var dictionary=[],next,enlargeIn=4,dictSize=4,numBits=3,entry="",result=[],i,w,bits,resb,maxpower,power,c,
        data={val:getNextValue(0),position:resetValue,index:1};
    for (i=0;i<3;i+=1) dictionary[i]=i;
    bits=0; maxpower=Math.pow(2,2); power=1;
    while (power!=maxpower) {
      resb=data.val&data.position; data.position>>=1;
      if (data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}
      bits|=(resb>0?1:0)*power; power<<=1;
    }
    switch (next=bits) {
      case 0: bits=0;maxpower=Math.pow(2,8);power=1;
        while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}
        c=f(bits);break;
      case 1: bits=0;maxpower=Math.pow(2,16);power=1;
        while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}
        c=f(bits);break;
      case 2: return "";
    }
    dictionary[3]=c; w=c; result.push(c);
    while (true) {
      if (data.index>length) return "";
      bits=0;maxpower=Math.pow(2,numBits);power=1;
      while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}
      switch (c=bits) {
        case 0: bits=0;maxpower=Math.pow(2,8);power=1;
          while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}
          dictionary[dictSize++]=f(bits);c=dictSize-1;enlargeIn--;break;
        case 1: bits=0;maxpower=Math.pow(2,16);power=1;
          while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}
          dictionary[dictSize++]=f(bits);c=dictSize-1;enlargeIn--;break;
        case 2: return result.join('');
      }
      if (enlargeIn==0){enlargeIn=Math.pow(2,numBits);numBits++;}
      entry = dictionary[c] ? dictionary[c] : (c===dictSize ? w+w.charAt(0) : null);
      if (!entry) return null;
      result.push(entry);
      dictionary[dictSize++]=w+entry.charAt(0);
      enlargeIn--;
      w=entry;
      if (enlargeIn==0){enlargeIn=Math.pow(2,numBits);numBits++;}
    }
  }
};
return LZString;
})();

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
