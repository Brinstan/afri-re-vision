import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global data store for cross-module integration
export interface PremiumBooking {
  id: string;
  amount: number;
  type: string;
  date: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  paidAmount?: number;
}

export interface LayerAllocation {
  layerName: string;
  allocation: number;
  reinstatementPremium?: number;
}

export interface Treaty {
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
  premiumBookings?: PremiumBooking[];
}

export interface Claim {
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
  layerDistribution?: LayerAllocation[];
  paidAmount?: number;
  paymentDate?: string;
  paymentReference?: string;
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

export interface Investment {
  id: string;
  investmentEntity: string;
  entityType: string;
  investmentType: string;
  investmentDate: string;
  amount: number;
  expectedReturnRate: number;
  expectedReturnAmount: number;
  maturityDate: string;
  riskLevel: string;
  description: string;
  status: 'Active' | 'Matured' | 'Disposed';
  actualReturns: number;
  currency: string;
  bankAccountId?: string;        // funding bank account
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  currency: string;
  openingBalance: number;
}

/** A manual double-entry journal captured by the finance user. */
export interface ManualJournal {
  id: string;
  postingDate: string;
  reference: string;
  narration: string;
  currency: string;
  debitAccount: string;          // account code
  creditAccount: string;         // account code
  amount: number;
  postedBy: string;
  adjustment: boolean;           // included only in the adjusted trial balance
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;                // 'CREATE' | 'UPDATE' | 'PAYMENT' | 'CONVERT' | 'RESET' | ...
  entity: string;                // 'Treaty' | 'Claim' | 'Investment' | 'Journal' | ...
  entityId: string;
  sourceModule: string;
  previousValue?: string;
  newValue?: string;
}

interface DataStore {
  treaties: Treaty[];
  claims: Claim[];
  underwritingContracts: UnderwritingContract[];
  investments: Investment[];
  bankAccounts: BankAccount[];
  manualJournals: ManualJournal[];
  auditLog: AuditEntry[];

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
  addPremiumBooking: (treatyId: string, booking: PremiumBooking) => void;
  updatePremiumPaymentStatus: (treatyId: string, bookingId: string, status: PremiumBooking['status'], paidAmount?: number) => void;

  // Investment actions
  addInvestment: (investment: Investment) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;

  // Bank account actions
  addBankAccount: (account: BankAccount) => void;

  // Manual journal actions
  addManualJournal: (journal: ManualJournal) => void;

  // Audit trail
  logAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'user'>) => void;

  // Utility actions
  resetData: () => void;
}

const currentUser = (): string => {
  try {
    const saved = localStorage.getItem('user');
    return saved ? (JSON.parse(saved).username ?? 'system') : 'system';
  } catch { return 'system'; }
};

const auditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'user'>): AuditEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  timestamp: new Date().toISOString(),
  user: currentUser(),
  ...entry
});

const initialData: Pick<DataStore, 'treaties' | 'claims' | 'underwritingContracts' | 'investments' | 'bankAccounts' | 'manualJournals' | 'auditLog'> = {
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

  investments: [
    {
      id: 'inv1',
      investmentEntity: 'Tanzania Government Bonds',
      entityType: 'Government',
      investmentType: 'Bonds',
      investmentDate: '2024-01-15',
      amount: 50000000,
      expectedReturnRate: 8.5,
      expectedReturnAmount: 4250000,
      maturityDate: '2029-01-15',
      riskLevel: 'Low',
      description: '5-year Treasury Bonds',
      status: 'Active',
      actualReturns: 2125000,
      currency: 'USD',
      bankAccountId: 'bank1'
    },
    {
      id: 'inv2',
      investmentEntity: 'Vodacom Tanzania PLC',
      entityType: 'Corporation',
      investmentType: 'Stocks',
      investmentDate: '2024-03-10',
      amount: 25000000,
      expectedReturnRate: 12.0,
      expectedReturnAmount: 3000000,
      maturityDate: '2025-03-10',
      riskLevel: 'Medium',
      description: 'Equity investment in telecommunications',
      status: 'Active',
      actualReturns: 1800000,
      currency: 'USD',
      bankAccountId: 'bank1'
    }
  ],

  bankAccounts: [
    { id: 'bank1', name: 'Main Operating Account', bank: 'CRDB Bank PLC', accountNumber: '0150-XXXX-4401', currency: 'USD', openingBalance: 120000000 },
    { id: 'bank2', name: 'Local Settlements Account', bank: 'NMB Bank PLC', accountNumber: '2041-XXXX-8817', currency: 'TZS', openingBalance: 8500000000 }
  ],

  manualJournals: [],
  auditLog: []
};

