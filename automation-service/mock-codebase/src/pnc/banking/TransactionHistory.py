"""
PNC Transaction History Service
Retrieves, filters, and exports transaction data

Integration: PNC Core Banking System, Tableau, CSV/PDF Export
Compliance: GLBA, SOC 2, 7-year data retention (FDIC)
Features: Advanced filtering, categorization, export
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum

from pnc.core import CoreBankingClient
from pnc.security import require_auth, audit_log
from pnc.models import Transaction, TransactionCategory


class TransactionType(Enum):
    """Transaction types in PNC system"""
    DEBIT = "debit"
    CREDIT = "credit"
    TRANSFER = "transfer"
    ATM_WITHDRAWAL = "atm_withdrawal"
    CHECK = "check"
    FEE = "fee"
    INTEREST = "interest"
    REFUND = "refund"


class TransactionStatus(Enum):
    """Transaction processing status"""
    PENDING = "pending"
    POSTED = "posted"
    VOID = "void"
    DECLINED = "declined"


class TransactionHistoryService:
    """
    Service for querying and analyzing transaction history
    """

    def __init__(self):
        self.core_client = CoreBankingClient()

    @require_auth
    @audit_log(action="query_transactions")
    def get_transactions(
        self,
        account_id: str,
        customer_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        transaction_types: Optional[List[TransactionType]] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        search_query: Optional[str] = None,
        status: Optional[TransactionStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Advanced transaction query with filtering

        Args:
            account_id: Account to query
            customer_id: Customer ID for auth
            start_date: Filter from date
            end_date: Filter to date
            transaction_types: Filter by types
            min_amount: Minimum transaction amount
            max_amount: Maximum transaction amount
            search_query: Search in description/merchant
            status: Filter by status
            limit: Results per page
            offset: Pagination offset

        Returns:
            {
                "transactions": List[Transaction],
                "total_count": int,
                "page_info": {...}
            }
        """
        # Default to last 30 days
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()

        # Build query parameters
        filters = {
            "account_id": account_id,
            "start_date": start_date,
            "end_date": end_date,
            "limit": min(limit, 500),
            "offset": offset
        }

        if transaction_types:
            filters["transaction_types"] = [t.value for t in transaction_types]

        if min_amount is not None:
            filters["min_amount"] = min_amount

        if max_amount is not None:
            filters["max_amount"] = max_amount

        if search_query:
            filters["search"] = search_query

        if status:
            filters["status"] = status.value

        try:
            # Query core banking system
            result = self.core_client.query_transactions_advanced(filters)

            # Add computed fields
            transactions = result["transactions"]
            for txn in transactions:
                txn["category"] = self._categorize_transaction(txn)
                txn["formatted_amount"] = self._format_currency(txn["amount"])

            return {
                "transactions": transactions,
                "total_count": result["total_count"],
                "page_info": {
                    "current_page": offset // limit + 1,
                    "per_page": limit,
                    "total_pages": (result["total_count"] + limit - 1) // limit
                },
                "summary": self._calculate_summary(transactions)
            }

        except Exception as e:
            raise RuntimeError(f"Transaction query failed: {str(e)}")

    @require_auth
    def get_spending_by_category(
        self,
        account_id: str,
        customer_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Decimal]:
        """
        Analyze spending by category for budgeting

        Used by: PNC Virtual Wallet, Spending Insights
        """
        transactions = self.get_transactions(
            account_id=account_id,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date,
            transaction_types=[TransactionType.DEBIT]
        )["transactions"]

        # Group by category
        category_totals = {}
        for txn in transactions:
            category = txn["category"]
            amount = abs(txn["amount"])  # Debits are negative

            if category not in category_totals:
                category_totals[category] = Decimal("0")

            category_totals[category] += amount

        # Sort by amount descending
        return dict(
            sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        )

    @require_auth
    def detect_recurring_transactions(
        self,
        account_id: str,
        customer_id: str,
        lookback_days: int = 90
    ) -> List[Dict[str, Any]]:
        """
        Identify recurring transactions (subscriptions, bills)

        Algorithm:
        - Group transactions by merchant
        - Check for regular intervals (weekly, monthly)
        - Identify similar amounts

        Used by: Low Cash Mode, Budget Planner
        """
        start_date = datetime.now() - timedelta(days=lookback_days)

        transactions = self.get_transactions(
            account_id=account_id,
            customer_id=customer_id,
            start_date=start_date,
            transaction_types=[TransactionType.DEBIT]
        )["transactions"]

        # Group by merchant
        merchant_groups = {}
        for txn in transactions:
            merchant = txn.get("merchant_name") or txn["description"]
            if merchant not in merchant_groups:
                merchant_groups[merchant] = []
            merchant_groups[merchant].append(txn)

        # Analyze patterns
        recurring = []
        for merchant, txns in merchant_groups.items():
            if len(txns) >= 3:  # At least 3 occurrences
                pattern = self._analyze_recurrence_pattern(txns)
                if pattern["is_recurring"]:
                    recurring.append({
                        "merchant": merchant,
                        "frequency": pattern["frequency"],
                        "average_amount": pattern["average_amount"],
                        "next_expected": pattern["next_date"],
                        "occurrences": len(txns)
                    })

        return recurring

    @require_auth
    @audit_log(action="export_transactions")
    def export_transactions(
        self,
        account_id: str,
        customer_id: str,
        start_date: datetime,
        end_date: datetime,
        format: str = "csv"  # csv, pdf, qbo (QuickBooks)
    ) -> bytes:
        """
        Export transactions for customer download

        Formats:
        - CSV: Excel-compatible
        - PDF: Formatted statement
        - QBO: QuickBooks import

        Compliance: Customer data export right (CCPA, GDPR)
        """
        transactions = self.get_transactions(
            account_id=account_id,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000  # No pagination for export
        )["transactions"]

        if format == "csv":
            return self._export_csv(transactions)
        elif format == "pdf":
            return self._export_pdf(transactions, account_id)
        elif format == "qbo":
            return self._export_quickbooks(transactions)
        else:
            raise ValueError(f"Unsupported export format: {format}")

    # Private helper methods

    def _categorize_transaction(self, transaction: Dict[str, Any]) -> str:
        """
        Categorize transaction using merchant data and description

        Categories:
        - Groceries, Dining, Gas, Shopping, Bills, Travel, Healthcare, etc.

        In production: Would use ML model trained on historical data
        """
        description = transaction.get("description", "").lower()
        merchant_category = transaction.get("merchant_category_code")

        # Simple rule-based categorization (in production: use ML)
        if any(word in description for word in ["grocery", "supermarket", "food"]):
            return "Groceries"
        elif any(word in description for word in ["restaurant", "cafe", "dining"]):
            return "Dining"
        elif any(word in description for word in ["gas", "fuel", "shell", "exxon"]):
            return "Gas & Auto"
        elif any(word in description for word in ["electric", "water", "internet"]):
            return "Bills & Utilities"
        elif merchant_category in ["5411", "5422"]:  # Grocery store MCC
            return "Groceries"
        else:
            return "Other"

    def _analyze_recurrence_pattern(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze if transactions follow a recurring pattern
        """
        if len(transactions) < 3:
            return {"is_recurring": False}

        # Sort by date
        sorted_txns = sorted(transactions, key=lambda t: t["date"])

        # Calculate intervals between transactions
        intervals = []
        for i in range(1, len(sorted_txns)):
            days_between = (sorted_txns[i]["date"] - sorted_txns[i-1]["date"]).days
            intervals.append(days_between)

        # Check if intervals are consistent
        avg_interval = sum(intervals) / len(intervals)
        variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)

        # Recurring if low variance (within 3 days)
        is_recurring = variance < 9

        if is_recurring:
            # Determine frequency
            if 6 <= avg_interval <= 8:
                frequency = "weekly"
            elif 25 <= avg_interval <= 35:
                frequency = "monthly"
            elif 12 <= avg_interval <= 16:
                frequency = "biweekly"
            else:
                frequency = "custom"

            # Calculate average amount
            amounts = [abs(t["amount"]) for t in sorted_txns]
            avg_amount = sum(amounts) / len(amounts)

            # Predict next date
            last_date = sorted_txns[-1]["date"]
            next_date = last_date + timedelta(days=int(avg_interval))

            return {
                "is_recurring": True,
                "frequency": frequency,
                "average_amount": Decimal(str(avg_amount)),
                "next_date": next_date
            }

        return {"is_recurring": False}

    def _calculate_summary(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics for transactions"""
        total_debits = sum(
            abs(t["amount"]) for t in transactions if t["amount"] < 0
        )
        total_credits = sum(
            t["amount"] for t in transactions if t["amount"] > 0
        )

        return {
            "total_debits": float(total_debits),
            "total_credits": float(total_credits),
            "net": float(total_credits - total_debits),
            "transaction_count": len(transactions)
        }

    def _format_currency(self, amount: Decimal) -> str:
        """Format amount as currency string"""
        return f"${abs(amount):,.2f}"

    def _export_csv(self, transactions: List[Dict[str, Any]]) -> bytes:
        """Export transactions as CSV"""
        # Implementation would generate CSV
        pass

    def _export_pdf(self, transactions: List[Dict[str, Any]], account_id: str) -> bytes:
        """Generate PDF statement"""
        # Implementation would generate PDF using reportlab or similar
        pass

    def _export_quickbooks(self, transactions: List[Dict[str, Any]]) -> bytes:
        """Export in QuickBooks QBO format"""
        # Implementation would generate QBO XML
        pass
