import { firstValueFrom } from "rxjs";

import { ApiProvider } from "./api-provider";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainName } from "./configs";
import { Bridge, FN } from "./index";
import { AcalaAdapter, KaruraAdapter } from "./adapters/acala";
import { BasiliskAdapter, HydradxAdapter } from "./adapters/hydradx";
import { TinkernetAdapter } from "./adapters/tinkernet";
import { StatemineAdapter, StatemintAdapter } from "./adapters/statemint";
import { RobonomicsAdapter } from "./adapters/robonomics";
import { PolkadotAdapter } from "./adapters/polkadot";
import { InterlayAdapter } from "./adapters/interlay";

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
};

describe("Bridge sdk usage", () => {
  jest.setTimeout(30000);

  const provider = new ApiProvider();

  const availableAdapters: Record<string, BaseCrossChainAdapter> = {
    polkadot: new PolkadotAdapter(),
    acala: new AcalaAdapter("wss://acala-polkadot.api.onfinality.io/public-ws"),
    hydradx: new HydradxAdapter(),
    karura: new KaruraAdapter(),
    basilisk: new BasiliskAdapter(),
    tinkernet: new TinkernetAdapter(),
    statemine: new StatemineAdapter(),
    statemint: new StatemintAdapter(),
    robonomics: new RobonomicsAdapter(),
    interlay: new InterlayAdapter(),
  };

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  test("1. bridge init should be ok", async () => {
    expect(bridge.router.getRouters().length).toBeGreaterThanOrEqual(
      Object.keys(availableAdapters).length
    );
    expect(
      bridge.router.getDestinationChains({ from: "acala" }).length
    ).toBeGreaterThanOrEqual(0);
    expect(
      bridge.router.getAvailableTokens({ from: "acala", to: "hydradx" }).length
    ).toBeGreaterThanOrEqual(0);

    const tokens = bridge.router.getAvailableTokens({
      from: "basilisk",
      to: "karura",
    });
    console.log(tokens);
  });

  test("2. connect fromChain should be ok", async () => {
    const chains = Object.keys(availableAdapters) as ChainName[];

    expect(provider.getApi(chains[0])).toEqual(undefined);
    expect(provider.getApi(chains[1])).toEqual(undefined);

    // connect all adapters
    const connected = await firstValueFrom(
      provider.connectFromChain(chains, CHAINS)
    );

    // and set apiProvider for each adapter
    await Promise.all(
      chains.map((chain) =>
        availableAdapters[chain].setApi(provider.getApi(chain))
      )
    );

    expect(connected.length).toEqual(chains.length);

    expect(connected[0]).toEqual(chains[0]);
    expect(connected[1]).toEqual(chains[1]);

    expect(provider.getApi(chains[0])).toBeDefined();
    expect(provider.getApi(chains[1])).toBeDefined();

    expect(
      (
        await firstValueFrom(provider.getApi(chains[0]).rpc.system.chain())
      ).toLowerCase()
    ).toEqual(chains[0]);
    expect(
      (
        await firstValueFrom(provider.getApi(chains[1]).rpc.system.chain())
      ).toLowerCase()
    ).toEqual(chains[1]);

    setTimeout(async () => {
      expect(
        (
          await provider.getApiPromise(chains[0]).rpc.system.chain()
        ).toLowerCase()
      ).toEqual(chains[0]);
      expect(
        (
          await provider.getApiPromise(chains[1]).rpc.system.chain()
        ).toLowerCase()
      ).toEqual(chains[1]);
    }, 1000);
  });

  test("3. token balance query & create tx should be ok", async () => {
    const chain: ChainName = "hydradx";
    const toChain: ChainName = "interlay";
    const token = "IBTC";
    const testAddress = "qM4C3MB4Mr6AkKcPwPSYs3yBrtj2rqftDNbv83i5YzkVJo9";

    const balance = await firstValueFrom(
      availableAdapters[chain].subscribeTokenBalance(token, testAddress)
    );

    console.log(balance.free.toNumber());

    expect(balance.free.toNumber()).toBeGreaterThanOrEqual(0);
    expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);

    const inputConfig = await firstValueFrom(
      availableAdapters[chain].subscribeInputConfigs({
        to: toChain,
        token,
        address: testAddress,
        signer: testAddress,
      })
    );

    console.log(JSON.stringify(inputConfig, null, 2));

    expect(BigInt(inputConfig.estimateFee)).toBeGreaterThanOrEqual(BigInt(0));
    expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
    expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(
      balance.available.toNumber()
    );

    const tx = availableAdapters[chain].createTx({
      to: toChain,
      token,
      amount: FN.fromInner("10000000000", 10),
      address: testAddress,
      signer: testAddress,
    });
    console.log(JSON.stringify(tx.toHuman(), null, 2));
    expect(tx.args.length).toBeGreaterThan(1);
  });
});
