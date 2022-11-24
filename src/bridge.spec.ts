
import { firstValueFrom } from 'rxjs';

import { ApiProvider } from './api-provider';
import { BaseCrossChainAdapter } from './base-chain-adapter';
import { KusamaAdapter, PolkadotAdapter, RococoAdapter } from './adapters/polkadot';
import { ChainName } from './configs';
import { Bridge } from './index';
import { AcalaAdapter, KaruraAdapter } from './adapters/acala';
import { FN } from './types';
import { BasiliskAdapter } from './adapters/hydradx';
import Keyring from '@polkadot/keyring';

const sendAndWait = (from, tx, nonce = -1) =>
  new Promise(async (resolve, reject) => {
    try {
      console.log("signing and sending");
      await tx.signAndSend(from, {nonce}, (receipt) => {
        console.log("receipt", receipt);
        if (receipt.status.isInBlock) {
          resolve(receipt)
        }
      })
    } catch (e) {
      reject(e)
    }
  })

describe('Bridge sdk usage', () => {
  jest.setTimeout(40000);

  const provider = new ApiProvider();

  const availableAdapters: Record<string, BaseCrossChainAdapter> = {
    // polkadot: new PolkadotAdapter(),
    // kusama: new KusamaAdapter(),
    rococo: new RococoAdapter(),
    // acala: new AcalaAdapter(),
    karura: new KaruraAdapter(),
    // statemine: new StatemineAdapter(),
    // altair: new AltairAdapter(),
    // shiden: new ShidenAdapter(),
    // bifrost: new BifrostAdapter(),
    // calamari: new CalamariAdapter(),
    // shadow: new ShadowAdapter(),
    // crab: new CrabAdapter(),
    // integritee: new IntegriteeAdapter(),
    // quartz: new QuartzAdapter(),
    basilisk: new BasiliskAdapter(),
  };

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  test('1. bridge init should be ok', async () => {
    expect(bridge.router.getRouters().length).toBeGreaterThanOrEqual(Object.keys(availableAdapters).length);
    expect(bridge.router.getDestinationChains({from: 'karura'}).length).toBeGreaterThanOrEqual(1);
    expect(bridge.router.getAvailableTokens({from: 'karura', to: 'basilisk'}).length).toBeGreaterThanOrEqual(1);
  });

  test('2. connect fromChain should be ok', async () => {
    const chains = Object.keys(availableAdapters) as ChainName[];

    expect(provider.getApi(chains[1])).toEqual(undefined); // karura
    expect(provider.getApi(chains[2])).toEqual(undefined); // basilisk
  
    // connect all adapters
    const connected = await firstValueFrom(provider.connectFromChain(chains, {
      karura: ['wss://karura-rococo-rpc.aca-staging.network/ws'],
      basilisk: ['wss://basilisk-rococo-rpc.play.hydration.cloud'],
      rococo: ['wss://rococo-rpc.polkadot.io']
    }));
    // and set apiProvider for each adapter
    await Promise.all(chains.map((chain) => availableAdapters[chain].setApi(provider.getApi(chain))));

    expect(connected.length).toEqual(chains.length);

    // expect(connected[1]).toEqual(chains[1]);
    // expect(connected[2]).toEqual(chains[2]);

    expect(provider.getApi("karura")).toBeDefined();
    expect(provider.getApi("basilisk")).toBeDefined();

    expect((await firstValueFrom(provider.getApi("karura").rpc.system.chain())).toLowerCase()).toContain("karura");
    expect((await firstValueFrom(provider.getApi("basilisk").rpc.system.chain())).toLowerCase()).toContain("basilisk");

    setTimeout(async () => {
      expect((await provider.getApiPromise("karura").rpc.system.chain()).toLowerCase()).toContain("karura");
      expect((await provider.getApiPromise("basilisk").rpc.system.chain()).toLowerCase()).toContain("basilisk");
    }, 1000);
  });

  test('3. token balance query & create tx should be ok', async () => {
    const chain: ChainName = 'karura';
    const toChain: ChainName = 'basilisk';
    const token = 'KUSD';
    
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const mnemonic = "patrol prevent rhythm predict suggest surprise menu spy budget palm lonely cloth";
    const pair = keyring.addFromUri(mnemonic, { name: 'cross chain test' }, 'ed25519');

    const balance = await firstValueFrom(availableAdapters[chain].subscribeTokenBalance(token, pair.address));

    expect(balance.free.toNumber()).toBeGreaterThanOrEqual(0);
    expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);

    const inputConfig = await firstValueFrom(availableAdapters[chain].subscribeInputConfigs({to: toChain, token, address:pair.address, signer: pair.address}));

    expect(BigInt(inputConfig.estimateFee)).toBeGreaterThanOrEqual(BigInt(0));
    expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
    expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

    const tx = availableAdapters[chain].createTx({to: toChain, token, amount: FN.fromInner('10000000000', 10), address:pair.address, signer: pair.address});

    expect(tx.args.length).toBeGreaterThan(1);

    const receipt = await sendAndWait(pair, tx);
    console.log(receipt);
  });
});
