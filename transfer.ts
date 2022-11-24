
import { firstValueFrom } from 'rxjs';

import { ApiProvider } from './src/api-provider';
import { BaseCrossChainAdapter } from './src/base-chain-adapter';
import { KusamaAdapter, PolkadotAdapter, RococoAdapter } from './src/adapters/polkadot';
import { ChainName } from './src/configs';
import { Bridge } from './src/index';
import { AcalaAdapter, KaruraAdapter } from './src/adapters/acala';
import { FN } from './src/types';
import { BasiliskAdapter } from './src/adapters/hydradx';
import Keyring from '@polkadot/keyring';
import {cryptoWaitReady} from '@polkadot/util-crypto';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function main() {
  await cryptoWaitReady();
  console.log("start");

  const provider = new ApiProvider();

  const chain = 'rococo';
  const toChain = 'basilisk';
  const token = 'ROC';
  
  const keyring = new Keyring({ type: 'sr25519' });
  const mnemonic = "patrol prevent rhythm predict suggest surprise menu spy budget palm lonely cloth";
  const pair = keyring.addFromUri(mnemonic, { name: 'cross chain test' });

  const availableAdapters = {
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

  const chains = Object.keys(availableAdapters) as ChainName[];

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  const connected = await firstValueFrom(provider.connectFromChain(chains, {
    karura: ['wss://karura-rococo-rpc.aca-staging.network/ws'],
    basilisk: ['wss://basilisk-rococo-rpc.play.hydration.cloud'],
    rococo: ['wss://rococo-rpc.polkadot.io']
  }));
  // and set apiProvider for each adapter
  await Promise.all(chains.map((chain) => availableAdapters[chain].setApi(provider.getApi(chain))));

  const balance = await firstValueFrom(availableAdapters[chain].subscribeTokenBalance(token, pair.address));

  console.log("balance:", balance.free.toNumber());

  const tx = availableAdapters[chain].createTx({ to: toChain, token, amount: FN.fromInner('10000000000', 10), address: pair.address, signer: pair.address });

  const o = tx.signAndSend(pair);
  o.subscribe({
    next: receipt => {
      if (receipt.status.isInBlock) {
        console.log("inBlock!");
      }
    },
    error: err => console.error('Observer got an error: ', err),
    complete: () => console.log('Observer got a complete notification'),
  });
  // const res = await tx.signAndSend(pair);
  // console.log("res", res);
  console.log("waiting for callbacks...");
  await delay(30000);
  console.log("end");
}


main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
