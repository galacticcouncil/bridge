import type { H160 } from "@polkadot/types/interfaces/runtime";
import type {
  Enum,
  Bytes,
  u8,
  u16,
  u32,
  u64,
  u128,
  U8aFixed,
  Struct,
  Compact,
} from "@polkadot/types-codec";
import type { ITuple } from "@polkadot/types-codec/types";

/** @name AcalaPrimitivesCurrencyAssetIds (168) */
export interface AcalaPrimitivesCurrencyAssetIds extends Enum {
  readonly isErc20: boolean;
  readonly asErc20: H160;
  readonly isStableAssetId: boolean;
  readonly asStableAssetId: u32;
  readonly isForeignAssetId: boolean;
  readonly asForeignAssetId: u16;
  readonly isNativeAssetId: boolean;
  readonly asNativeAssetId: AcalaPrimitivesCurrencyCurrencyId;
  readonly type: "Erc20" | "StableAssetId" | "ForeignAssetId" | "NativeAssetId";
}

/** @name AcalaPrimitivesCurrencyAssetMetadata (167) */
export interface AcalaPrimitivesCurrencyAssetMetadata extends Struct {
  readonly name: Bytes;
  readonly symbol: Bytes;
  readonly decimals: u8;
  readonly minimalBalance: u128;
}

/** @name AcalaPrimitivesTradingPair (147) */
export type AcalaPrimitivesTradingPair = ITuple<
  [AcalaPrimitivesCurrencyCurrencyId, AcalaPrimitivesCurrencyCurrencyId]
>;

/** @name ModuleDexTradingPairStatus (521) */
export interface ModuleDexTradingPairStatus extends Enum {
  readonly isDisabled: boolean;
  readonly isProvisioning: boolean;
  readonly asProvisioning: ModuleDexProvisioningParameters;
  readonly isEnabled: boolean;
  readonly type: "Disabled" | "Provisioning" | "Enabled";
}

/** @name ModuleDexProvisioningParameters (522) */
export interface ModuleDexProvisioningParameters extends Struct {
  readonly minContribution: ITuple<[u128, u128]>;
  readonly targetProvision: ITuple<[u128, u128]>;
  readonly accumulatedProvision: ITuple<[u128, u128]>;
  readonly notBefore: u32;
}

/** @name AcalaPrimitivesCurrencyCurrencyId (50) */
interface AcalaPrimitivesCurrencyCurrencyId extends Enum {
  readonly isToken: boolean;
  readonly asToken: AcalaPrimitivesCurrencyTokenSymbol;
  readonly isDexShare: boolean;
  readonly asDexShare: ITuple<
    [AcalaPrimitivesCurrencyDexShare, AcalaPrimitivesCurrencyDexShare]
  >;
  readonly isErc20: boolean;
  readonly asErc20: H160;
  readonly isStableAssetPoolToken: boolean;
  readonly asStableAssetPoolToken: u32;
  readonly isLiquidCrowdloan: boolean;
  readonly asLiquidCrowdloan: u32;
  readonly isForeignAsset: boolean;
  readonly asForeignAsset: u16;
  readonly type:
    | "Token"
    | "DexShare"
    | "Erc20"
    | "StableAssetPoolToken"
    | "LiquidCrowdloan"
    | "ForeignAsset";
}

/** @name AcalaPrimitivesCurrencyTokenSymbol (51) */
interface AcalaPrimitivesCurrencyTokenSymbol extends Enum {
  readonly isAca: boolean;
  readonly isAusd: boolean;
  readonly isDot: boolean;
  readonly isLdot: boolean;
  readonly isTap: boolean;
  readonly isRenbtc: boolean;
  readonly isCash: boolean;
  readonly isKar: boolean;
  readonly isKusd: boolean;
  readonly isKsm: boolean;
  readonly isLksm: boolean;
  readonly isTai: boolean;
  readonly isBnc: boolean;
  readonly isVsksm: boolean;
  readonly isPha: boolean;
  readonly isKint: boolean;
  readonly isKbtc: boolean;
  readonly type:
    | "Aca"
    | "Ausd"
    | "Dot"
    | "Ldot"
    | "Tap"
    | "Renbtc"
    | "Cash"
    | "Kar"
    | "Kusd"
    | "Ksm"
    | "Lksm"
    | "Tai"
    | "Bnc"
    | "Vsksm"
    | "Pha"
    | "Kint"
    | "Kbtc";
}

/** @name AcalaPrimitivesCurrencyDexShare (52) */
interface AcalaPrimitivesCurrencyDexShare extends Enum {
  readonly isToken: boolean;
  readonly asToken: AcalaPrimitivesCurrencyTokenSymbol;
  readonly isErc20: boolean;
  readonly asErc20: H160;
  readonly isLiquidCrowdloan: boolean;
  readonly asLiquidCrowdloan: u32;
  readonly isForeignAsset: boolean;
  readonly asForeignAsset: u16;
  readonly isStableAssetPoolToken: boolean;
  readonly asStableAssetPoolToken: u32;
  readonly type:
    | "Token"
    | "Erc20"
    | "LiquidCrowdloan"
    | "ForeignAsset"
    | "StableAssetPoolToken";
}

