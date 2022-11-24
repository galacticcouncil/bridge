
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
import { ApiRx } from '@polkadot/api';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function main() {
  await cryptoWaitReady();
  console.log("start");

  const provider = new ApiProvider();

  const chain = 'karura';
  const toChain = 'basilisk';
  const token = 'KUSD';
  
  const keyring = new Keyring({ type: 'sr25519' });
  const mnemonic = "patrol prevent rhythm predict suggest surprise menu spy budget palm lonely cloth";
//   subkey inspect --network karura "patrol prevent rhythm predict suggest surprise menu spy budget palm lonely cloth"
// Secret phrase `patrol prevent rhythm predict suggest surprise menu spy budget palm lonely cloth` is account:
//   Secret seed:      0x031f0f8eb05545295aec6475e8ce1316b1f5100198a7a630ad59ac58728068b4
//   Public key (hex): 0x2af3ee8f5c0618b5a227a0805e944f795ae2eb7abf2546a3b621ea0477b0642d
//   Account ID:       0x2af3ee8f5c0618b5a227a0805e944f795ae2eb7abf2546a3b621ea0477b0642d
//   SS58 Address:     pGbYS566bxxN9r7K8Tr9iPEvfJXA3Nz8XvEziJGHkWVATXZ
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
  console.log("from balance:", balance.free.toNumber());
  const toBalance = await firstValueFrom(availableAdapters[toChain].subscribeTokenBalance(token, pair.address));
  console.log("dest balance before:", toBalance.free.toNumber());

  const tx = availableAdapters[chain].createTx({ to: toChain, token, amount: FN.fromInner('1000000000000', 10), address: pair.address, signer: pair.address });

  const o = tx.signAndSend(pair);
  o.subscribe({
    next: async receipt => {
      const { status } = receipt;
      if (status.isInBlock) {
        console.log("inBlock!");
        const inBlock = status.asInBlock;
        // console.log(inBlock);
        const api = availableAdapters[chain].getApi();
        if (api && api instanceof ApiRx) {
          const apiAt = await api.at(inBlock);
          const allRecords = await firstValueFrom(apiAt.query.system.events());
          

          // const toBalance = await firstValueFrom(availableAdapters[toChain].subscribeTokenBalance(token, pair.address));
          // console.log("dest balance afterwards:", toBalance.free.toNumber());
        }
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