export const useDataStore = create<DataStore>()(persist((set, get) => ({
  ...initialData,

  // Treaty actions
  addTreaty: (treaty) => set((state) => ({
    treaties: [...state.treaties, treaty],
    auditLog: [...state.auditLog, auditEntry({ action: 'CREATE', entity: 'Treaty', entityId: treaty.contractNumber, sourceModule: 'Treaty Management', newValue: treaty.treatyName })]
  })),

  updateTreaty: (id, updates) => set((state) => {
    const prev = state.treaties.find(t => t.id === id);
    return {
      treaties: state.treaties.map(treaty =>
        treaty.id === id ? { ...treaty, ...updates } : treaty
      ),
      auditLog: [...state.auditLog, auditEntry({
        action: 'UPDATE', entity: 'Treaty', entityId: prev?.contractNumber ?? id,
        sourceModule: 'Treaty Management', newValue: Object.keys(updates).join(', ')
      })]
    };
  }),
  
  getTreatyByContractNumber: (contractNumber) => {
    const state = get();
    return state.treaties.find(treaty => treaty.contractNumber === contractNumber);
  },

  // Claims actions
  addClaim: (claim) => set((state) => ({
    claims: [...state.claims, claim],
    auditLog: [...state.auditLog, auditEntry({ action: 'CREATE', entity: 'Claim', entityId: claim.claimNumber, sourceModule: 'Claims', newValue: `${claim.currency} ${claim.claimAmount.toLocaleString()}` })]
  })),

  updateClaim: (id, updates) => set((state) => {
    const prev = state.claims.find(c => c.id === id);
    return {
      claims: state.claims.map(claim =>
        claim.id === id ? { ...claim, ...updates } : claim
      ),
      auditLog: [...state.auditLog, auditEntry({
        action: updates.paidAmount !== undefined ? 'PAYMENT' : 'UPDATE',
        entity: 'Claim', entityId: prev?.claimNumber ?? id, sourceModule: 'Claims/Accounting',
        previousValue: prev ? prev.status : undefined,
        newValue: updates.status ?? Object.keys(updates).join(', ')
      })]
    };
  }),
  
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
        ),
        auditLog: [...state.auditLog, auditEntry({
          action: 'CONVERT', entity: 'Treaty', entityId: contract.contractNumber,
          sourceModule: 'Underwriting', previousValue: 'Draft contract', newValue: `Active treaty ${contract.treatyName}`
        })]
      }));
    }
  },

  // Premium booking actions
  addPremiumBooking: (treatyId, booking) => set((state) => {
    const treaty = state.treaties.find(t => t.id === treatyId);
    return {
      treaties: state.treaties.map(t =>
        t.id === treatyId
          ? { ...t, premiumBookings: [...(t.premiumBookings || []), booking] }
          : t
      ),
      auditLog: [...state.auditLog, auditEntry({
        action: 'CREATE', entity: 'PremiumBooking', entityId: booking.id,
        sourceModule: 'Treaty Management',
        newValue: `${booking.type} ${booking.amount.toLocaleString()} on ${treaty?.treatyName ?? treatyId}`
      })]
    };
  }),
  
  updatePremiumPaymentStatus: (treatyId, bookingId, status, paidAmount) => set((state) => ({
    treaties: state.treaties.map(treaty =>
      treaty.id === treatyId
        ? {
            ...treaty,
            premiumBookings: treaty.premiumBookings?.map(booking =>
              booking.id === bookingId
                ? { ...booking, status, paidAmount }
                : booking
            )
          }
        : treaty
    )
  })),

  // Investment actions
  addInvestment: (investment) => set((state) => ({
    investments: [...state.investments, investment],
    auditLog: [...state.auditLog, auditEntry({
      action: 'CREATE', entity: 'Investment', entityId: investment.id,
      sourceModule: 'Accounting', newValue: `${investment.investmentEntity} ${investment.currency} ${investment.amount.toLocaleString()}`
    })]
  })),

  updateInvestment: (id, updates) => set((state) => {
    const prev = state.investments.find(i => i.id === id);
    return {
      investments: state.investments.map(inv =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
      auditLog: [...state.auditLog, auditEntry({
        action: 'UPDATE', entity: 'Investment', entityId: id, sourceModule: 'Accounting',
        previousValue: prev ? `${prev.status}, returns ${prev.actualReturns.toLocaleString()}` : undefined,
        newValue: Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')
      })]
    };
  }),

  // Bank account actions
  addBankAccount: (account) => set((state) => ({
    bankAccounts: [...state.bankAccounts, account],
    auditLog: [...state.auditLog, auditEntry({
      action: 'CREATE', entity: 'BankAccount', entityId: account.id,
      sourceModule: 'Accounting', newValue: `${account.name} (${account.bank}, ${account.currency})`
    })]
  })),

  // Manual journal actions
  addManualJournal: (journal) => set((state) => ({
    manualJournals: [...state.manualJournals, journal],
    auditLog: [...state.auditLog, auditEntry({
      action: 'CREATE', entity: 'Journal', entityId: journal.id, sourceModule: 'Accounting',
      newValue: `${journal.debitAccount} / ${journal.creditAccount} ${journal.amount.toLocaleString()} — ${journal.narration}`
    })]
  })),

  // Audit trail
  logAudit: (entry) => set((state) => ({
    auditLog: [...state.auditLog, auditEntry(entry)]
  })),

  resetData: () => set((state) => ({
    ...initialData,
    auditLog: [...state.auditLog, auditEntry({ action: 'RESET', entity: 'DataStore', entityId: 'all', sourceModule: 'Settings', newValue: 'Restored seed data' })]
  }))
}), { name: 'afrirevision-data' }));