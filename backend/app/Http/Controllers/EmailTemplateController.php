<?php

namespace App\Http\Controllers;

use Modules\User\Entities\EmailTemplate;
use Modules\User\Entities\EmailLog;
use Modules\User\Entities\Lead;
use Modules\User\Entities\Customer;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class EmailTemplateController extends Controller
{
    /**
     * List templates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::with('creator:id,name')->orderBy('updated_at', 'desc');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    /**
     * Create template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'category' => 'in:follow_up,welcome,proposal,reminder,custom',
        ]);

        $validated['created_by'] = auth()->id();
        $template = EmailTemplate::create($validated);
        AuditService::logCreated($template);

        return response()->json($template, 201);
    }

    /**
     * Show single template.
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->load('creator:id,name');
        return response()->json($emailTemplate);
    }

    /**
     * Update template.
     */
    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'category' => 'in:follow_up,welcome,proposal,reminder,custom',
            'is_active' => 'boolean',
        ]);

        $emailTemplate->fill($validated);
        AuditService::logUpdated($emailTemplate);
        $emailTemplate->save();

        return response()->json($emailTemplate);
    }

    /**
     * Delete template.
     */
    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        AuditService::logDeleted($emailTemplate);
        $emailTemplate->delete();
        return response()->json(['message' => 'Template deleted']);
    }

    /**
     * Preview a template with sample data.
     */
    public function preview(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $data = $this->buildMergeData($request);
        $rendered = $emailTemplate->render($data);

        return response()->json([
            'subject' => $rendered['subject'],
            'body' => $rendered['body'],
        ]);
    }

    /**
     * Send email using a template.
     */
    public function send(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'to_email' => 'required_without_all:lead_id,customer_id|email',
        ]);

        $data = $this->buildMergeData($request);
        $rendered = $emailTemplate->render($data);
        $toEmail = $request->to_email;

        // Determine recipient email
        if (!$toEmail && $request->lead_id) {
            $toEmail = Lead::find($request->lead_id)?->email;
        }
        if (!$toEmail && $request->customer_id) {
            $toEmail = Customer::find($request->customer_id)?->email;
        }

        if (!$toEmail) {
            return response()->json(['message' => 'No email address found'], 422);
        }

        $status = 'sent';
        try {
            Mail::raw($rendered['body'], function ($message) use ($toEmail, $rendered) {
                $message->to($toEmail)->subject($rendered['subject']);
            });
        } catch (\Exception $e) {
            $status = 'failed';
        }

        $log = EmailLog::create([
            'template_id' => $emailTemplate->id,
            'from_user_id' => auth()->id(),
            'to_email' => $toEmail,
            'subject' => $rendered['subject'],
            'body' => $rendered['body'],
            'lead_id' => $request->lead_id,
            'customer_id' => $request->customer_id,
            'status' => $status,
            'sent_at' => $status === 'sent' ? now() : null,
        ]);

        return response()->json([
            'message' => $status === 'sent' ? 'Email sent successfully' : 'Email sending failed',
            'log' => $log,
        ], $status === 'sent' ? 200 : 500);
    }

    /**
     * Get available merge tags.
     */
    public function mergeTags(): JsonResponse
    {
        return response()->json(EmailTemplate::mergeTags());
    }

    /**
     * Build merge data from request context.
     */
    protected function buildMergeData(Request $request): array
    {
        $data = [
            'agent_name' => auth()->user()->name ?? 'Agent',
            'today_date' => now()->format('F j, Y'),
            'company' => 'OurCRM',
        ];

        if ($request->lead_id) {
            $lead = Lead::find($request->lead_id);
            if ($lead) {
                $data['contact_name'] = $lead->contact_name;
                $data['company_name'] = $lead->company_name;
                $data['email'] = $lead->email;
                $data['phone'] = $lead->phone ?? '';
                $data['status'] = $lead->status;
            }
        }

        if ($request->customer_id) {
            $customer = Customer::find($request->customer_id);
            if ($customer) {
                $data['contact_name'] = $customer->name;
                $data['company_name'] = $customer->name;
                $data['email'] = $customer->email;
                $data['phone'] = $customer->phone ?? '';
                $data['status'] = 'customer';
            }
        }

        return $data;
    }
}
