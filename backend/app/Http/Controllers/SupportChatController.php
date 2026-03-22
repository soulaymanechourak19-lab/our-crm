<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Ticketing\Entities\Ticket;
use Modules\Ticketing\Services\TicketPriorityService;
use Modules\Ticketing\Services\TicketAssignmentService;
use Modules\Ticketing\Events\TicketCreated;
use Modules\Ticketing\Events\TicketAssigned;

/**
 * SupportChatController — PUBLIC client-facing support chatbot.
 *
 * No authentication required. Clients interact via the /support page.
 *
 * Flow:
 *   1. Client sends a message
 *   2. Bot tries to answer via ML intent classification + smart FAQ
 *   3. If bot can't help → tracks failed attempts
 *   4. After threshold or explicit request → suggests ticket creation
 *   5. Client provides email → ticket created, auto-assigned to agent
 */
class SupportChatController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════
    //  HANDLE CLIENT MESSAGE
    // ═══════════════════════════════════════════════════════════════════

    public function handle(Request $request): JsonResponse
    {
        $request->validate([
            'message'       => 'required|string|max:1000',
            'sessionId'     => 'nullable|string|max:100',
            'failedCount'   => 'nullable|integer|min:0',
        ]);

        $msg = mb_strtolower(trim($request->message));
        $failedCount = $request->failedCount ?? 0;

        // ── Step 1: Check for escalation intent ─────────────────────
        if ($this->wantsEscalation($msg)) {
            return response()->json([
                'response' => "I understand you'd like to speak with a support agent. Let me create a ticket for you right away! 🎫\n\nPlease provide your **email address** so we can track your request and get back to you.",
                'action'   => 'request_email',
                'intent'   => 'escalate',
            ]);
        }

        // ── Step 2: Try ML intent classification ────────────────────
        $mlResult = $this->classifyIntent($msg);
        $intent = $mlResult['intent'] ?? null;
        $confidence = $mlResult['confidence'] ?? 0;

        if ($confidence >= 0.65 && $intent) {
            $answer = $this->handleSupportIntent($intent, $msg);
            if ($answer) {
                return response()->json([
                    'response' => $answer,
                    'action'   => 'answered',
                    'intent'   => $intent,
                ]);
            }
        }

        // ── Step 3: Smart FAQ pattern matching ──────────────────────
        $faqAnswer = $this->matchFAQ($msg);
        if ($faqAnswer) {
            return response()->json([
                'response' => $faqAnswer,
                'action'   => 'answered',
                'intent'   => 'faq',
            ]);
        }

        // ── Step 4: Proactive escalation after repeated failures ────
        if ($failedCount >= 2) {
            return response()->json([
                'response' => "I'm sorry, I wasn't able to resolve your issue. 😔\n\nLet me connect you with a real support agent who can help! I'll create a ticket for you.\n\nPlease provide your **email address** so we can follow up.",
                'action'   => 'request_email',
                'intent'   => 'auto_escalate',
            ]);
        }

        // ── Step 5: Couldn't answer — increment fail counter ────────
        return response()->json([
            'response' => $this->getSmartFallback($msg, $failedCount),
            'action'   => 'not_resolved',
            'intent'   => 'unknown',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CREATE TICKET (public — no auth required)
    // ═══════════════════════════════════════════════════════════════════

    public function createTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'        => 'required|email|max:255',
            'name'         => 'nullable|string|max:255',
            'subject'      => 'required|string|max:255',
            'description'  => 'required|string|max:5000',
            'conversation' => 'nullable|string|max:10000',
            'urgency'      => 'nullable|string|max:50',
        ]);

        // Look up existing customer by email
        $customer = DB::table('customers')
            ->where('email', $validated['email'])
            ->first();
        $customerId = $customer->id ?? null;

        // Build full description with conversation context
        $description = $validated['description'];
        if (!empty($validated['conversation'])) {
            $description .= "\n\n--- 💬 Chat Conversation ---\n" . $validated['conversation'];
        }
        if (!empty($validated['name'])) {
            $description = "Client: {$validated['name']} ({$validated['email']})\n\n" . $description;
        } else {
            $description = "Client: {$validated['email']}\n\n" . $description;
        }

        // Auto-detect priority from content
        $priorityService = new TicketPriorityService();
        $priority = $priorityService->detectPriority(
            $description,
            $validated['urgency'] ?? null
        );

        try {
            $ticket = Ticket::create([
                'ticket_number' => Ticket::generateTicketNumber(),
                'title'         => $validated['subject'],
                'description'   => $description,
                'customer_id'   => $customerId,
                'priority'      => $priority,
                'source'        => 'public_chatbot',
                'category'      => 'support',
                'created_by'    => null, // Public — no authenticated user
            ]);

            // Auto-assign to least busy SAV agent
            $assignmentService = new TicketAssignmentService();
            $agent = $assignmentService->assignToLeastBusyAgent($ticket);

            // Fire events
            event(new TicketCreated($ticket));
            if ($agent) {
                event(new TicketAssigned($ticket, null, $agent->id));
            }

            $agentName = $agent ? $agent->name : 'our support team';

            return response()->json([
                'success'       => true,
                'ticket_number' => $ticket->ticket_number,
                'priority'      => $ticket->priority,
                'agent'         => $agentName,
                'message'       => "Your ticket #{$ticket->ticket_number} has been created! {$agentName} will be in touch soon.",
                'customer_found' => $customer !== null,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Public support ticket creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Sorry, we could not create the ticket. Please try again or contact us directly.',
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ML INTENT CLASSIFICATION
    // ═══════════════════════════════════════════════════════════════════

    private function classifyIntent(string $msg): array
    {
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $response = Http::timeout(3)->post("{$mlUrl}/predict/intent", [
                'message' => $msg,
            ]);
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::debug('Support chat ML classification failed: ' . $e->getMessage());
        }
        return ['intent' => null, 'confidence' => 0];
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SUPPORT INTENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    private function handleSupportIntent(string $intent, string $msg): ?string
    {
        return match ($intent) {
            'greeting' => "Hello! 👋 Welcome to OurCRM Support!\n\nI'm here to help you with:\n• 📦 **Order & delivery** questions\n• 🔄 **Returns & refunds**\n• 🔐 **Account access** issues\n• 🛠️ **Technical problems**\n• 💬 **General questions**\n\nHow can I help you today?",

            'thanks' => "You're welcome! 😊 Is there anything else I can help you with?",

            'goodbye' => "Goodbye! 👋 Don't hesitate to come back if you need anything. Have a great day!",

            'escalate_to_human', 'create_ticket', 'talk_to_agent' => null, // handled by wantsEscalation

            default => null,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SMART FAQ ENGINE
    // ═══════════════════════════════════════════════════════════════════

    private function matchFAQ(string $msg): ?string
    {
        $faqs = [
            // ── Order & Delivery ─────────────────────────────────────
            [
                'keywords' => ['order', 'delivery', 'shipping', 'track', 'where is my', 'commande', 'livraison', 'suivi', 'colis', 'expédition'],
                'answer'   => "📦 **Order & Delivery Information**\n\nHere's what you need to know:\n\n• **Standard delivery**: 3-5 business days\n• **Express delivery**: 1-2 business days\n• **Track your order**: Check your confirmation email for a tracking link\n• **Delayed?** Delays can happen during peak seasons\n\n💡 If your order is more than 7 days late, I can create a ticket for you so our team investigates!\n\nWould you like me to create a support ticket?"
            ],

            // ── Returns & Refunds ────────────────────────────────────
            [
                'keywords' => ['return', 'refund', 'exchange', 'money back', 'retour', 'remboursement', 'échange', 'rembourser'],
                'answer'   => "🔄 **Returns & Refund Policy**\n\n• **Return window**: 30 days from delivery\n• **Condition**: Items must be unused and in original packaging\n• **How to return**: Contact us with your order number\n• **Refund timeline**: 5-10 business days after we receive the item\n• **Exchanges**: Free of charge for the same product\n\n💡 Need to start a return? I can create a ticket for you so our team processes it quickly!\n\nWould you like me to do that?"
            ],

            // ── Account Issues ───────────────────────────────────────
            [
                'keywords' => ['password', 'login', 'account', 'sign in', 'can\'t access', 'locked', 'mot de passe', 'connexion', 'compte', 'accès'],
                'answer'   => "🔐 **Account Access Help**\n\n**Forgot your password?**\n1. Go to the login page\n2. Click \"Forgot Password\"\n3. Enter your email address\n4. Check your inbox for a reset link\n\n**Account locked?**\nAfter 5 failed attempts, your account is temporarily locked for 30 minutes.\n\n**Still having trouble?**\nI can create a support ticket and our team will help you regain access!\n\nWould you like me to create a ticket?"
            ],

            // ── Product Issues ───────────────────────────────────────
            [
                'keywords' => ['broken', 'defective', 'damaged', 'not working', 'doesn\'t work', 'quality', 'issue with product', 'cassé', 'défectueux', 'endommagé', 'ne fonctionne pas', 'panne', 'problème'],
                'answer'   => "🛠️ **I'm sorry to hear about that!**\n\nProduct issues are important to us. Let me create a **support ticket** so our technical team can help you resolve this as quickly as possible.\n\nPlease share your **email address** and I'll set everything up for you right away! 🎫"
            ],

            // ── Pricing ──────────────────────────────────────────────
            [
                'keywords' => ['price', 'pricing', 'cost', 'how much', 'discount', 'promotion', 'coupon', 'prix', 'tarif', 'combien', 'réduction', 'promo'],
                'answer'   => "💰 **Pricing Information**\n\n• All our prices are listed on the product pages\n• **Volume discounts** are available for orders of 10+ items\n• **Seasonal promotions** are announced on our homepage\n• **Custom quotes** available for enterprise needs\n\n💡 For specific pricing questions or bulk orders, I can create a ticket and our sales team will get back to you with a personalized quote!\n\nWould you like me to do that?"
            ],

            // ── Contact / Hours ──────────────────────────────────────
            [
                'keywords' => ['contact', 'phone', 'email', 'hours', 'open', 'reach', 'support hours', 'horaires', 'téléphone', 'joindre', 'heures'],
                'answer'   => "📞 **Contact Information**\n\n• **Support hours**: Monday-Friday, 9 AM - 6 PM\n• **Email**: support@ourcrm.com\n• **Response time**: Within 24 hours\n• **Urgent issues?** Create a ticket and it will be flagged as high priority!\n\nI'm available 24/7 right here in this chat! How can I help? 🤖"
            ],

            // ── Warranty ─────────────────────────────────────────────
            [
                'keywords' => ['warranty', 'guarantee', 'garantie', 'couvert', 'covered'],
                'answer'   => "🛡️ **Warranty Information**\n\n• **Standard warranty**: 1 year from purchase date\n• **Extended warranty**: Available for an additional fee\n• **What's covered**: Manufacturing defects and hardware failures\n• **Not covered**: Physical damage, water damage, misuse\n\nNeed to file a warranty claim? I can create a ticket for you! 🎫"
            ],

            // ── Payment ──────────────────────────────────────────────
            [
                'keywords' => ['payment', 'pay', 'invoice', 'billing', 'charge', 'credit card', 'paiement', 'facture', 'carte', 'facturation'],
                'answer'   => "💳 **Payment & Billing**\n\n• **Accepted methods**: Visa, Mastercard, PayPal, Bank Transfer\n• **Invoices**: Sent automatically to your email after purchase\n• **Billing issue?** Double charges are usually resolved within 48h\n• **Payment plans**: Available for orders over $500\n\nHaving a billing issue? I can create a priority ticket for you! 🎫"
            ],
        ];

        foreach ($faqs as $faq) {
            foreach ($faq['keywords'] as $keyword) {
                if (str_contains($msg, $keyword)) {
                    return $faq['answer'];
                }
            }
        }

        // ── Greeting patterns ────────────────────────────────────────
        $greetings = ['hello', 'hi', 'hey', 'bonjour', 'salut', 'salam', 'good morning', 'good afternoon', 'bonsoir'];
        foreach ($greetings as $g) {
            if (str_contains($msg, $g)) {
                return "Hello! 👋 Welcome to OurCRM Support!\n\nI'm your virtual assistant and I'm here to help. You can ask me about:\n\n• 📦 Orders & Deliveries\n• 🔄 Returns & Refunds\n• 🔐 Account Access\n• 🛠️ Product Issues\n• 💰 Pricing & Billing\n• 🛡️ Warranty\n\nWhat can I help you with today?";
            }
        }

        // ── Thank you patterns ───────────────────────────────────────
        $thanks = ['thank', 'merci', 'thanks', 'thx', 'appreciate'];
        foreach ($thanks as $t) {
            if (str_contains($msg, $t)) {
                return "You're welcome! 😊 Is there anything else I can help you with?\n\nIf your issue is resolved, have a wonderful day! 🌟";
            }
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ESCALATION DETECTION
    // ═══════════════════════════════════════════════════════════════════

    private function wantsEscalation(string $msg): bool
    {
        $escalationPhrases = [
            // English
            'speak to', 'talk to', 'agent', 'human', 'real person', 'supervisor',
            'manager', 'escalate', 'create ticket', 'create a ticket', 'open ticket',
            'file complaint', 'complaint', 'not helpful', 'useless',
            // French
            'parler à', 'parler a', 'agent humain', 'personne réelle', 'personne reelle',
            'créer un ticket', 'creer un ticket', 'ouvrir un ticket',
            'réclamation', 'reclamation', 'pas utile', 'inutile', 'superviseur',
        ];

        foreach ($escalationPhrases as $phrase) {
            if (str_contains($msg, $phrase)) {
                return true;
            }
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SMART FALLBACK RESPONSES
    // ═══════════════════════════════════════════════════════════════════

    private function getSmartFallback(string $msg, int $failedCount): string
    {
        if ($failedCount === 0) {
            return "I'm not quite sure I understood that. 🤔\n\nCould you try rephrasing? Here are some things I can help with:\n\n• **\"Where is my order?\"** — delivery tracking\n• **\"I want to return an item\"** — returns & refunds\n• **\"I can't log in\"** — account help\n• **\"My product is broken\"** — technical support\n• **\"Talk to an agent\"** — connect with a human\n\nOr just describe your issue and I'll do my best!";
        }

        return "I'm still having trouble understanding. 😅\n\nHere's what I suggest:\n\n1️⃣ Try using **simple keywords** like \"order\", \"return\", or \"account\"\n2️⃣ Or say **\"create a ticket\"** and I'll connect you with a real agent who can help!\n\nOur support team is always happy to assist. 🙏";
    }
}
