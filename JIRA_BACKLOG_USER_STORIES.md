# PNC Banking App - Jira Backlog User Stories

**Project:** My Scrum Project
**Sprint Planning:** 10 Ready-to-Work User Stories
**Last Updated:** 2025-11-09

---

## SCRUM-15: Transaction Dispute Submission

**Type:** Story
**Priority:** High
**Story Points:** 8
**Labels:** backend frontend compliance customer-support

### User Story
As a **PNC mobile banking customer**,
I want to **flag and dispute suspicious or incorrect transactions**,
So that **I can protect my account and get fraudulent charges reversed quickly**.

### Description
Customers currently cannot dispute transactions directly in the app. They must call customer service or visit a branch, causing frustration and delays. This feature will allow in-app dispute submission with automatic case creation in Salesforce.

### Acceptance Criteria
- [ ] Add "Dispute Transaction" button on transaction detail view in mobile app
- [ ] Create dispute submission form with reason codes (fraud, duplicate, incorrect amount, merchant error)
- [ ] Integrate with Salesforce CRM to create case automatically
- [ ] Send confirmation email/SMS with case number
- [ ] Add dispute status tracking in transaction history
- [ ] Implement fraud detection ML service integration for auto-flagging
- [ ] Log all dispute actions for BSA/AML compliance audit trail
- [ ] Provisional credit rules: Immediate for fraud, 10-day investigation for disputes

### Technical Notes
**Files to Modify:**
- `src/pnc/banking/TransactionHistory.py` - Add `submit_dispute()` method
- `src/pnc/mobile/TransactionDetail.tsx` - New component for dispute UI
- New: `src/pnc/banking/DisputeService.py` - Salesforce integration

**APIs:**
- Salesforce Case API for case creation
- PNC Fraud Detection ML Service
- Email/SMS notification service

**Compliance:** GLBA audit logging required for all dispute actions

---

## SCRUM-16: Biometric Authentication for High-Risk Actions

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** security mobile frontend

### User Story
As a **security-conscious banking customer**,
I want to **use Face ID/Touch ID for sensitive actions like transfers and profile changes**,
So that **my account is protected even if someone has my password**.

### Description
Currently, only password authentication is used. Adding biometric authentication for high-risk actions (large transfers, profile changes, external account linking) will significantly improve security and meet modern banking standards.

### Acceptance Criteria
- [ ] Add biometric authentication prompt before transfers >$500
- [ ] Add biometric authentication for profile email/phone changes
- [ ] Add biometric authentication for linking external accounts
- [ ] Support Face ID (iOS), Touch ID (iOS), and Fingerprint (Android)
- [ ] Graceful fallback to password if biometric unavailable
- [ ] User setting to enable/disable biometric auth
- [ ] Log biometric authentication attempts in audit trail
- [ ] Display last biometric authentication timestamp in security settings

### Technical Notes
**Files to Modify:**
- `src/pnc/mobile/CustomerProfile.tsx` - Add biometric prompt before sensitive actions
- New: `src/pnc/mobile/BiometricAuth.ts` - Biometric service wrapper
- `src/pnc/banking/AccountService.py` - Add biometric verification to transfer method

**Dependencies:**
- React Native Biometrics library or expo-local-authentication
- PNC Auth Context (@pnc/auth-context) extension

**Security:** SOC 2 Type II compliance requirement

---

## SCRUM-17: AI-Powered Spending Insights Dashboard

**Type:** Story
**Priority:** Medium
**Story Points:** 13
**Labels:** frontend backend ml analytics

### User Story
As a **PNC Virtual Wallet customer**,
I want to **see AI-generated insights about my spending patterns**,
So that **I can make better financial decisions and save money**.

### Description
Leverage transaction history data to provide personalized spending insights: category breakdowns, trend analysis, anomaly detection, and actionable recommendations (e.g., "You spent 30% more on dining this month").

### Acceptance Criteria
- [ ] Create new "Insights" tab in mobile app
- [ ] Display monthly spending by category with visual charts
- [ ] Show spending trends (up/down) compared to previous months
- [ ] Detect spending anomalies ("You rarely spend at restaurants on Tuesdays")
- [ ] Provide personalized recommendations based on spending patterns
- [ ] Highlight potential savings opportunities (subscriptions not used, cheaper alternatives)
- [ ] Export insights as PDF report
- [ ] Integrate with Tableau Analytics for PM dashboard visibility
- [ ] Implement ML model for categorization accuracy >90%

