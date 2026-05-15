import api from "../api/axios";

const WalletService = {
    getTransactions: async (page = 1, perPage = 10) => {
        const response = await api.get('/user/wallet-transactions', {
            params: { page, per_page: perPage }
        });
        return response.data;
    }
};

export default WalletService;
