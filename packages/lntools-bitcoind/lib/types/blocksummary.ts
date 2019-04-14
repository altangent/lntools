export interface BlockSummary {
  hash: string;
  confirmations: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: [string];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: string;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash: string;
}