### Technical Notes
**Files to Modify:**
- `src/pnc/mobile/SpendingInsights.tsx` - New insights dashboard component
- `src/pnc/banking/TransactionHistory.py` - Extend `get_spending_by_category()` with ML
- New: `src/pnc/ml/InsightsEngine.py` - ML service for pattern detection

**Integrations:**
- Tableau Analytics API for PM reporting
- PNC ML Platform for categorization
- Chart library: Recharts or Victory Native

**Data:** Use 12-month rolling window for trend analysis

---

## SCRUM-18: Branch Virtual Queue System

**Type:** Story
**Priority:** Medium
**Story Points:** 8
**Labels:** frontend backend branch-services

### User Story
As a **customer visiting a PNC branch**,
I want to **join a virtual queue from my phone before arriving**,
So that **I can minimize wait time and be seen by a specialist when I arrive**.

### Description
Integrate virtual queue management with the existing Branch Locator. Customers can see real-time wait times, join the queue remotely, and receive SMS notifications when it's their turn.

### Acceptance Criteria
- [ ] Add "Join Queue" button to each branch in BranchLocator
- [ ] Display estimated wait time and current queue position
- [ ] Send SMS notification 10 minutes before customer's turn
- [ ] Send SMS notification when customer is next in line
- [ ] Allow customer to cancel queue position
- [ ] Staff notification in branch system when customer checks in
- [ ] Timeout logic: Remove from queue if customer doesn't check in within 10 minutes
- [ ] Analytics: Track queue join rate, no-show rate, average wait time

### Technical Notes
**Files to Modify:**
- `src/pnc/mobile/BranchLocator.tsx` - Add queue join UI
- New: `src/pnc/mobile/QueueStatus.tsx` - Real-time queue position tracker
- New: `src/pnc/banking/QueueService.py` - Virtual queue management backend

**Integrations:**
- PNC Branch Management System (queue state)
- Twilio SMS API for notifications
- WebSocket or polling for real-time updates

**Business Rule:** Maximum queue size per branch: 20 customers

---

## SCRUM-19: Goal-Based Savings Accounts

**Type:** Story
**Priority:** Medium
**Story Points:** 8
**Labels:** backend frontend feature

### User Story
As a **PNC savings account holder**,
I want to **create multiple savings goals with target amounts and deadlines**,
So that **I can track progress toward specific financial objectives like vacations or home down payments**.

### Description
Enable customers to create virtual sub-accounts within their savings account, each with a name, target amount, target date, and automatic transfer rules.

### Acceptance Criteria
- [ ] Create new savings goal with name, target amount, target date
- [ ] Allocate funds from main savings to specific goals
- [ ] Display progress bar showing % toward goal
- [ ] Calculate required monthly savings to reach goal by deadline
- [ ] Set up automatic recurring transfers to goals
- [ ] Send notifications when goal is 50%, 75%, 100% complete
- [ ] Archive completed goals with achievement date
- [ ] Maximum 10 active goals per customer
- [ ] View all goals on Customer Profile dashboard

### Technical Notes
**Files to Modify:**
- `src/pnc/banking/AccountService.py` - Add `create_savings_goal()`, `allocate_to_goal()`
- `src/pnc/mobile/CustomerProfile.tsx` - Add goals widget
- New: `src/pnc/mobile/SavingsGoals.tsx` - Goals management UI
- Database schema update: New table `savings_goals`

**Business Rules:**
- Minimum goal amount: $100
- Maximum goal amount: $1,000,000
- Transfer limits: Same as account transfer limits

---

## SCRUM-20: Push Notification System

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** backend mobile infrastructure

### User Story
As a **PNC mobile banking user**,
I want to **receive real-time push notifications for important account events**,
So that **I'm immediately aware of transactions, low balances, and security alerts**.

### Description
Implement push notification infrastructure for critical banking events: large transactions, low balance warnings, failed login attempts, fraud alerts, appointment reminders, and promotional offers.

### Acceptance Criteria
- [ ] Integrate Firebase Cloud Messaging (FCM) for Android/iOS
- [ ] Send push notification for transactions >$500
- [ ] Send low balance alert when balance <$50
- [ ] Send fraud alert for suspicious transactions
- [ ] Send appointment reminder 24 hours and 1 hour before
- [ ] User preferences: Enable/disable by notification type
- [ ] Notification history log in app
- [ ] Deep linking: Tapping notification opens relevant screen
- [ ] Badge count for unread notifications

