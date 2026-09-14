(() => {
  const NativePeer = window.Peer;
  if (!NativePeer) return;

  // Keep the exact PeerJS ID. PeerJS allows dashes in the middle of an ID,
  // so changing/removing the room prefix can make the join code point to a
  // different peer than the host actually registered.
  function PeerFixed(id, options) {
    return id ? new NativePeer(String(id).trim(), options) : new NativePeer(options);
  }

  PeerFixed.prototype = NativePeer.prototype;
  PeerFixed.connect = NativePeer.connect;

  // Do not rewrite destination IDs: peer.connect() must receive the host's
  // exact peer.id.
  window.Peer = PeerFixed;
})();
