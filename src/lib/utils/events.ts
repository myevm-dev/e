import { clients, userClaimedPrizeEvents, userFlashEvents, userTransferEvents } from '$lib/stores'
import { formatClaimedPrizeEvent, formatFlashEvent, formatTransferEvent } from './formatting'
import { prizeHook, prizePool, prizeVault, twabRewards } from '$lib/config'
import { validateClientNetwork } from './providers'
import { get } from 'svelte/store'
import type { ClaimedPrizeEvent, FlashEvent, TransferEvent } from '$lib/types'
import type { Address } from 'viem'

export const getTransferEvents = async (
  address: Address,
  tokenAddress: Address,
  options?: { filter?: 'from' | 'to'; fromBlock?: bigint }
) => {
  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const transferEvent = {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ]
  } as const

  const fromTransferEvents =
    options?.filter === 'to'
      ? []
      : await publicClient.getLogs({
          address: tokenAddress,
          event: transferEvent,
          args: { from: address },
          fromBlock: options?.fromBlock ?? prizeVault.deployedAtBlock,
          toBlock: 'latest',
          strict: true
        })

  const toTransferEvents =
    options?.filter === 'from'
      ? []
      : await publicClient.getLogs({
          address: tokenAddress,
          event: transferEvent,
          args: { to: address },
          fromBlock: options?.fromBlock ?? prizeVault.deployedAtBlock,
          toBlock: 'latest',
          strict: true
        })

  return [...fromTransferEvents, ...toTransferEvents]
}

export const getFlashEvents = async (beneficiary: Address, swapperAddresses: Address[], options?: { fromBlock?: bigint }) => {
  if (!swapperAddresses.length) return []

  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const flashEvents = await publicClient.getLogs({
    address: swapperAddresses,
    event: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'beneficiary', type: 'address' },
        { indexed: true, internalType: 'address', name: 'trader', type: 'address' },
        {
          components: [
            {
              components: [
                { internalType: 'address', name: 'base', type: 'address' },
                { internalType: 'address', name: 'quote', type: 'address' }
              ],
              internalType: 'struct QuotePair',
              name: 'quotePair',
              type: 'tuple'
            },
            { internalType: 'uint128', name: 'baseAmount', type: 'uint128' },
            { internalType: 'bytes', name: 'data', type: 'bytes' }
          ],
          indexed: false,
          internalType: 'struct QuoteParams[]',
          name: 'quoteParams',
          type: 'tuple[]'
        },
        { indexed: false, internalType: 'address', name: 'tokenToBeneficiary', type: 'address' },
        { indexed: false, internalType: 'uint256[]', name: 'amountsToBeneficiary', type: 'uint256[]' },
        { indexed: false, internalType: 'uint256', name: 'excessToBeneficiary', type: 'uint256' }
      ],
      name: 'Flash',
      type: 'event'
    },
    args: { beneficiary },
    fromBlock: options?.fromBlock ?? prizeVault.deployedAtBlock,
    toBlock: 'latest',
    strict: true
  })

  return flashEvents
}

export const getSetSwapperEvents = async (userAddress: Address) => {
  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const setSwapperEvents = await publicClient.getLogs({
    address: prizeHook.address,
    event: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'account', type: 'address' },
        { indexed: true, internalType: 'address', name: 'newSwapper', type: 'address' },
        { indexed: true, internalType: 'address', name: 'previousSwapper', type: 'address' }
      ],
      name: 'SetSwapper',
      type: 'event'
    },
    args: { account: userAddress },
    fromBlock: prizeVault.deployedAtBlock,
    toBlock: 'latest',
    strict: true
  })

  return setSwapperEvents
}

export const getPromotionCreatedEvents = async () => {
  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const promotionCreatedEvents = await publicClient.getLogs({
    address: twabRewards.address,
    event: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'uint256', name: 'promotionId', type: 'uint256' },
        { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
        { indexed: true, internalType: 'contract IERC20', name: 'token', type: 'address' },
        { indexed: false, internalType: 'uint64', name: 'startTimestamp', type: 'uint64' },
        { indexed: false, internalType: 'uint256', name: 'tokensPerEpoch', type: 'uint256' },
        { indexed: false, internalType: 'uint48', name: 'epochDuration', type: 'uint48' },
        { indexed: false, internalType: 'uint8', name: 'initialNumberOfEpochs', type: 'uint8' }
      ],
      name: 'PromotionCreated',
      type: 'event'
    },
    args: {
      vault: prizeVault.address,
      token: twabRewards.tokenOptions.map((t) => t.address)
    },
    fromBlock: prizeVault.deployedAtBlock,
    toBlock: 'latest',
    strict: true
  })

  return promotionCreatedEvents
}

