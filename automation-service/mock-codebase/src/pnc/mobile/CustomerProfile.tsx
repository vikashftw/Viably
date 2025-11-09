/**
 * PNC Customer Profile Component
 * Displays customer information and account summary
 *
 * Integration: PNC Core Banking API, Salesforce CRM
 * Compliance: GLBA, SOC 2, CCPA, GDPR (for international customers)
 * Security: PII data encrypted, audit trail required
 */

import React, { useState, useEffect } from 'react';
import { CustomerService } from '../services/CustomerService';
import { useAuth } from '@pnc/auth-context';
import { VirtualWalletCard } from './VirtualWalletCard';

interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  segment: 'retail' | 'commercial' | 'wealth';
  memberSince: Date;
  preferredBranch?: string;
  virtualWalletEnabled: boolean;
  lowCashModeEnabled: boolean;
}

interface AccountSummary {
  accounts: Account[];
  totalBalance: number;
  availableCredit: number;
  rewardsPoints: number;
}

interface Account {
  accountId: string;
  type: 'checking' | 'savings' | 'credit' | 'loan';
  nickname: string;
  balance: number;
  available: number;
  lastTransaction: Date;
}

export function CustomerProfile() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [user]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // Parallel API calls for better performance
      const [customerData, accountSummary] = await Promise.all([
        CustomerService.getProfile(user.customerId),
        CustomerService.getAccountSummary(user.customerId)
      ]);

      setCustomer(customerData);
      setSummary(accountSummary);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVirtualWallet = async () => {
    if (!customer) return;

    try {
      await CustomerService.updatePreferences(customer.customerId, {
        virtualWalletEnabled: !customer.virtualWalletEnabled
      });

      setCustomer({
        ...customer,
        virtualWalletEnabled: !customer.virtualWalletEnabled
      });
    } catch (error) {
      console.error('Failed to toggle Virtual Wallet:', error);
    }
  };

  const toggleLowCashMode = async () => {
    if (!customer) return;

    try {
      await CustomerService.updatePreferences(customer.customerId, {
        lowCashModeEnabled: !customer.lowCashModeEnabled
      });

      setCustomer({
        ...customer,
        lowCashModeEnabled: !customer.lowCashModeEnabled
      });
    } catch (error) {
      console.error('Failed to toggle Low Cash Mode:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your profile...</div>;
  }

  if (!customer || !summary) {
    return <div className="error">Unable to load profile</div>;
  }

  return (
    <div className="customer-profile">
      <header className="profile-header">
        <div className="avatar">
          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
        </div>
        <div className="info">
          <h1>{customer.firstName} {customer.lastName}</h1>
          <p className="segment">{getSegmentLabel(customer.segment)}</p>
          <p className="member-since">
            Member since {new Date(customer.memberSince).getFullYear()}
          </p>
        </div>
      </header>

      <section className="account-summary">
        <h2>Account Summary</h2>
        <div className="summary-cards">
          <SummaryCard
            title="Total Balance"
            value={formatCurrency(summary.totalBalance)}
            icon="balance"
          />
          <SummaryCard
            title="Available Credit"
            value={formatCurrency(summary.availableCredit)}
            icon="credit"
          />
          <SummaryCard
            title="Rewards Points"
            value={summary.rewardsPoints.toLocaleString()}
            icon="rewards"
          />
        </div>
      </section>

      <section className="accounts">
        <h2>Your Accounts</h2>
        {summary.accounts.map(account => (
          <AccountCard key={account.accountId} account={account} />
        ))}
      </section>

      {customer.virtualWalletEnabled && (
        <section className="virtual-wallet">
          <VirtualWalletCard
            customerId={customer.customerId}
            lowCashModeEnabled={customer.lowCashModeEnabled}
            onToggleLowCashMode={toggleLowCashMode}
          />
        </section>
      )}

      <section className="preferences">
        <h2>Banking Preferences</h2>

        <div className="preference-item">
          <div>
            <h3>PNC Virtual Wallet</h3>
            <p>Organize your money with Spend, Reserve, and Growth</p>
          </div>
          <toggle
            checked={customer.virtualWalletEnabled}
            onChange={toggleVirtualWallet}
          />
        </div>

        <div className="preference-item">
          <div>
            <h3>Low Cash Mode</h3>
            <p>Get alerts and tools when running low on funds</p>
          </div>
          <toggle
            checked={customer.lowCashModeEnabled}
            onChange={toggleLowCashMode}
            disabled={!customer.virtualWalletEnabled}
          />
        </div>

        {customer.preferredBranch && (
          <div className="preference-item">
            <div>
              <h3>Preferred Branch</h3>
              <p>{customer.preferredBranch}</p>
            </div>
            <button>Change</button>
          </div>
        )}
      </section>

      <section className="privacy">
        <h2>Privacy & Security</h2>
        <button>Manage Privacy Settings</button>
        <button>View Audit Log</button>
        <p className="disclaimer">
          Your information is protected by PNC's Privacy Framework.
          We comply with GLBA, SOC 2, and state privacy laws.
        </p>
      </section>
    </div>
  );
}

function getSegmentLabel(segment: Customer['segment']): string {
  switch (segment) {
    case 'retail': return 'Personal Banking';
    case 'commercial': return 'Business Banking';
    case 'wealth': return 'Wealth Management';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
}

function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className={`icon ${icon}`} />
      <h3>{title}</h3>
      <p className="value">{value}</p>
    </div>
  );
}

interface AccountCardProps {
  account: Account;
}

function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="account-card">
      <div className="account-type">{account.type}</div>
      <h3>{account.nickname}</h3>
      <div className="balances">
        <div>
          <span className="label">Balance:</span>
          <span className="amount">{formatCurrency(account.balance)}</span>
        </div>
        <div>
          <span className="label">Available:</span>
          <span className="amount">{formatCurrency(account.available)}</span>
        </div>
      </div>
      <p className="last-transaction">
        Last transaction: {new Date(account.lastTransaction).toLocaleDateString()}
      </p>
    </div>
  );
}