### Technical Notes
**Files to Modify:**
- New: `src/pnc/backend/NotificationService.py` - Notification orchestration
- `src/pnc/mobile/App.tsx` - FCM initialization
- New: `src/pnc/mobile/NotificationSettings.tsx` - User preferences
- `src/pnc/banking/AccountService.py` - Trigger notifications on transaction events

**Integrations:**
- Firebase Cloud Messaging (FCM)
- APNs for iOS
- PNC Fraud Detection ML Service for fraud alerts

**Compliance:** GLBA requires opt-in for marketing notifications

---

## SCRUM-21: Screen Reader Accessibility Compliance

**Type:** Story
**Priority:** Medium
**Story Points:** 5
**Labels:** frontend accessibility compliance

### User Story
As a **visually impaired PNC customer using a screen reader**,
I want to **navigate and use all banking features with VoiceOver/TalkBack**,
So that **I have equal access to mobile banking services**.

### Description
Audit and remediate all mobile components for WCAG 2.1 AA compliance. Ensure all interactive elements have proper labels, focus management works correctly, and complex UI (charts, maps) has text alternatives.

### Acceptance Criteria
- [ ] All buttons and links have accessible labels
- [ ] Form inputs have associated labels and error messages
- [ ] Images have alt text or marked as decorative
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] Interactive elements have minimum touch target size (44x44 pts)
- [ ] Color is not the only means of conveying information
- [ ] Maps (Branch Locator) have list view alternative
- [ ] Charts (Spending Insights) have data table alternative
- [ ] Pass automated accessibility testing (Axe, WAVE)
- [ ] Manual testing with VoiceOver (iOS) and TalkBack (Android)

### Technical Notes
**Files to Modify:**
- `src/pnc/mobile/CustomerProfile.tsx` - Add ARIA labels, semantic HTML
- `src/pnc/mobile/BranchLocator.tsx` - Add list view alternative to map
- `src/pnc/mobile/AppointmentScheduler.tsx` - Improve form accessibility
- All components: Add `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`

**Tools:**
- React Native Accessibility APIs
- Axe for automated testing
- Manual testing with screen readers

**Compliance:** ADA Title III, Section 508, WCAG 2.1 AA

---

## SCRUM-22: Recurring Payment Management

**Type:** Story
**Priority:** Low
**Story Points:** 3
**Labels:** backend frontend feature

### User Story
As a **PNC customer with multiple subscriptions**,
I want to **view and manage all my recurring payments in one place**,
So that **I can easily cancel unwanted subscriptions and avoid surprise charges**.

### Description
Leverage the existing `detect_recurring_transactions()` method in TransactionHistory to surface recurring payments in a dedicated UI. Allow customers to set alerts before charges or cancel directly (where supported by merchant).

### Acceptance Criteria
- [ ] Display all detected recurring transactions grouped by merchant
- [ ] Show frequency (weekly, monthly, annual) and average charge
- [ ] Calculate total monthly recurring spend
- [ ] Set up alerts before recurring charge (3 days, 1 day)
- [ ] Mark recurring payment as "essential" vs "discretionary" for budgeting
- [ ] Export recurring payments list as CSV
- [ ] Identify subscriptions with price increases over time
- [ ] Provide "Cancel Subscription" link to merchant website (best effort)

### Technical Notes
**Files to Modify:**
- `src/pnc/banking/TransactionHistory.py` - Enhance `detect_recurring_transactions()`
- New: `src/pnc/mobile/RecurringPayments.tsx` - Subscriptions management UI
- Database: Add `recurring_payment_preferences` table for alerts

**ML Enhancement:**
- Improve detection accuracy from current rule-based approach
- Detect subscription price increases automatically

---

## SCRUM-23: Branch Amenities and Services Filter

**Type:** Story
**Priority:** Low
**Story Points:** 2
**Labels:** frontend branch-services

### User Story
As a **PNC customer looking for a specific branch service**,
I want to **filter branches by amenities like 24-hour ATM, notary, safe deposit boxes, or coin machine**,
So that **I only see branches that meet my specific needs**.

### Description
Enhance the existing Branch Locator with amenity filtering. Many branches offer specialized services (notary, coin machines, extended hours) that customers need to find.