export const getRewardsClaimedEvents = async (userAddress: Address) => {
  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const rewardsClaimedEvents = await publicClient.getLogs({
    address: twabRewards.address,
    event: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'uint256', name: 'promotionId', type: 'uint256' },
        { indexed: false, internalType: 'uint8[]', name: 'epochIds', type: 'uint8[]' },
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'RewardsClaimed',
      type: 'event'
    },
    args: {
      user: userAddress
    },
    fromBlock: prizeVault.deployedAtBlock,
    toBlock: 'latest',
    strict: true
  })

  return rewardsClaimedEvents
}

export const getClaimedPrizeEvents = async (userAddress: Address, options?: { fromBlock?: bigint }) => {
  const publicClient = get(clients).public
  validateClientNetwork(publicClient)

  const claimedPrizeEvents = await publicClient.getLogs({
    address: prizePool.address,
    event: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
        { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
        { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
        { indexed: false, internalType: 'uint24', name: 'drawId', type: 'uint24' },
        { indexed: false, internalType: 'uint8', name: 'tier', type: 'uint8' },
        { indexed: false, internalType: 'uint32', name: 'prizeIndex', type: 'uint32' },
        { indexed: false, internalType: 'uint152', name: 'payout', type: 'uint152' },
        { indexed: false, internalType: 'uint96', name: 'claimReward', type: 'uint96' },
        { indexed: false, internalType: 'address', name: 'claimRewardRecipient', type: 'address' }
      ],
      name: 'ClaimedPrize',
      type: 'event'
    },
    args: {
      vault: prizeVault.address,
      winner: userAddress,
      recipient: userAddress
    },
    fromBlock: options?.fromBlock ?? prizeVault.deployedAtBlock,
    toBlock: 'latest',
    strict: true
  })

  return claimedPrizeEvents
}

export const updateUserTransferEvents = async (userAddress: Address, oldTransferEvents: TransferEvent[]) => {
  const lastTransferEvent = oldTransferEvents.at(-1)

  const newTransferEvents = (
    await getTransferEvents(userAddress, prizeVault.address, {
      fromBlock: !!lastTransferEvent ? BigInt(lastTransferEvent.blockNumber) + 1n : undefined
    })
  ).map(formatTransferEvent)

  const updatedUserTransferEvents = [...oldTransferEvents, ...newTransferEvents]
  userTransferEvents.set(updatedUserTransferEvents)

  return updatedUserTransferEvents
}

export const updateUserFlashEvents = async (userAddress: Address, swapperAddresses: Address[], oldFlashEvents: FlashEvent[]) => {
  const lastFlashEvent = oldFlashEvents.at(-1)

  const newFlashEvents = (
    await getFlashEvents(userAddress, swapperAddresses, {
      fromBlock: !!lastFlashEvent ? BigInt(lastFlashEvent.blockNumber) + 1n : undefined
    })
  ).map(formatFlashEvent)

  const updatedUserFlashEvents = [...oldFlashEvents, ...newFlashEvents]
  userFlashEvents.set(updatedUserFlashEvents)

  return updatedUserFlashEvents
}

export const updateUserClaimedPrizeEvents = async (userAddress: Address, oldClaimedPrizeEvents: ClaimedPrizeEvent[]) => {
  const lastClaimedPrizeEvent = oldClaimedPrizeEvents.at(-1)

  const newClaimedPrizeEvents = (
    await getClaimedPrizeEvents(userAddress, {
      fromBlock: !!lastClaimedPrizeEvent ? BigInt(lastClaimedPrizeEvent.blockNumber) + 1n : undefined
    })
  ).map(formatClaimedPrizeEvent)

  const updatedUserClaimedPrizeEvents = [...oldClaimedPrizeEvents, ...newClaimedPrizeEvents]
  userClaimedPrizeEvents.set(updatedUserClaimedPrizeEvents)

  return updatedUserClaimedPrizeEvents
}
