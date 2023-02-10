import { WalletConfigs } from "@acala-network/sdk/wallet";
import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import { EvmRpcProvider } from "@acala-network/eth-providers";
import {
  catchError,
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  of,
} from "rxjs";

import "@acala-network/types/argument/api-tx";
import { ApiRx } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import { ApiNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";
import { isChainEqual } from "../utils/is-chain-equal";
import { AcalaWallet } from "../wallet/acala";

const ACALA_DEST_WEIGHT = "5000000000";

export const acalaRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "469417452" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "hydradx",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "12375721330000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "hydradx",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "491129243" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "hydradx",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "1811710000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "hydradx",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "61" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
];

export const karuraRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "79999999" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "statemine",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "16000000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "basilisk",
    token: "BSX",
    xcm: {
      fee: { token: "BSX", amount: "22000000000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  /*   {
    to: "basilisk",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "0" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  }, */
  {
    to: "basilisk",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "359882060" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "basilisk",
    token: "aUSD",
    xcm: {
      fee: { token: "aUSD", amount: "3150402683" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
];

export const acalaTokensConfig: Record<string, BasicToken> = {
  ACA: { name: "ACA", symbol: "ACA", decimals: 12, ed: "100000000000" },
  AUSD: { name: "AUSD", symbol: "AUSD", decimals: 12, ed: "100000000000" },
  LDOT: { name: "LDOT", symbol: "LDOT", decimals: 10, ed: "500000000" },
  INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "1000000000" },
  IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "100" },
  GLMR: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18,
    ed: "100000000000000000",
  },
  PARA: { name: "PARA", symbol: "PARA", decimals: 12, ed: "100000000000" },
  ASTR: {
    name: "ASTR",
    symbol: "ASTR",
    decimals: 18,
    ed: "100000000000000000",
  },
  DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "100000000" },
  DAI: { name: "DAI", symbol: "DAI", decimals: 18, ed: "10000000000000000" },
  WETH: { name: "WETH", symbol: "WETH", decimals: 18, ed: "8500000000000" },
  WBTC: { name: "WBTC", symbol: "WBTC", decimals: 8, ed: "60" },
};

export const karuraTokensConfig: Record<string, BasicToken> = {
  KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "100000000000" },
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "10000000000" },
  aUSD: { name: "aUSD", symbol: "aUSD", decimals: 12, ed: "10000000000" },
  LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "500000000" },
  SDN: { name: "SDN", symbol: "SDN", decimals: 18, ed: "10000000000000000" },
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "8000000000" },
  VSKSM: { name: "VSKSM", symbol: "VSKSM", decimals: 12, ed: "100000000" },
  AIR: { name: "AIR", symbol: "AIR", decimals: 18, ed: "100000000000000000" },
  CSM: { name: "CSM", symbol: "CSM", decimals: 12, ed: "1000000000000" },
  CRAB: {
    name: "CRAB",
    symbol: "CRAB",
    decimals: 18,
    ed: "1000000000000000000",
  },
  BSX: { name: "BSX", symbol: "BSX", decimals: 12, ed: "1000000000000" },
  TEER: { name: "TEER", symbol: "TEER", decimals: 12, ed: "100000000000" },
  KINT: { name: "KINT", symbol: "KINT", decimals: 12, ed: "133330000" },
  KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "66" },
  KICO: { name: "KICO", symbol: "KICO", decimals: 14, ed: "100000000000000" },
  PCHU: {
    name: "PCHU",
    symbol: "PCHU",
    decimals: 18,
    ed: "100000000000000000",
  },
  LT: { name: "LT", symbol: "LT", decimals: 12, ed: "1000000000000" },
  KMA: { name: "KMA", symbol: "KMA", decimals: 12, ed: "100000000000" },
  MOVR: { name: "MOVR", symbol: "MOVR", decimals: 18, ed: "1000000000000000" },
  TUR: { name: "TUR", symbol: "TUR", decimals: 10, ed: "40000000000" },
  HKO: { name: "HKO", symbol: "HKO", decimals: 12, ed: "100000000000" },
  PHA: { name: "PHA", symbol: "PHA", decimals: 12, ed: "40000000000" },
  KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "100000000" },
  RMRK: { name: "RMRK", symbol: "RMRK", decimals: 10, ed: "100000000" },
  ARIS: { name: "ARIS", symbol: "ARIS", decimals: 8, ed: "1000000000000" },
  USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "10000" },
  QTZ: { name: "QTZ", symbol: "QTZ", decimals: 18, ed: "40000000000" },
};

