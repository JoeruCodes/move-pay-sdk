import { aptos } from "../src/createTransfer";
import {
  validateSystemInstruction,
  validateCustomTokenTransfer,
} from "../src/gatewayValidation";
import { resolveTokenAddress } from "../src/utils";
import { recipent } from "./transactionBuilders";
describe("test gateway validation functions", () => {
  test("test validateCustomTokenTransfer", async () => {
    const tokenMetadata = await resolveTokenAddress(
      recipent.accountAddress,
      aptos,
      "SCO",
    );
    validateCustomTokenTransfer(
      recipent.accountAddress.toString(),
      aptos,
      tokenMetadata,
      BigInt(1),
    );
  });
  test("test validateSystemInstruction", async () => {
    // fails due to custom indexer... need to host a indexer...
    await validateSystemInstruction(recipent.accountAddress.toString(), aptos, 1);
  });
});
