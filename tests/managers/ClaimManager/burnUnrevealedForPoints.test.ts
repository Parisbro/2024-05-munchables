import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { parseEther } from "viem";
import { DeployedContractsType } from "../../../deployments/actions/deploy-contracts";
import { Role } from "../../../deployments/utils/config-consts";
import { assertTransactionEvents, assertTxSuccess } from "../../utils/asserters";
import { testClient } from "../../utils/consts";
import { getTestContracts, getTestRoleAddresses } from "../../utils/contracts";
import {
  MockMigrationManagerContractType,
  deployMockMigrationManager,
} from "../../utils/mock-contracts";

describe("ClaimManager: burnUnrevealedForPoints", () => {
  let bob: `0x${string}`;
  let newPeriodRole: `0x${string}`;
  let beforeSnapshot: `0x${string}`;
  let beforeEachSnapshot: `0x${string}`;
  let testContracts: DeployedContractsType;
  let mockMigrationManager: MockMigrationManagerContractType;

  before(async () => {
    testContracts = await getTestContracts();

    beforeSnapshot = await testClient.snapshot();

    const testRoleAddresses = await getTestRoleAddresses();
    [bob] = testRoleAddresses.users;
    newPeriodRole = testRoleAddresses[Role.NewPeriod];
    mockMigrationManager = await deployMockMigrationManager({ testContracts });
    await testClient.setBalance({
      address: newPeriodRole,
      value: parseEther("10"),
    });
  });

  beforeEach(async () => {
    beforeEachSnapshot = await testClient.snapshot();
  });

  afterEach(async () => {
    await testClient.revert({ id: beforeEachSnapshot });
  });

  after(async () => {
    await testClient.revert({ id: beforeSnapshot });
  });

  describe("burn unrevealed for points", () => {
    it("test 1 unrevealed", async () => {
      const singleRarity = await mockMigrationManager.write.burnUnrevealedForPoints([bob, 1], {
        account: bob,
      });
      const txReceipt = await assertTxSuccess({ txHash: singleRarity });
      assertTransactionEvents({
        abi: testContracts.claimManagerRoot.contract.abi,
        logs: txReceipt.logs,
        expectedEvents: [
          {
            eventName: "UnrevealedSwappedForPoints",
            args: {
              _player: bob,
              _unrevealed: 1n,
              _points: 1000n,
            },
          },
        ],
      });
      const points = await testContracts.claimManagerProxy.contract.read.getPoints([bob]);
      assert.equal(points, 1000n);
    });
    it("test 3 unrevealed", async () => {
      const singleRarity = await mockMigrationManager.write.burnUnrevealedForPoints([bob, 3], {
        account: bob,
      });
      const txReceipt = await assertTxSuccess({ txHash: singleRarity });
      assertTransactionEvents({
        abi: testContracts.claimManagerRoot.contract.abi,
        logs: txReceipt.logs,
        expectedEvents: [
          {
            eventName: "UnrevealedSwappedForPoints",
            args: {
              _player: bob,
              _unrevealed: 3n,
              _points: 3000n,
            },
          },
        ],
      });
      const points = await testContracts.claimManagerProxy.contract.read.getPoints([bob]);
      assert.equal(points, 3000n);
    });
  });
});