class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: AcalaWallet;
  protected evmEndpoint?: string | string[];

  public override async setApi(api: AnyApi) {
    this.api = api;

    if (this.api?.type === "rxjs") {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;

    this.wallet = new AcalaWallet(api, {
      evmProvider: this.evmEndpoint
        ? new EvmRpcProvider(this.evmEndpoint)
        : null,
    } as WalletConfigs);

    await this.wallet.isReady;
  }

  public override subscribeMinInput(
    token: string,
    to: ChainName
  ): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const destFee = this.getCrossChainFee(token, to);

    return of(
      this.getDestED(token, to).balance.add(
        destFee.token === token ? destFee.balance : FixedPointNumber.ZERO
      )
    );
  }

  public subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const zeroResult: Observable<BalanceData> = new Observable((sub) =>
      sub.next({
        free: FixedPointNumber.ZERO,
        locked: FixedPointNumber.ZERO,
        available: FixedPointNumber.ZERO,
        reserved: FixedPointNumber.ZERO,
      })
    );

    return this.wallet.subscribeBalance(token, address).pipe(
      catchError((e) => {
        console.error(e);
        return zeroResult;
      })
    );
  }

  public subscribeMaxInput(
    token: string,
    address: string,
    to: ChainName
  ): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const tokens = this.wallet.getPresetTokens();
    const { nativeToken } = tokens;

    return combineLatest({
      txFee:
        token === nativeToken.name
          ? this.estimateTxFee({
              amount: FixedPointNumber.ZERO,
              to,
              token,
              address:
                to === "moonriver" || to === "moonbeam"
                  ? "0x0000000000000000000000000000000000000000"
                  : address,
              signer: address,
            })
          : "0",
      balance: this.wallet
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const feeFactor = 1.2;
        const fee = FixedPointNumber.fromInner(
          txFee,
          nativeToken.decimals || 12
        ).mul(new FixedPointNumber(feeFactor));

        return balance.minus(fee);
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

    const tokenFormSDK = this.wallet?.getToken(token);
    const toChain = chains[to];
    const destFee = this.getCrossChainFee(token, to);
    const oldDestWeight = this.getDestWeight(token, to);
    const useNewDestWeight =
      this.api.tx.xTokens.transfer.meta.args[3].type.toString() ===
      "XcmV2WeightLimit";

    // to moonriver/moonbeam
    if (
      isChainEqual(toChain, "moonriver") ||
      isChainEqual(toChain, "moonbeam")
    ) {
      const dst = {
        parents: 1,
        interior: {
          X2: [
            { Parachain: toChain.paraChainId },
            { AccountKey20: { key: address, network: "Any" } },
          ],
        },
      };

      return token === "KAR" ||
        token === "KUSD" ||
        token === "MOVR" ||
        token === "ACA" ||
        token === "AUSD" ||
        token === "GLMR"
        ? this.api.tx.xTokens.transfer(
            tokenFormSDK?.toChainData() as any,
            amount.toChainData(),
            { V1: dst },
            (useNewDestWeight ? "Unlimited" : oldDestWeight?.toString()) as any
          )
        : this.api.tx.xTokens.transferMulticurrencies(
            [
              [tokenFormSDK?.toChainData() as any, amount.toChainData()],
              [{ Token: destFee.token }, destFee.balance.toChainData()],
            ],
            1,
            { V1: dst },
            (useNewDestWeight ? "Unlimited" : oldDestWeight?.toString()) as any
          );
    }

    const accountId = this.api?.createType("AccountId32", address).toHex();

    // to other parachains
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

    return isChainEqual(toChain, "statemine")
      ? this.api.tx.xTokens.transferMulticurrencies(
          [
            [tokenFormSDK?.toChainData(), amount.toChainData()],
            [{ Token: destFee.token }, destFee.balance.toChainData()],
          ],
          1,
          { V1: dst },
          (useNewDestWeight ? "Unlimited" : oldDestWeight?.toString()) as any
        )
      : this.api.tx.xTokens.transfer(
          tokenFormSDK?.toChainData() as any,
          amount.toChainData(),
          { V1: dst },
          (useNewDestWeight ? "Unlimited" : oldDestWeight?.toString()) as any
        );
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor(evmEndpoint?: string | string[]) {
    super(chains.acala, acalaRoutersConfig, acalaTokensConfig);
    this.evmEndpoint = evmEndpoint;
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.karura, karuraRoutersConfig, karuraTokensConfig);
  }
}
