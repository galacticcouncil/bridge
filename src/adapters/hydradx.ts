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
import { isChainEqual } from "../utils/is-chain-equal";

const DEST_WEIGHT = "5000000000";

export const hydradxRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "469417452" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "926960000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "471820453" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "687004000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "0" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const hydradxTokensConfig: Record<string, BasicToken> = {
  HDX: { name: "HDX", symbol: "HDX", decimals: 12, ed: "1000000000000" },
  WETH: { name: "WETH", symbol: "WETH", decimals: 18, ed: "7000000000000" },
  WBTC: { name: "WBTC", symbol: "WBTC", decimals: 8, ed: "44" },
  DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "17540000" },
  DAI: { name: "DAI", symbol: "DAI", decimals: 18, ed: "10000000000" },
};

const HYDRADX_SUPPORTED_TOKENS: Record<string, number> = {
  HDX: 0,
  DAI: 2,
  WBTC: 3,
  WETH: 4,
  DOT: 5,
};

export const basiliskRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "11523248" },
      weightLimit: "800000000",
    },
  },
  {
    to: "karura",
    token: "BSX",
    xcm: {
      fee: { token: "BSX", amount: "93240000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "5060238106" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "90741527" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const basiliskTokensConfig: Record<string, BasicToken> = {
  BSX: { name: "BSX", symbol: "BSX", decimals: 12, ed: "1000000000000" },
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "10000000000" },
  aUSD: { name: "aUSD", symbol: "aUSD", decimals: 12, ed: "10000000000" },
  KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "100000000" },
};

const BASILISK_SUPPORTED_TOKENS: Record<string, number> = {
  BSX: 0,
  KUSD: 2,
  KSM: 1,
};

const tokensConfig: Record<string, Record<string, BasicToken>> = {
  hydradx: hydradxTokensConfig,
  basilisk: basiliskTokensConfig,
};

const supportedTokens: Record<string, Record<string, number>> = {
  hydradx: HYDRADX_SUPPORTED_TOKENS,
  basilisk: BASILISK_SUPPORTED_TOKENS,
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
    assets: (tokenId: number, address: string) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, tokenId],
      }),
  };
};

class HydradxBalanceAdapter extends BalanceAdapter {
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

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map((data) => ({
          free: FN.fromInner(data.freeBalance.toString(), this.decimals),
          locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
          reserved: FN.fromInner(
            data.reservedBalance.toString(),
            this.decimals
          ),
          available: FN.fromInner(
            data.availableBalance.toString(),
            this.decimals
          ),
        }))
      );
    }

    const tokens = supportedTokens[this.chain];
    const tokenId = tokens[token];
    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(tokenId, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.free?.toString() || "0",
          this.getToken(token).decimals
        );

        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount,
        };
      })
    );
  }
}

class BaseHydradxAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: HydradxBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;
    this.balanceAdapter = new HydradxBalanceAdapter({
      chain: chain,
      api,
      tokens: tokensConfig[chain],
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
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee({
              amount: FN.ZERO,
              to,
              token,
              address,
              signer: address,
            })
          : "0",
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

    const tokens = supportedTokens[this.chain.id];
    const tokenId = tokens[token];
    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    const toChain = chains[to];
    const accountId = this.api?.createType("AccountId32", address).toHex();

    // to parachains
    let dst: any = {
      parents: 1,
      interior: {
        X2: [
          { Parachain: toChain.paraChainId },
          { AccountId32: { id: accountId, network: "Any" } },
        ],
      },
    };

    // to relay-chain
    if (isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot")) {
      dst = {
        interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
        parents: 1,
      };
    }

    return this.api?.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      { V1: dst },
      this.getDestWeight(token, to)?.toString() || "undefined"
    );
  }
}

export class HydradxAdapter extends BaseHydradxAdapter {
  constructor() {
    super(chains.hydradx, hydradxRoutersConfig, hydradxTokensConfig);
  }
}

export class BasiliskAdapter extends BaseHydradxAdapter {
  constructor() {
    super(chains.basilisk, basiliskRoutersConfig, basiliskTokensConfig);
  }
}
