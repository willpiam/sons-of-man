import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NetworkMode } from '../utils/network';

export interface SessionState {
  networkMode: NetworkMode;
  ethereum: {
    connected: boolean;
    address: string;
  };
  cardano: {
    connected: boolean;
    address: string;
    selectedWallet: string | null;
  };
}

const initialState: SessionState = {
  networkMode: 'mainnet',
  ethereum: {
    connected: false,
    address: '',
  },
  cardano: {
    connected: false,
    address: '',
    selectedWallet: null,
  },
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setNetworkMode: (state, action: PayloadAction<NetworkMode>) => {
      state.networkMode = action.payload;
    },
    setEthereumWallet: (
      state,
      action: PayloadAction<{ connected: boolean; address: string }>,
    ) => {
      state.ethereum = action.payload;
    },
    setCardanoWallet: (
      state,
      action: PayloadAction<{
        connected: boolean;
        address: string;
        selectedWallet: string | null;
      }>,
    ) => {
      state.cardano = action.payload;
    },
    resetCeremonyWallets: (state) => {
      state.ethereum = { connected: false, address: '' };
      state.cardano = { connected: false, address: '', selectedWallet: null };
    },
  },
});

export const { setNetworkMode, setEthereumWallet, setCardanoWallet, resetCeremonyWallets } =
  sessionSlice.actions;

export default sessionSlice.reducer;
