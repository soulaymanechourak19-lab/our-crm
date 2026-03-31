<?php

namespace App\Http\Controllers;

use App\Services\QuotationService;
use Modules\User\Entities\Quotation;
use Modules\User\Entities\QuotationItem;
use Modules\User\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\QuotationSentMail;
use App\Mail\QuotationAcceptedMail;

class QuotationController extends Controller
{
    protected QuotationService $quotationService;

    public function __construct(QuotationService $quotationService)
    {
        $this->quotationService = $quotationService;
    }

    /**
     * List quotations with filtering.
     */
    public function index(Request $request)
    {
        $query = Quotation::with('lead', 'customer', 'creator', 'items');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    /**
     * Create a new quotation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'valid_until' => 'nullable|date|after:today',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $taxRate = $validated['tax_rate'] ?? 20.0;
            $totals = $this->quotationService->calculateTotals($validated['items'], $taxRate);

            $quotation = Quotation::create([
                'lead_id' => $validated['lead_id'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'number' => $this->quotationService->generateNumber(),
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subtotal' => $totals['subtotal'],
                'tax_rate' => $totals['tax_rate'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'status' => 'draft',
                'valid_until' => $validated['valid_until'] ?? now()->addDays(30),
                'created_by' => Auth::id() ?? 1,
            ]);

            foreach ($validated['items'] as $item) {
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return response()->json($quotation->load('items', 'lead', 'customer', 'creator'), 201);
        });
    }

    /**
     * Show a single quotation.
     */
    public function show(Quotation $quotation)
    {
        return response()->json(
            $quotation->load('items.product', 'lead', 'customer', 'creator')
        );
    }

    /**
     * Update a quotation (only drafts).
     */
    public function update(Request $request, Quotation $quotation)
    {
        if (!$quotation->isDraft()) {
            return response()->json(['message' => 'Only draft quotations can be edited'], 400);
        }

        $validated = $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'valid_until' => 'nullable|date|after_or_equal:today',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:quotation_items,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ], [
            'valid_until.after_or_equal' => 'Validity date cannot be in the past.',
        ]);

        return DB::transaction(function () use ($validated, $quotation) {
            $taxRate = $validated['tax_rate'] ?? $quotation->tax_rate;
            $totals = $this->quotationService->calculateTotals($validated['items'], $taxRate);

            $quotation->update([
                'lead_id' => $validated['lead_id'] ?? $quotation->lead_id,
                'customer_id' => $validated['customer_id'] ?? $quotation->customer_id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subtotal' => $totals['subtotal'],
                'tax_rate' => $totals['tax_rate'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'valid_until' => $validated['valid_until'] ?? $quotation->valid_until,
            ]);

            // Replace items
            $quotation->items()->delete();
            foreach ($validated['items'] as $item) {
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return response()->json($quotation->load('items', 'lead', 'customer', 'creator'));
        });
    }

    /**
     * Delete a quotation.
     */
    public function destroy(Quotation $quotation)
    {
        $quotation->delete();
        return response()->json(['message' => 'Quotation deleted successfully']);
    }

    /**
     * Send a quotation to the lead/customer.
     */
    public function send(Quotation $quotation)
    {
        if (!$quotation->canBeSent()) {
            return response()->json(['message' => 'Quotation cannot be sent in current status'], 400);
        }

        $quotation->update(['status' => 'sent']);

        // Send email
        $email = $quotation->lead?->email ?? $quotation->customer?->email;
        if ($email) {
            try {
                Mail::to($email)->send(new QuotationSentMail($quotation));
            } catch (\Exception $e) {
                // Log but don't fail — email sending is best effort
                \Log::warning('Failed to send quotation email: ' . $e->getMessage());
            }
        }

        return response()->json($quotation->load('items', 'lead', 'customer'));
    }

    /**
     * Update quotation status (accept/reject).
     */
    public function updateStatus(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'status' => 'required|in:viewed,accepted,rejected',
        ]);

        // Enforce status workflow transitions
        if (!$quotation->canTransitionTo($validated['status'])) {
            return response()->json([
                'message' => "Cannot transition from '{$quotation->status}' to '{$validated['status']}'. Invalid status progression."
            ], 422);
        }

        // Check if quotation has expired
        if ($validated['status'] === 'accepted' && $quotation->valid_until && $quotation->valid_until->isPast()) {
            return response()->json([
                'message' => 'Cannot accept an expired quotation. The validity date has passed.'
            ], 422);
        }

        $quotation->update(['status' => $validated['status']]);

        if ($validated['status'] === 'accepted') {
            $email = $quotation->lead?->email ?? $quotation->customer?->email;
            if ($email) {
                try {
                    Mail::to($email)->send(new QuotationAcceptedMail($quotation));
                } catch (\Exception $e) {
                    \Log::warning('Failed to send quotation accepted email: ' . $e->getMessage());
                }
            }
        }

        return response()->json($quotation->load('items', 'lead', 'customer'));
    }

    /**
     * Convert an accepted quotation to transaction(s).
     */
    public function convert(Quotation $quotation)
    {
        $result = $this->quotationService->convertToTransaction($quotation);

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 400);
        }

        return response()->json($result);
    }

    /**
     * Download quotation as PDF.
     */
    public function downloadPdf(Quotation $quotation)
    {
        try {
            $pdf = $this->quotationService->generatePDF($quotation);
            return $pdf->download("quotation-{$quotation->number}.pdf");
        } catch (\Exception $e) {
            \Log::error('PDF generation failed: ' . $e->getMessage());
            return response()->json(['message' => 'PDF generation failed. Try installing barryvdh/laravel-dompdf.'], 500);
        }
    }

    /**
     * Get quotation statistics (conversion rates).
     */
    public function stats()
    {
        $total = Quotation::count();
        $byStatus = Quotation::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $converted = $byStatus['converted'] ?? 0;
        $accepted = $byStatus['accepted'] ?? 0;
        $conversionRate = $total > 0 ? round(($converted + $accepted) / $total * 100, 1) : 0;

        $totalValue = Quotation::sum('total');
        $acceptedValue = Quotation::whereIn('status', ['accepted', 'converted'])->sum('total');

        return response()->json([
            'total' => $total,
            'by_status' => $byStatus,
            'conversion_rate' => $conversionRate,
            'total_value' => $totalValue,
            'accepted_value' => $acceptedValue,
        ]);
    }
}
