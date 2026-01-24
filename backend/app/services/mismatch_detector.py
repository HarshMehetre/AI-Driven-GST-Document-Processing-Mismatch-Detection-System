from typing import Dict, List, Tuple
import pandas as pd
from difflib import SequenceMatcher

class MismatchDetector:
    """Handles detection of mismatches between extracted invoices and GSTR2B"""
    
    def __init__(self):
        self.similarity_threshold = 0.85  # For fuzzy matching
    
    def detect_mismatches(self, extracted_invoices: List[Dict], gstr2b_data: Dict) -> Dict:
        """
        Compare extracted invoices with GSTR2B and identify mismatches
        
        Args:
            extracted_invoices: List of extracted invoice data
            gstr2b_data: GSTR2B data containing reported invoices
        
        Returns:
            Dictionary with mismatch analysis and report cards
        """
        gstr2b_invoices = self._parse_gstr2b(gstr2b_data)
        
        matched_pairs = []
        unmatched_extracted = []
        unmatched_gstr2b = []
        mismatch_details = []
        
        # Track which GSTR2B invoices have been matched
        matched_gstr2b_indices = set()
        
        # Compare each extracted invoice with GSTR2B invoices
        for extracted in extracted_invoices:
            if extracted.get("status") == "error":
                unmatched_extracted.append({
                    "invoice": extracted,
                    "reason": "Failed to extract data"
                })
                continue
            
            best_match = None
            best_score = 0
            best_index = None
            
            # Find best matching GSTR2B invoice
            for idx, gstr2b in enumerate(gstr2b_invoices):
                if idx in matched_gstr2b_indices:
                    continue
                
                score, mismatches = self._calculate_match_score(extracted, gstr2b)
                
                if score > best_score:
                    best_score = score
                    best_match = (gstr2b, mismatches)
                    best_index = idx
            
            if best_score >= self.similarity_threshold:
                matched_gstr2b_indices.add(best_index)
                gstr2b, mismatches = best_match
                
                matched_pairs.append({
                    "extracted": extracted,
                    "gstr2b": gstr2b,
                    "match_score": best_score,
                    "mismatches": mismatches
                })
                
                if mismatches:
                    mismatch_details.append({
                        "invoice_number": extracted.get("invoice_number", "UNKNOWN"),
                        "match_score": best_score,
                        "issues": mismatches
                    })
            else:
                unmatched_extracted.append({
                    "invoice": extracted,
                    "reason": "No matching invoice in GSTR2B"
                })
        
        # Remaining GSTR2B invoices that weren't matched
        for idx, gstr2b in enumerate(gstr2b_invoices):
            if idx not in matched_gstr2b_indices:
                unmatched_gstr2b.append(gstr2b)
        
        return {
            "status": "completed",
            "summary": {
                "total_extracted": len(extracted_invoices),
                "total_gstr2b": len(gstr2b_invoices),
                "matched": len(matched_pairs),
                "unmatched_extracted": len(unmatched_extracted),
                "unmatched_gstr2b": len(unmatched_gstr2b),
                "mismatch_count": len(mismatch_details)
            },
            "matched_pairs": matched_pairs,
            "unmatched_extracted": unmatched_extracted,
            "unmatched_gstr2b": unmatched_gstr2b,
            "mismatches": mismatch_details
        }
    
    def _parse_gstr2b(self, gstr2b_data: Dict) -> List[Dict]:
        """Parse GSTR2B data into standardized format"""
        invoices = []
        
        # Handle different GSTR2B formats
        if isinstance(gstr2b_data, dict):
            if "invoices" in gstr2b_data:
                invoices = gstr2b_data["invoices"]
            elif "data" in gstr2b_data:
                invoices = gstr2b_data["data"].get("invoices", [])
        elif isinstance(gstr2b_data, list):
            invoices = gstr2b_data
        
        # Normalize invoice format
        normalized = []
        for inv in invoices:
            if isinstance(inv, dict):
                normalized.append({
                    "invoice_number": inv.get("inv_no") or inv.get("invoice_number"),
                    "invoice_date": inv.get("inv_dt") or inv.get("invoice_date"),
                    "gstin": inv.get("gstin"),
                    "invoice_amount": float(inv.get("inv_amt", 0)),
                    "tax_amount": float(inv.get("tax_amt", 0)),
                    "total_amount": float(inv.get("total_amt", 0)),
                    "source": "gstr2b"
                })
        
        return normalized
    
    def _calculate_match_score(self, extracted: Dict, gstr2b: Dict) -> Tuple[float, List[str]]:
        """
        Calculate similarity score between extracted and GSTR2B invoice
        
        Returns:
            Tuple of (score, list of mismatches)
        """
        mismatches = []
        scores = []
        
        # Invoice number comparison (high weight)
        inv_num_score = self._string_similarity(
            str(extracted.get("invoice_number", "")),
            str(gstr2b.get("invoice_number", ""))
        )
        scores.append(inv_num_score * 0.4)
        if inv_num_score < 0.9:
            mismatches.append(f"Invoice number mismatch: {extracted.get('invoice_number')} vs {gstr2b.get('invoice_number')}")
        
        # Date comparison (medium weight)
        date_score = 1.0 if extracted.get("invoice_date") == gstr2b.get("invoice_date") else 0.0
        scores.append(date_score * 0.2)
        if date_score < 1.0:
            mismatches.append(f"Date mismatch: {extracted.get('invoice_date')} vs {gstr2b.get('invoice_date')}")
        
        # GSTIN comparison (medium weight)
        gstin_score = 1.0 if extracted.get("gstin") == gstr2b.get("gstin") else 0.0
        scores.append(gstin_score * 0.2)
        if gstin_score < 1.0:
            mismatches.append(f"GSTIN mismatch: {extracted.get('gstin')} vs {gstr2b.get('gstin')}")
        
        # Amount comparison (high weight, allow 5% variance)
        ext_amount = float(extracted.get("total_amount", 0))
        gstr_amount = float(gstr2b.get("total_amount", 0))
        if gstr_amount > 0:
            amount_diff_percent = abs(ext_amount - gstr_amount) / gstr_amount * 100
            amount_score = max(0, 1 - (amount_diff_percent / 100))
        else:
            amount_score = 0.0
        
        scores.append(amount_score * 0.2)
        if amount_score < 0.95:
            mismatches.append(f"Amount mismatch: {ext_amount} vs {gstr_amount}")
        
        overall_score = sum(scores)
        return overall_score, mismatches
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity ratio"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def generate_report_card(self, mismatch_data: Dict) -> Dict:
        """Generate detailed report card for findings"""
        summary = mismatch_data["summary"]
        
        report_card = {
            "title": "GST Document Mismatch Report",
            "generated_at": pd.Timestamp.now().isoformat(),
            "summary": {
                "total_invoices_extracted": summary["total_extracted"],
                "total_invoices_gstr2b": summary["total_gstr2b"],
                "successfully_matched": summary["matched"],
                "discrepancies_found": summary["mismatch_count"],
                "missing_from_gstr2b": summary["unmatched_extracted"],
                "extra_in_gstr2b": summary["unmatched_gstr2b"],
                "compliance_status": self._get_compliance_status(summary)
            },
            "detail": {
                "mismatches": mismatch_data["mismatches"],
                "unmatched_extracted": mismatch_data["unmatched_extracted"],
                "unmatched_gstr2b": mismatch_data["unmatched_gstr2b"]
            }
        }
        
        return report_card
    
    def _get_compliance_status(self, summary: Dict) -> str:
        """Determine compliance status based on mismatch count"""
        total = summary["total_extracted"]
        matched = summary["matched"]
        mismatches = summary["mismatch_count"]
        
        if total == 0:
            return "NO_DATA"
        
        match_rate = (matched / total) * 100
        mismatch_rate = (mismatches / matched) * 100 if matched > 0 else 0
        
        if match_rate == 100 and mismatch_rate == 0:
            return "COMPLIANT"
        elif match_rate >= 95:
            return "MINOR_DISCREPANCIES"
        elif match_rate >= 80:
            return "MAJOR_DISCREPANCIES"
        else:
            return "NON_COMPLIANT"
