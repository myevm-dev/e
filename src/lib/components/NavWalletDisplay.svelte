<script lang="ts">
  import { getEnsAvatar, getEnsName } from '$lib/utils';
  import { userAddress } from '$lib/stores';
  import blockies from 'ethereum-blockies';
  import type { Address } from 'viem';

  let user: { address: Address; name: string | null; avatar: string | null; blockie: string | null } | undefined;

  // Helper function to generate a random base color in hex
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Function to calculate the complementary color for a given hex color
  const getComplementaryColor = (hex: string) => {
    // Remove the '#' and convert the string into an integer
    const colorInt = parseInt(hex.slice(1), 16);

    // XOR the integer with white (0xFFFFFF) to get the complementary color
    const complementaryInt = 0xFFFFFF ^ colorInt;

    // Convert back to a hex string and return it
    return `#${complementaryInt.toString(16).padStart(6, '0').toUpperCase()}`;
  };

  // Function to generate a Blockie with complementary colors
  const generateBlockie = (address: Address) => {
    const baseColor = getRandomColor(); // Random base color
    const complementaryColor = getComplementaryColor(baseColor); // Complementary color

    return blockies.create({
      seed: address.toLowerCase(),
      size: 8,
      scale: 4,
      color: baseColor,           // Base color for foreground
      bgcolor: complementaryColor, // Complementary background color
      spotcolor: getComplementaryColor(complementaryColor) // Another complement for spots
    }).toDataURL();
  };

  // Function to get ENS info and generate Blockie if no ENS avatar is found
  const getUserEnsInfo = async (address?: Address) => {
    if (!address) {
      user = undefined;
    } else if (!user || address !== user.address) {
      user = { address, name: null, avatar: null, blockie: null };

      user.name = await getEnsName(address);

      if (!!user.name) {
        user.avatar = await getEnsAvatar(user.name);
      }

      // Generate Blockie if no avatar is available
      if (!user.avatar) {
        user.blockie = generateBlockie(address);
      }
    }
  };

  // Reactive block to update user information whenever the address changes
  $: getUserEnsInfo($userAddress);
</script>

{#if $userAddress}
  {@const displayName = user?.name ?? `${$userAddress.slice(0, 6)}...${$userAddress.slice(-4)}`}

  <div class="user-info">
    {#if !!user?.avatar}
      <img src={user.avatar} alt="Avatar" />
    {:else if !!user?.blockie}
      <img src={user.blockie} alt="Blockie Avatar" />
    {/if}
    <span class="display-name">{displayName}</span>
  </div>
{:else}
  <span class="connect-button">Connect Wallet</span>
{/if}

<style>
  div.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  div.user-info > img {
    height: 2.4rem;
    width: 2.4rem; /* Ensure the Blockie image is square */
    border-radius: 50%;
    object-fit: cover; /* Ensures the image fits correctly */
  }

  /* Increased font size for the Ethereum address */
  .display-name {
    font-size: 1rem;  /* Adjust this as needed */
    font-weight: 600; /* Make it bold */
    color: var(--pt-purple-100); /* Optional color, adjust as needed */
  }

  span.connect-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--pt-purple-100);
    background-color: var(--pt-transparent);
    border: 1px solid var(--pt-transparent);
    border-radius: 0.5rem;
    line-height: 150%;
  }

  span.connect-button:hover {
    background-color: rgba(245, 240, 255, 0.15);
  }
</style>
