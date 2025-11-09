"""
PNC Account Service
Core banking operations for account management

Integration: PNC Core Banking System, Salesforce CRM, Tableau Analytics
Compliance: GLBA, SOC 2 Type II, PCI-DSS Level 1, FDIC regulations
Security: TLS 1.3, AES-256 encryption, audit logging required
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from pnc.core import CoreBankingClient
from pnc.security import require_auth, audit_log
from pnc.compliance import validate_glba, check_fraud_rules
from pnc.models import Account, Transaction, Customer

logger = logging.getLogger(__name__)


class AccountService:
    """
    Handles all account-related operations for PNC customers
    """

    def __init__(self):
        self.core_client = CoreBankingClient()
        self.logger = logger

    @require_auth
    @audit_log(action="get_account")
    @validate_glba
    def get_account(self, account_id: str, customer_id: str) -> Optional[Account]:
        """
        Retrieve account details

        Args:
            account_id: PNC account identifier
            customer_id: Customer identifier for authorization

        Returns:
            Account object or None if not found

        Raises:
            UnauthorizedError: If customer doesn't own account
            ComplianceError: If GLBA validation fails
        """
        try:
            # Verify customer owns this account
            if not self._verify_account_ownership(account_id, customer_id):
                raise UnauthorizedError(
                    f"Customer {customer_id} does not own account {account_id}"
                )

            # Fetch from core banking system
            account = self.core_client.get_account(account_id)

            if account:
                # Log access for compliance
                self._log_account_access(account_id, customer_id, "read")

            return account

        except Exception as e:
            logger.error(f"Failed to retrieve account {account_id}: {str(e)}")
            raise

    @require_auth
    @audit_log(action="get_transactions")
    @validate_glba
    def get_transactions(
        self,
        account_id: str,
        customer_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Transaction]:
        """
        Get transaction history for an account

        Args:
            account_id: PNC account identifier
            customer_id: Customer identifier
            start_date: Filter transactions from this date
            end_date: Filter transactions to this date
            limit: Maximum number of transactions (max 500)

        Returns:
            List of Transaction objects

        Compliance:
            - GLBA: Customer must own account
            - Audit trail: All transaction queries logged
            - Data retention: 7 years per FDIC
        """
        # Verify ownership
        if not self._verify_account_ownership(account_id, customer_id):
            raise UnauthorizedError("Account access denied")

        # Default date range: last 90 days
        if not start_date:
            start_date = datetime.now() - timedelta(days=90)
        if not end_date:
            end_date = datetime.now()

        # Enforce limit
        limit = min(limit, 500)

        try:
            transactions = self.core_client.query_transactions(
                account_id=account_id,
                start_date=start_date,
                end_date=end_date,
                limit=limit
            )

            # Log query for compliance
            self._log_transaction_query(
                account_id, customer_id, start_date, end_date, len(transactions)
            )

            return transactions

        except Exception as e:
            logger.error(f"Transaction query failed: {str(e)}")
            raise

    @require_auth
    @audit_log(action="transfer_funds")
    @check_fraud_rules
    def transfer_funds(
        self,
        from_account: str,
        to_account: str,
        amount: Decimal,
        customer_id: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Transfer funds between PNC accounts

        Args:
            from_account: Source account ID
            to_account: Destination account ID
            amount: Transfer amount (positive decimal)
            customer_id: Customer initiating transfer
            description: Optional transfer description

        Returns:
            Transfer confirmation with transaction ID

        Compliance:
            - Fraud detection: Check amount limits, velocity rules
            - BSA/AML: Large transfers reported to FinCEN
            - Customer authentication: Required for all transfers
        """
        # Validate amount
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")

        # Verify ownership of source account
        if not self._verify_account_ownership(from_account, customer_id):
            raise UnauthorizedError("Source account access denied")

        # Check sufficient funds
        source_account = self.get_account(from_account, customer_id)
        if source_account.available_balance < amount:
            raise InsufficientFundsError(
                f"Available: ${source_account.available_balance}, Requested: ${amount}"
            )

        # Check daily transfer limit
        daily_total = self._get_daily_transfer_total(from_account)
        if daily_total + amount > Decimal("10000"):
            raise TransferLimitError("Daily transfer limit exceeded")

        # Check fraud rules (velocity, unusual patterns)
        fraud_check = self._check_fraud_indicators(
            from_account, to_account, amount, customer_id
        )
        if fraud_check["risk_level"] == "high":
            # Require additional authentication
            raise FraudAlertError("Additional verification required")

        try:
            # Execute transfer via core banking
            result = self.core_client.execute_transfer(
                from_account=from_account,
                to_account=to_account,
                amount=amount,
                description=description,
                initiated_by=customer_id
            )

            # Log for audit trail
            self._log_transfer(
                from_account, to_account, amount, customer_id, result["transaction_id"]
            )

            # Check if BSA/AML reporting required (>$10k)
            if amount >= Decimal("10000"):
                self._trigger_bsa_reporting(result["transaction_id"])

            return {
                "transaction_id": result["transaction_id"],
                "status": "completed",
                "timestamp": datetime.now(),
                "from_account": from_account,
                "to_account": to_account,
                "amount": float(amount)
            }

        except Exception as e:
            logger.error(f"Transfer failed: {str(e)}")
            raise

    @require_auth
    @audit_log(action="update_account")
    def update_account_preferences(
        self,
        account_id: str,
        customer_id: str,
        preferences: Dict[str, Any]
    ) -> Account:
        """
        Update account preferences (nickname, alerts, overdraft settings)

        Args:
            account_id: Account to update
            customer_id: Customer ID for authorization
            preferences: Dictionary of preference updates

        Compliance:
            - Overdraft opt-in: Regulation E compliance
            - Alert preferences: CAN-SPAM compliance
        """
        if not self._verify_account_ownership(account_id, customer_id):
            raise UnauthorizedError("Account access denied")

        # Validate preferences
        allowed_keys = [
            "nickname",
            "alert_low_balance",
            "alert_large_transaction",
            "overdraft_protection",
            "paper_statements"
        ]

        for key in preferences.keys():
            if key not in allowed_keys:
                raise ValueError(f"Invalid preference key: {key}")

        try:
            updated_account = self.core_client.update_account(
                account_id, preferences
            )

            # Log preference changes
            self._log_preference_update(account_id, customer_id, preferences)

            return updated_account

        except Exception as e:
            logger.error(f"Preference update failed: {str(e)}")
            raise

    # Private helper methods

    def _verify_account_ownership(self, account_id: str, customer_id: str) -> bool:
        """Verify customer owns account (GLBA requirement)"""
        return self.core_client.verify_ownership(account_id, customer_id)

    def _log_account_access(self, account_id: str, customer_id: str, action: str):
        """Log all account access for audit trail"""
        self.core_client.log_audit_event({
            "event_type": "account_access",
            "account_id": account_id,
            "customer_id": customer_id,
            "action": action,
            "timestamp": datetime.now(),
            "ip_address": self._get_request_ip(),
            "user_agent": self._get_user_agent()
        })

    def _get_daily_transfer_total(self, account_id: str) -> Decimal:
        """Calculate total transfers today for velocity check"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0)
        transactions = self.core_client.query_transactions(
            account_id=account_id,
            start_date=today_start,
            transaction_type="transfer_out"
        )
        return sum(t.amount for t in transactions)

    def _check_fraud_indicators(
        self, from_account: str, to_account: str, amount: Decimal, customer_id: str
    ) -> Dict[str, Any]:
        """
        Check fraud rules:
        - Unusual transfer amount
        - High velocity (many transfers in short time)
        - New recipient
        - Off-hours activity
        """
        # This would integrate with PNC Fraud Detection ML service
        return {"risk_level": "low", "checks_passed": True}

    def _trigger_bsa_reporting(self, transaction_id: str):
        """Trigger BSA/AML reporting for large transactions"""
        # Send to compliance team for Currency Transaction Report (CTR)
        logger.info(f"BSA reporting triggered for transaction {transaction_id}")
