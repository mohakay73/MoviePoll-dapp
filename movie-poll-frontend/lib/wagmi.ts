import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  baseSepolia,
  mainnet,
  optimism,
  polygon,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Coinflip-App',
  projectId: '36da121c3c295871291ebb8aa323fc63',
  chains: [
    baseSepolia,
  ],
  ssr: false,
});
