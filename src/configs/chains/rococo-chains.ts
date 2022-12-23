import { ChainType } from "src/types";

const typeSubstrate: ChainType = "substrate";

export const rococoChains = {
  rococo: {
    id: "rococo",
    display: "Rococo",
    type: typeSubstrate,
    icon: "",
    paraChainId: -1,
    ss58Prefix: 42,
  },
};
