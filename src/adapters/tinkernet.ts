import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import { ApiNotFound, CurrencyNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";

const DEST_WEIGHT = "5000000000";

export const tinkernetRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "basilisk",
    token: "TNKR",
    xcm: {
      fee: { token: "TNKR", amount: "13554386430" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

const tinkernetTokensConfig: Record<string, BasicToken> = {
  TNKR: { name: "TNKR", symbol: "TNKR", decimals: 12, ed: "1000000000" },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api,
        path: "derive.balances.all",
        params: [address],
      }),
  };
};

class TinkernetBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token !== this.nativeToken) {
      throw new CurrencyNotFound(token);
    }

    return storage.observable.pipe(
      map((data) => ({
        free: FN.fromInner(data.freeBalance.toString(), this.decimals),
        locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
        reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
        available: FN.fromInner(
          data.availableBalance.toString(),
          this.decimals
        ),
      }))
    );
  }
}

class TinkernetBaseAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: TinkernetBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new TinkernetBalanceAdapter({
      chain,
      api,
      tokens: tinkernetTokensConfig,
    });
  }

  public subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return this.balanceAdapter.subscribeBalance(token, address);
  }

  public subscribeMaxInput(
    token: string,
    address: string,
    to: ChainName
  ): Observable<FN> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return combineLatest({
      txFee: this.estimateTxFee({
        amount: FN.ZERO,
        to,
        token,
        address,
        signer: address,
      }),
      balance: this.balanceAdapter
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const tokenMeta = this.balanceAdapter?.getToken(token);
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, tokenMeta?.decimals).mul(
          new FN(feeFactor)
        );

        // always minus ed
        return balance
          .minus(fee)
          .minus(FN.fromInner(tokenMeta?.ed || "0", tokenMeta?.decimals));
      })
    );
  }

  public createTx(
    params: CrossChainTransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    return this.api.tx.xTokens.transfer(
      "0",
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: toChain.paraChainId },
              { AccountId32: { id: accountId, network: "Any" } },
            ],
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getDestWeight(token, to)!.toString()
    );
  }
}

export class TinkernetAdapter extends TinkernetBaseAdapter {
  constructor() {
    super(chains.tinkernet, tinkernetRoutersConfig, tinkernetTokensConfig);
  }
}