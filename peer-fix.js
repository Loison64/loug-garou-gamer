(() => {
  const NativePeer = window.Peer;
  if (!NativePeer) return;

  const normalize = value => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/^LOUP64-/, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 50);

  function PeerFixed(id, options) {
    const cleanId = id ? normalize(id) : undefined;
    const peer = cleanId ? new NativePeer(cleanId, options) : new NativePeer(options);
    return peer;
  }

  PeerFixed.prototype = NativePeer.prototype;
  PeerFixed.connect = NativePeer.connect;

  const originalConnect = NativePeer.prototype.connect;
  NativePeer.prototype.connect = function (id, options) {
    return originalConnect.call(this, normalize(id), options);
  };

  window.Peer = PeerFixed;
})();
