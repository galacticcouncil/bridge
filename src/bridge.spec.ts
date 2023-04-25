import { firstValueFrom } from "rxjs";

import { ApiProvider } from "./api-provider";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainId } from "./configs";
import { Bridge } from "./bridge";
import { FN } from "./types";
import { AcalaAdapter, KaruraAdapter } from "./adapters/acala";
import { BasiliskAdapter, HydradxAdapter } from "./adapters/hydradx";
import { TinkernetAdapter } from "./adapters/tinkernet";
import { StatemineAdapter, StatemintAdapter } from "./adapters/statemint";
import { RobonomicsAdapter } from "./adapters/robonomics";
import { PolkadotAdapter, KusamaAdapter } from "./adapters/polkadot";
import { InterlayAdapter } from "./adapters/interlay";
import { ZeitgeistAdapter } from "./adapters/zeitgeist";
import { AstarAdapter } from "./adapters/astar";

const CHAINS: Record<string, string[]> = {
  polkadot: ["wss://rpc.polkadot.io"],
  kusama: ["wss://kusama.api.onfinality.io/public-ws"],
  acala: ["wss://acala-polkadot.api.onfinality.io/public-ws"],
  karura: ["wss://karura.api.onfinality.io/public-ws"],
  hydradx: ["wss://rpc.hydradx.cloud"],
  basilisk: ["wss://rpc.basilisk.cloud"],
  tinkernet: ["wss://invarch-tinkernet.api.onfinality.io/public-ws"],
  statemine: ["wss://statemine.api.onfinality.io/public-ws"],
  statemint: ["wss://statemint.api.onfinality.io/public-ws"],
  interlay: ["wss://interlay.api.onfinality.io/public-ws"],
  zeitgeist: ["wss://zeitgeist.api.onfinality.io/public-ws"],
  astar: ["wss://astar.api.onfinality.io/public-ws"],
};

const FROM_CHAIN: ChainId = "astar";
const TO_CHAIN: ChainId = "hydradx";
const TOKEN: string = "ASTR";
const ADDRESS: string = "7MHE9BUBEWU88cEto6P1XNNb66foSwAZPKhfL8GHW9exnuH1";

describe("Bridge sdk usage", () => {
  jest.setTimeout(30000);

  const provider = new ApiProvider();

  const availableAdapters: Record<string, BaseCrossChainAdapter> = {
    polkadot: new PolkadotAdapter(),
    kusama: new KusamaAdapter(),
    acala: new AcalaAdapter("wss://acala.polkawallet.io"),
    karura: new KaruraAdapter(),
    hydradx: new HydradxAdapter(),
    basilisk: new BasiliskAdapter(),
    tinkernet: new TinkernetAdapter(),
    statemine: new StatemineAdapter(),
    statemint: new StatemintAdapter(),
    robonomics: new RobonomicsAdapter(),
    interlay: new InterlayAdapter(),
    zeitgeist: new ZeitgeistAdapter(),
    astar: new AstarAdapter()
  };

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  test("1. bridge init should be ok", async () => {
    expect(bridge.router.getRouters().length).toBeGreaterThanOrEqual(
      Object.keys(availableAdapters).length
    );
    expect(
      bridge.router.getDestinationChains({ from: FROM_CHAIN }).length
    ).toBeGreaterThanOrEqual(0);
    expect(
      bridge.router.getAvailableTokens({ from: FROM_CHAIN, to: TO_CHAIN })
        .length
    ).toBeGreaterThanOrEqual(0);

    const tokens = bridge.router.getAvailableTokens({
      from: FROM_CHAIN,
      to: TO_CHAIN,
    });
    console.log(
      `Available tokens from ${FROM_CHAIN} to ${TO_CHAIN}: ${tokens}`
    );
  });

  test("2. connect fromChain should be ok", async () => {
    const chains = Object.keys(availableAdapters).filter(
      (k) => k === FROM_CHAIN || k === TO_CHAIN
    ) as ChainId[];

    expect(provider.getApi(chains[0])).toEqual(undefined);
    expect(provider.getApi(chains[1])).toEqual(undefined);

    // connect all adapters
    const connected = await firstValueFrom(
      provider.connectFromChain(chains, CHAINS)
    );

    // and set apiProvider for each adapter
    await Promise.all(
      chains
        .filter((k) => k === FROM_CHAIN || k === TO_CHAIN)
        .map((chain) => availableAdapters[chain].init(provider.getApi(chain)))
    );

    expect(connected.length).toEqual(chains.length);
  });

  test("3. token balance query & create tx should be ok", async () => {
    const balance = await firstValueFrom(
      availableAdapters[FROM_CHAIN].subscribeTokenBalance(TOKEN, ADDRESS)
    );

    console.log(TOKEN + " Balance: " + balance.free.toNumber());

    expect(balance.free.toNumber()).toBeGreaterThanOrEqual(0);
    expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);

    const inputConfig = await firstValueFrom(
      availableAdapters[FROM_CHAIN].subscribeInputConfig({
        to: TO_CHAIN,
        token: TOKEN,
        address: ADDRESS,
        signer: ADDRESS,
      })
    );

    expect(BigInt(inputConfig.estimateFee)).toBeGreaterThanOrEqual(BigInt(0));
    expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
    expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(
      balance.available.toNumber()
    );

    const tx = availableAdapters[FROM_CHAIN].createTx({
      to: TO_CHAIN,
      token: TOKEN,
      amount: FN.fromInner("1000000000000", 12),
      address: ADDRESS,
      signer: ADDRESS,
    });
    console.log(JSON.stringify(tx.toHuman(), null, 2));
    console.log("Tx HEX: " + tx.toHex());
    expect(tx.args.length).toBeGreaterThan(1);
  });
});
