import { create } from 'zustand';

// Global data store for cross-module integration
interface Treaty {
  id: string;
  contractNumber: string;
  treatyName: string;
  cedant: string;
  broker: string;
  country: string;
  inceptionDate: string;
  expiryDate: string;
  participationShare: number;
  retroPercentage: number;
  commission: number;
  premium: number;
  currency: string;
  status: 'Active' | 'Pending' | 'Expired';
  lineOfBusiness: string[];
  layers?: Array<{
    name: string;
    limit: number;
    retention: number;
    reinstatementRate: number;
    deductible: number;
    remainingCapacity: number;
  }>;
  deductible?: number;
  insuredName?: string;
  premiumBookings?: Array<{
    id: string;
    amount: number;
    type: string;
    date: string;
    status: 'Paid' | 'Partially Paid' | 'Unpaid';
    paidAmount?: number;
  }>;
}

interface Claim {
  id: string;
  claimNumber: string;
  contractNumber: string;
  treatyId: string;
  insuredName: string;
  claimAmount: number;
  reserveAmount: number;
  currency: string;
  status: string;
  dateOfLoss: string;
  dateReported: string;
  dateApproved?: string;
  claimDescription: string;
  retroRecovery?: number;
  reinstatementPremium?: number;
  layerDistribution?: any[];
}

interface UnderwritingContract {
  id: string;
  contractNumber: string;
  underwritingYear: string;
  contractType: string;
  treatyName: string;
  cedants: Array<{
    name: string;
    reference: string;
    country: string;
  }>;
  brokers: Array<{
    name: string;
    reference: string;
    commission: number;
  }>;
  linesOfBusiness: string[];
  premium: number;
  currency: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Closed';
  inceptionDate: string;
  expiryDate: string;
}

interface DataStore {
  treaties: Treaty[];
  claims: Claim[];
  underwritingContracts: UnderwritingContract[];
  
  // Treaty actions
  addTreaty: (treaty: Treaty) => void;
  updateTreaty: (id: string, updates: Partial<Treaty>) => void;
  getTreatyByContractNumber: (contractNumber: string) => Treaty | undefined;
  