/** @name XcmV1MultiLocation (69) */
export interface XcmV1MultiLocation extends Struct {
  readonly parents: u8;
  readonly interior: XcmV1MultilocationJunctions;
}

/** @name XcmV1MultilocationJunctions (70) */
interface XcmV1MultilocationJunctions extends Enum {
  readonly isHere: boolean;
  readonly isX1: boolean;
  readonly asX1: XcmV1Junction;
  readonly isX2: boolean;
  readonly asX2: ITuple<[XcmV1Junction, XcmV1Junction]>;
  readonly isX3: boolean;
  readonly asX3: ITuple<[XcmV1Junction, XcmV1Junction, XcmV1Junction]>;
  readonly isX4: boolean;
  readonly asX4: ITuple<
    [XcmV1Junction, XcmV1Junction, XcmV1Junction, XcmV1Junction]
  >;
  readonly isX5: boolean;
  readonly asX5: ITuple<
    [XcmV1Junction, XcmV1Junction, XcmV1Junction, XcmV1Junction, XcmV1Junction]
  >;
  readonly isX6: boolean;
  readonly asX6: ITuple<
    [
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction
    ]
  >;
  readonly isX7: boolean;
  readonly asX7: ITuple<
    [
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction
    ]
  >;
  readonly isX8: boolean;
  readonly asX8: ITuple<
    [
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction,
      XcmV1Junction
    ]
  >;
  readonly type: "Here" | "X1" | "X2" | "X3" | "X4" | "X5" | "X6" | "X7" | "X8";
}

/** @name XcmV1Junction (71) */
interface XcmV1Junction extends Enum {
  readonly isParachain: boolean;
  readonly asParachain: Compact<u32>;
  readonly isAccountId32: boolean;
  readonly asAccountId32: {
    readonly network: XcmV0JunctionNetworkId;
    readonly id: U8aFixed;
  } & Struct;
  readonly isAccountIndex64: boolean;
  readonly asAccountIndex64: {
    readonly network: XcmV0JunctionNetworkId;
    readonly index: Compact<u64>;
  } & Struct;
  readonly isAccountKey20: boolean;
  readonly asAccountKey20: {
    readonly network: XcmV0JunctionNetworkId;
    readonly key: U8aFixed;
  } & Struct;
  readonly isPalletInstance: boolean;
  readonly asPalletInstance: u8;
  readonly isGeneralIndex: boolean;
  readonly asGeneralIndex: Compact<u128>;
  readonly isGeneralKey: boolean;
  readonly asGeneralKey: Bytes;
  readonly isOnlyChild: boolean;
  readonly isPlurality: boolean;
  readonly asPlurality: {
    readonly id: XcmV0JunctionBodyId;
    readonly part: XcmV0JunctionBodyPart;
  } & Struct;
  readonly type:
    | "Parachain"
    | "AccountId32"
    | "AccountIndex64"
    | "AccountKey20"
    | "PalletInstance"
    | "GeneralIndex"
    | "GeneralKey"
    | "OnlyChild"
    | "Plurality";
}

/** @name XcmV0JunctionNetworkId (73) */
interface XcmV0JunctionNetworkId extends Enum {
  readonly isAny: boolean;
  readonly isNamed: boolean;
  readonly asNamed: Bytes;
  readonly isPolkadot: boolean;
  readonly isKusama: boolean;
  readonly type: "Any" | "Named" | "Polkadot" | "Kusama";
}

/** @name XcmV0JunctionBodyId (78) */
interface XcmV0JunctionBodyId extends Enum {
  readonly isUnit: boolean;
  readonly isNamed: boolean;
  readonly asNamed: Bytes;
  readonly isIndex: boolean;
  readonly asIndex: Compact<u32>;
  readonly isExecutive: boolean;
  readonly isTechnical: boolean;
  readonly isLegislative: boolean;
  readonly isJudicial: boolean;
  readonly type:
    | "Unit"
    | "Named"
    | "Index"
    | "Executive"
    | "Technical"
    | "Legislative"
    | "Judicial";
}

/** @name XcmV0JunctionBodyPart (79) */
interface XcmV0JunctionBodyPart extends Enum {
  readonly isVoice: boolean;
  readonly isMembers: boolean;
  readonly asMembers: {
    readonly count: Compact<u32>;
  } & Struct;
  readonly isFraction: boolean;
  readonly asFraction: {
    readonly nom: Compact<u32>;
    readonly denom: Compact<u32>;
  } & Struct;
  readonly isAtLeastProportion: boolean;
  readonly asAtLeastProportion: {
    readonly nom: Compact<u32>;
    readonly denom: Compact<u32>;
  } & Struct;
  readonly isMoreThanProportion: boolean;
  readonly asMoreThanProportion: {
    readonly nom: Compact<u32>;
    readonly denom: Compact<u32>;
  } & Struct;
  readonly type:
    | "Voice"
    | "Members"
    | "Fraction"
    | "AtLeastProportion"
    | "MoreThanProportion";
}
