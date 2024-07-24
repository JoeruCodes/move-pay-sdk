import { AccountAddress, AccountAddressInput, PublicKey } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";

export type Recipient = AccountAddressInput;
export type Amount = BigNumber;
export type Token = AccountAddress;

export type Label = string;
export type Message = string;
export type Link = URL;