  // Claims actions
  addClaim: (claim: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  getClaimsByTreaty: (treatyId: string) => Claim[];
  
  // Underwriting actions
  addUnderwritingContract: (contract: UnderwritingContract) => void;
  updateUnderwritingContract: (id: string, updates: Partial<UnderwritingContract>) => void;
  convertUnderwritingToTreaty: (contractId: string) => void;
  
  // Premium booking actions
  addPremiumBooking: (treatyId: string, booking: any) => void;
  updatePremiumPaymentStatus: (treatyId: string, bookingId: string, status: string, paidAmount?: number) => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  treaties: [
    {
      id: '1',
      contractNumber: '12345',
      treatyName: 'Motor Treaty 2024',
      cedant: 'Century Insurance Ltd',
      broker: 'AON Tanzania',
      country: 'Tanzania',
      inceptionDate: '2024-01-01',
      expiryDate: '2024-12-31',
      participationShare: 50,
      retroPercentage: 25,
      commission: 25,
      premium: 25500000,
      currency: 'USD',
      status: 'Active',
      lineOfBusiness: ['Motor'],
      layers: [
        { name: 'Working Layer', limit: 5000000, retention: 0, reinstatementRate: 100, deductible: 100000, remainingCapacity: 5000000 },
        { name: '1st Excess', limit: 10000000, retention: 5000000, reinstatementRate: 100, deductible: 0, remainingCapacity: 10000000 }
      ],
      deductible: 100000,
      insuredName: 'ABC Transport Ltd',
      premiumBookings: [
        { id: 'pb1', amount: 25500000, type: 'MDP', date: '2024-01-15', status: 'Paid', paidAmount: 25500000 },
        { id: 'pb2', amount: 2500000, type: 'Adjustment', date: '2024-06-15', status: 'Partially Paid', paidAmount: 1500000 }
      ]
    },
    {
      id: '2',
      contractNumber: '12346',
      treatyName: 'Property XOL 2024',
      cedant: 'National Insurance Corp',
      broker: 'Marsh Tanzania',
      country: 'Tanzania',
      inceptionDate: '2024-01-01',
      expiryDate: '2024-12-31',
      participationShare: 75,
      retroPercentage: 30,
      commission: 20,
      premium: 18750000,
      currency: 'USD',
      status: 'Active',
      lineOfBusiness: ['Property'],
      layers: [
        { name: 'Working Layer', limit: 10000000, retention: 0, reinstatementRate: 100, deductible: 250000, remainingCapacity: 10000000 },
        { name: 'Cat Layer', limit: 25000000, retention: 10000000, reinstatementRate: 50, deductible: 0, remainingCapacity: 25000000 }
      ],
      deductible: 250000,
      insuredName: 'XYZ Manufacturing',
      premiumBookings: [
        { id: 'pb3', amount: 18750000, type: 'MDP', date: '2024-01-15', status: 'Unpaid', paidAmount: 0 }
      ]
    }
  ],
  
  claims: [
    {
      id: '1',
      claimNumber: 'TAN/MV/TTY/2024/0001',
      contractNumber: '12345',
      treatyId: '1',
      insuredName: 'ABC Transport Ltd',
      claimAmount: 2500000,
      reserveAmount: 2500000,
      currency: 'USD',
      status: 'Outstanding',
      dateOfLoss: '2024-11-15',
      dateReported: '2024-11-18',
      dateApproved: '2024-11-20',
      claimDescription: 'Vehicle collision resulting in total loss',
      retroRecovery: 625000,
      reinstatementPremium: 250000
    }
  ],
  
  underwritingContracts: [
    {
      id: '1',
      contractNumber: '12347',
      underwritingYear: '2024',
      contractType: 'quota',
      treatyName: 'Marine Treaty 2024',
      cedants: [{ name: 'Jubilee Insurance', reference: 'JUB001', country: 'Kenya' }],
      brokers: [{ name: 'Willis Towers Watson', reference: 'WTW001', commission: 22.5 }],
      linesOfBusiness: ['marine'],
      premium: 12200000,
      currency: 'USD',
      status: 'Draft',
      inceptionDate: '2024-06-01',
      expiryDate: '2025-05-31'
    }
  ],

  // Treaty actions
  addTreaty: (treaty) => set((state) => ({
    treaties: [...state.treaties, treaty]
  })),
  
  updateTreaty: (id, updates) => set((state) => ({
    treaties: state.treaties.map(treaty => 
      treaty.id === id ? { ...treaty, ...updates } : treaty
    )
  })),
  
  getTreatyByContractNumber: (contractNumber) => {
    const state = get();
    return state.treaties.find(treaty => treaty.contractNumber === contractNumber);
  },

  // Claims actions
  addClaim: (claim) => set((state) => ({
    claims: [...state.claims, claim]
  })),
  
  updateClaim: (id, updates) => set((state) => ({
    claims: state.claims.map(claim => 
      claim.id === id ? { ...claim, ...updates } : claim
    )
  })),
  
  getClaimsByTreaty: (treatyId) => {
    const state = get();
    return state.claims.filter(claim => claim.treatyId === treatyId);
  },

  // Underwriting actions
  addUnderwritingContract: (contract) => set((state) => ({
    underwritingContracts: [...state.underwritingContracts, contract]
  })),
  
  updateUnderwritingContract: (id, updates) => set((state) => ({
    underwritingContracts: state.underwritingContracts.map(contract => 
      contract.id === id ? { ...contract, ...updates } : contract
    )
  })),
  
  convertUnderwritingToTreaty: (contractId) => {
    const state = get();
    const contract = state.underwritingContracts.find(c => c.id === contractId);
    if (contract) {
      const newTreaty: Treaty = {
        id: Date.now().toString(),
        contractNumber: contract.contractNumber,
        treatyName: contract.treatyName,
        cedant: contract.cedants[0]?.name || '',
        broker: contract.brokers[0]?.name || '',
        country: contract.cedants[0]?.country || '',
        inceptionDate: contract.inceptionDate,
        expiryDate: contract.expiryDate,
        participationShare: 50, // Default value
        retroPercentage: 25, // Default value
        commission: contract.brokers[0]?.commission || 25,
        premium: contract.premium,
        currency: contract.currency,
        status: 'Active',
        lineOfBusiness: contract.linesOfBusiness,
        premiumBookings: []
      };
      
      set((state) => ({
        treaties: [...state.treaties, newTreaty],
        underwritingContracts: state.underwritingContracts.map(c => 
          c.id === contractId ? { ...c, status: 'Active' as const } : c
        )
      }));
    }
  },

  // Premium booking actions
  addPremiumBooking: (treatyId, booking) => set((state) => ({
    treaties: state.treaties.map(treaty => 
      treaty.id === treatyId 
        ? { 
            ...treaty, 
            premiumBookings: [...(treaty.premiumBookings || []), booking] 
          }
        : treaty
    )
  })),
  
  updatePremiumPaymentStatus: (treatyId, bookingId, status, paidAmount) => set((state) => ({
    treaties: state.treaties.map(treaty => 
      treaty.id === treatyId 
        ? {
            ...treaty,
            premiumBookings: treaty.premiumBookings?.map(booking =>
              booking.id === bookingId 
                ? { ...booking, status: status as any, paidAmount }
                : booking
            )
          }
        : treaty
    )
  }))
}));