### Acceptance Criteria
- [ ] Add filter UI to Branch Locator with checkboxes for amenities
- [ ] Filter options: 24-Hour ATM, Notary Service, Safe Deposit Boxes, Coin Machine, Drive-Through, Weekend Hours, Wheelchair Accessible
- [ ] Update map markers and list results based on selected filters
- [ ] Display amenities as icons on each branch card
- [ ] Persist filter preferences across sessions
- [ ] Update branch data model to include amenities array
- [ ] Show "No branches found matching filters" message when appropriate

### Technical Notes
**Files to Modify:**
- `src/pnc/mobile/BranchLocator.tsx` - Add filter UI and filtering logic
- `src/pnc/mobile/LocationService.ts` - Update branch data type with amenities

**Data Source:**
- PNC Branch Management System API
- Branch amenities should be part of branch metadata

**Mock Data:** Add amenities field to mock branch data for testing

---

## SCRUM-24: Tax Document Export

**Type:** Story
**Priority:** Medium
**Story Points:** 5
**Labels:** backend frontend compliance reporting

### User Story
As a **PNC customer preparing my taxes**,
I want to **export transaction history and account statements formatted for tax purposes**,
So that **I can easily provide documentation to my accountant or tax software**.

### Description
Enhance the existing transaction export feature to support tax-specific formats: year-end summary with interest earned, categorized deductions, and export formats compatible with TurboTax, H&R Block, and generic CSV/PDF.

### Acceptance Criteria
- [ ] Add "Export for Taxes" option in transaction history
- [ ] Date range selector defaults to current tax year (Jan 1 - Dec 31)
- [ ] Generate year-end summary: total deposits, withdrawals, interest earned
- [ ] Categorize transactions by IRS tax categories (business expenses, medical, charitable donations)
- [ ] Export formats: PDF (readable), CSV (Excel), TXF (tax software), QBO (QuickBooks)
- [ ] Include account statements with interest for 1099-INT
- [ ] Disclaimer: "Consult your tax advisor. PNC does not provide tax advice."
- [ ] Email export to customer's registered email
- [ ] GLBA compliance: Log all tax export requests

### Technical Notes
**Files to Modify:**
- `src/pnc/banking/TransactionHistory.py` - Add `export_for_taxes()` method
- New: `src/pnc/backend/TaxExportService.py` - Tax-specific formatting logic
- `src/pnc/mobile/TransactionHistory.tsx` - Add tax export UI

**Formats:**
- PDF: Use ReportLab (Python) or similar
- TXF: Tax software exchange format
- QBO: QuickBooks format

**Compliance:**
- GLBA: Secure transmission of tax data
- Retention: 7 years per IRS requirements

---

## Summary Statistics

| Priority | Count | Total Story Points |
|----------|-------|--------------------|
| High     | 3     | 18                 |
| Medium   | 5     | 39                 |
| Low      | 2     | 5                  |
| **Total**| **10**| **62**             |

### Coverage by Type
- **Frontend:** 7 stories (70%)
- **Backend:** 9 stories (90%)
- **Security/Compliance:** 4 stories (40%)
- **Integrations:** 5 stories (50%)
- **ML/Analytics:** 2 stories (20%)

### Sprint Planning Recommendation
- **Sprint 1 (High Priority):** SCRUM-15, SCRUM-16, SCRUM-20 = 18 points
- **Sprint 2 (Medium Priority - Features):** SCRUM-17, SCRUM-19 = 21 points
- **Sprint 3 (Medium Priority - Services):** SCRUM-18, SCRUM-21, SCRUM-24 = 18 points
- **Sprint 4 (Low Priority - Polish):** SCRUM-22, SCRUM-23 = 5 points

---

## How to Use These Stories in Jira

1. **Create Epic:** "Mobile Banking Enhancements Q1 2025"
2. **Import Stories:** Copy each story into Jira with provided details
3. **Assign Team Members:** Based on labels (frontend → React devs, backend → Python devs)
4. **Link Dependencies:** SCRUM-17 depends on SCRUM-15 (transaction data)
5. **Add Subtasks:** Break down 8+ point stories into smaller tasks
6. **Demo Viably:** Use these as test inputs for Viably's analysis engine

---

**Generated for:** Viably Demo - NVIDIA + PNC Hackathon
**Mock Codebase:** `automation-service/mock-codebase/`
**Last Updated:** 2025-11-09
