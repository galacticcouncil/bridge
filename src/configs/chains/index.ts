import { Chain } from "../../types";
import { kusamaChains } from "./kusama-chains";
import { polkadotChains } from "./polkadot-chains";
import { rococoChains } from "./rococo-chains";

export const rawChains = {
  ...kusamaChains,
  ...polkadotChains,
  ...rococoChains,
};

export type ChainName = keyof typeof rawChains;

export const chains: Record<ChainName, Chain> = rawChains;
