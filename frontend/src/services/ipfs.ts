export const getIpfsUrl = (cid: string) => {
  if (!cid) return "";

  return `https://ipfs.io/ipfs/${cid}`;
};