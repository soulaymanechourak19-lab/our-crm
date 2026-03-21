<?php

namespace App\Services;

use Modules\User\Entities\Quotation;
use Modules\User\Entities\QuotationItem;
use Modules\User\Entities\Customer;
use Modules\User\Entities\Lead;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class QuotationService
{
    /**
     * Generate a unique quotation number: DEV-{YEAR}-{SEQUENCE}
     */
    public function generateNumber(): string
    {
        $year = date('Y');
        $prefix = "DEV-{$year}-";

        $lastQuotation = Quotation::where('number', 'like', "{$prefix}%")
            ->orderBy('number', 'desc')
            ->first();

        if ($lastQuotation) {
            $lastNumber = (int) str_replace($prefix, '', $lastQuotation->number);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate totals for a quotation from its items.
     */
    public function calculateTotals(array $items, float $taxRate = 20.0): array
    {
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
        }

        $tax = round($subtotal * ($taxRate / 100), 2);
        $total = $subtotal + $tax;

        return [
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax' => $tax,
            'total' => $total,
        ];
    }

    /**
     * Convert an accepted quotation to a transaction.
     * Optionally convert the lead to a customer too.
     */
    public function convertToTransaction(Quotation $quotation): array
    {
        if (!$quotation->canBeConverted()) {
            return ['success' => false, 'message' => 'Quotation cannot be converted'];
        }

        return DB::transaction(function () use ($quotation) {
            $customer = $quotation->customer;

            // If quotation is for a lead, convert lead to customer first
            if (!$customer && $quotation->lead_id) {
                $lead = $quotation->lead;
                if ($lead && $lead->canBeConverted()) {
                    $customer = Customer::create([
                        'name' => $lead->contact_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'converted_from_lead_id' => $lead->id,
                        'loyalty_score' => 20, // Conversion bonus
                    ]);
                    $lead->update(['status' => 'converted']);
                    $quotation->update(['customer_id' => $customer->id]);
                }
            }

            if (!$customer) {
                return ['success' => false, 'message' => 'No customer linked to this quotation'];
            }

            // Create transactions for each quotation item
            $transactions = [];
            foreach ($quotation->items as $item) {
                if ($item->product_id) {
                    $transactions[] = Transaction::create([
                        'client_id' => $customer->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'price' => $item->total,
                        'date' => now(),
                        'converted_from_lead_id' => $quotation->lead_id,
                    ]);
                }
            }

            $quotation->update(['status' => 'converted']);

            return [
                'success' => true,
                'customer' => $customer,
                'transactions' => $transactions,
                'message' => 'Quotation converted successfully',
            ];
        });
    }

    /**
     * Generate PDF for a quotation.
     */
    public function generatePDF(Quotation $quotation)
    {
        $quotation->load('items.product', 'lead', 'customer', 'creator');

        $pdf = Pdf::loadView('pdf.quotation', [
            'quotation' => $quotation,
        ]);

        return $pdf;
    }
}
