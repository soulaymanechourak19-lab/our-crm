<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * ChatbotController — ML-powered chatbot with pattern-matching fallback.
 *
 * Flow:
 *   1. Send message to ML service for intent classification
 *   2. If confidence >= 0.7 → use ML intent
 *   3. If confidence < 0.7 → fall back to pattern matching
 *   4. Log every prediction
 */
class ChatbotController extends Controller
{
    private float $confidenceThreshold = 0.7;

    public function chat(Request $request)
    {
        $request->validate(['message' => 'required|string|max:500']);

        $msg = mb_strtolower(trim($request->message));
        $name = explode(' ', auth()->user()->name ?? 'there')[0];

        // ── Step 1: Try ML Intent Classification ─────────────────────
        $mlResult = $this->classifyIntent($msg);
        $intent = $mlResult['intent'] ?? null;
        $confidence = $mlResult['confidence'] ?? 0;
        $entities = $mlResult['entities'] ?? [];
        $usedFallback = false;

        if ($confidence >= $this->confidenceThreshold && $intent) {
            $response = $this->handleIntent($intent, $msg, $name, $entities);
        } else {
            // ── Step 2: Fall back to pattern matching ─────────────────
            $usedFallback = true;
            $response = $this->fallbackPatternMatch($msg, $name);
        }

        // ── Step 3: Log prediction ───────────────────────────────────
        $this->logPrediction($msg, $intent, $confidence, $usedFallback);

        return $response;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  ML SERVICE COMMUNICATION
    // ═══════════════════════════════════════════════════════════════════

    private function classifyIntent(string $msg): array
    {
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $response = Http::timeout(5)->post("{$mlUrl}/predict/intent", [
                'message' => $msg,
            ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::warning('Intent classification failed: ' . $e->getMessage());
        }

        return ['intent' => null, 'confidence' => 0, 'entities' => []];
    }

    private function logPrediction(string $msg, ?string $intent, float $confidence, bool $fallback): void
    {
        try {
            DB::table('chatbot_prediction_logs')->insert([
                'message' => mb_substr($msg, 0, 500),
                'predicted_intent' => $intent,
                'confidence' => $confidence,
                'used_fallback' => $fallback,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log prediction: ' . $e->getMessage());
        }
    }


    // ═══════════════════════════════════════════════════════════════════
    //  INTENT ROUTER — ML intent → DB query
    // ═══════════════════════════════════════════════════════════════════

    private function handleIntent(string $intent, string $msg, string $name, array $entities)
    {
        $entityName = $entities['name'] ?? null;
        $number = $entities['number'] ?? 5;

        return match ($intent) {
            // Conversational
            'greeting' => $this->greeting($name),
            'thanks' => $this->say("Happy to help! 😊"),
            'goodbye' => $this->say("See you later! 👋"),

            // Counts
            'count_customers' => $this->countCustomers(),
            'count_leads' => $this->countLeads(),
            'count_products' => $this->countProducts(),
            'count_interactions' => $this->countInteractions(),
            'count_users' => $this->countUsers(),

            // Breakdowns
            'leads_by_status' => $this->leadsByStatus(),
            'customers_by_tier' => $this->customersByTier(),
            'interactions_by_type' => $this->interactionsByType(),
            'products_by_category' => $this->productsByCategory(),

            // Rankings
            'top_customers' => $this->topCustomers($number),
            'worst_customers' => $this->worstCustomers($number),
            'recent_leads' => $this->recentLeads($number),
            'recent_interactions' => $this->recentInteractions($number),

            // Alerts
            'low_stock' => $this->lowStock(),

            // Summary
            'summary' => $this->salesSummary(),

            // Time-based
            'leads_this_month' => $this->leadsThisMonth(),
            'new_customers_today' => $this->newCustomersRecent(),

            // Metrics
            'conversion_rate' => $this->conversionRate(),
            'pricing_overview' => $this->productPricing('all'),
            'most_expensive' => $this->productPricing('expensive'),
            'cheapest' => $this->productPricing('cheap'),

            // Entity lookups
            'find_customer' => $entityName ? $this->findCustomer($entityName) : $this->say("Which customer? Tell me their name."),
            'find_lead' => $entityName ? $this->findLead($entityName) : $this->say("Which lead? Tell me the company or contact name."),
            'find_product' => $entityName ? $this->findProduct($entityName) : $this->say("Which product? Tell me the product name."),
            'list_category_products' => $entityName ? $this->listProductsByCategory($entityName) : $this->productsByCategory(),

            // Lists
            'list_products' => $this->listProducts(),
            'list_customers' => $this->topCustomers(10),
            'list_leads' => $this->recentLeads(10),

            // Escalation vers le ticketing
            'escalate_to_human', 'create_ticket', 'talk_to_agent' => $this->escalateToTicket($msg, $entities),

            default => $this->handleCustomIntent($intent) ?? $this->fallbackPatternMatch($msg, $name),
        };
    }

    private function handleCustomIntent(string $intentName): ?\Illuminate\Http\JsonResponse
    {
        $intent = DB::table('chatbot_intents')->where('name', $intentName)->first();
        if ($intent && $intent->response) {
            return $this->say($intent->response);
        }
        return null;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  PATTERN MATCHING FALLBACK
    // ═══════════════════════════════════════════════════════════════════

    private function fallbackPatternMatch(string $msg, string $name)
    {
        // Greetings
        if ($this->is($msg, ['hello','hi','hey','bonjour','salut','salam','yo','coucou'])) return $this->greeting($name);
        if ($this->is($msg, ['thank','merci','thanks','thx'])) return $this->say("Happy to help! 😊");
        if ($this->is($msg, ['bye','goodbye','au revoir','ciao'])) return $this->say("See you later! 👋");
        if ($this->is($msg, ['how are you','ça va','what\'s up'])) return $this->say("All systems running! 🟢 What can I look up?");
        if ($this->is($msg, ['who are you','what are you','help','aide'])) {
            return $this->say("I'm your CRM assistant 🤖 — I have full access to your database. Just ask me anything!");
        }

        // Counts
        if ($this->is($msg, ['how many customer','customer count','total customer','combien de client'])) return $this->countCustomers();
        if ($this->is($msg, ['how many lead','lead count','total lead','combien de lead'])) return $this->countLeads();
        if ($this->is($msg, ['how many product','product count','total product','combien de produit'])) return $this->countProducts();
        if ($this->is($msg, ['how many interaction','interaction count'])) return $this->countInteractions();
        if ($this->is($msg, ['how many user','user count'])) return $this->countUsers();

        // Breakdowns
        if ($this->is($msg, ['lead by status','lead status','pipeline','lead breakdown'])) return $this->leadsByStatus();
        if ($this->is($msg, ['customer by tier','customer tier','tier','gold silver'])) return $this->customersByTier();
        if ($this->is($msg, ['interaction by type','call email'])) return $this->interactionsByType();
        if ($this->is($msg, ['product by category','categor'])) return $this->productsByCategory();

        // Rankings
        if ($this->is($msg, ['top customer','best customer','top client','top 5','top 10','highest loyalty','best client'])) return $this->topCustomers($this->num($msg, 5));
        if ($this->is($msg, ['worst customer','at risk','low loyalty'])) return $this->worstCustomers($this->num($msg, 5));
        if ($this->is($msg, ['recent lead','latest lead','new lead'])) return $this->recentLeads($this->num($msg, 5));
        if ($this->is($msg, ['recent interaction','recent activity'])) return $this->recentInteractions($this->num($msg, 5));

        // Alerts
        if ($this->is($msg, ['low stock','out of stock','stock alert','stock faible'])) return $this->lowStock();

        // Summary
        if ($this->is($msg, ['summary','overview','dashboard','stats','report'])) return $this->salesSummary();

        // Pricing
        if ($this->is($msg, ['most expensive','highest price'])) return $this->productPricing('expensive');
        if ($this->is($msg, ['cheapest','lowest price'])) return $this->productPricing('cheap');
        if ($this->is($msg, ['conversion','conversion rate'])) return $this->conversionRate();

        // Time
        if ($this->is($msg, ['lead this month','monthly lead'])) return $this->leadsThisMonth();
        if ($this->is($msg, ['customer today','new customer'])) return $this->newCustomersRecent();

        // Entity lookups via regex
        if (preg_match('/(?:customer|client)\s+(?:named|called|name)\s+(.+)/i', $msg, $m)) return $this->findCustomer(trim($m[1]));
        if (preg_match('/(?:do (?:i|we) have).+(?:customer|client)\s+(.+)/i', $msg, $m)) return $this->findCustomer(trim(preg_replace('/\b(named|called|a|any)\b/i', '', $m[1])));
        if (preg_match('/(?:email|phone|tier|points|loyalty).*(?:customer|client)\s+(.+)/i', $msg, $m)) return $this->findCustomer(trim($m[1]));
        if (preg_match('/(?:description|price|stock).*(?:product|produit)\s+(.+)/i', $msg, $m)) return $this->findProduct(trim($m[1]));

        // Lists
        if ($this->is($msg, ['list product','all product','show product'])) return $this->listProducts();
        if ($this->is($msg, ['list customer','all customer','show customer'])) return $this->topCustomers(10);
        if ($this->is($msg, ['list lead','all lead','show lead'])) return $this->recentLeads(10);

        // Escalation to human / ticket creation
        if ($this->is($msg, ['parler à un humain','parler a un humain','agent humain','créer un ticket','creer un ticket','talk to human','create ticket','escalate','support humain','besoin d\'aide humaine','agent réel','agent reel'])) return $this->escalateToTicket($msg, []);

        // Universal search
        return $this->universalSearch($msg, $name);
    }


    // ═══════════════════════════════════════════════════════════════════
    //  DATA HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    private function greeting(string $name)
    {
        $c = DB::table('customers')->count();
        $nl = DB::table('leads')->where('status', 'new')->count();
        $ls = DB::table('products')->where('stock', '<', 10)->count();
        $bits = ["👥 {$c} customers"];
        if ($nl > 0) $bits[] = "📌 {$nl} new leads";
        if ($ls > 0) $bits[] = "⚠️ {$ls} low stock items";
        return $this->say("Hey {$name}! 👋\n\n" . implode("  •  ", $bits) . "\n\nWhat would you like to know?");
    }

    private function findCustomer(string $search)
    {
        $search = trim(preg_replace('/\s+/', ' ', $search));
        if (mb_strlen($search) < 1) return $this->say("Please specify a customer name.");
        $customers = DB::table('customers')->where('name', 'LIKE', "%{$search}%")->orWhere('email', 'LIKE', "%{$search}%")->limit(5)->get();
        if ($customers->isEmpty()) {
            foreach (explode(' ', $search) as $w) {
                if (mb_strlen($w) >= 2) {
                    $customers = DB::table('customers')->where('name', 'LIKE', "%{$w}%")->limit(5)->get();
                    if ($customers->isNotEmpty()) break;
                }
            }
        }
        if ($customers->isEmpty()) return $this->say("🔍 No customer found matching \"**{$search}**\".");
        if ($customers->count() === 1) {
            $c = $customers->first();
            $ic = DB::table('interactions')->where('customer_id', $c->id)->count();
            return $this->say("✅ Found **{$c->name}**!\n\n📧 Email: {$c->email}\n📞 Phone: " . ($c->phone ?: 'N/A') . "\n📍 Address: " . ($c->address ?: 'N/A') . "\n🏆 Tier: **{$this->tier($c->loyalty_score)}**\n⭐ Loyalty: **{$c->loyalty_score}** pts\n💬 Interactions: {$ic}");
        }
        $lines = ["🔍 Found **{$customers->count()}** customers:\n"];
        foreach ($customers as $c) $lines[] = "• **{$c->name}** — {$c->email} ({$c->loyalty_score} pts)";
        return $this->say(implode("\n", $lines));
    }

    private function findLead(string $search)
    {
        $search = trim(preg_replace('/\s+/', ' ', $search));
        if (mb_strlen($search) < 1) return $this->say("Please specify a lead name.");
        $leads = DB::table('leads')->where('company_name', 'LIKE', "%{$search}%")->orWhere('contact_name', 'LIKE', "%{$search}%")->orWhere('email', 'LIKE', "%{$search}%")->limit(5)->get();
        if ($leads->isEmpty()) { foreach (explode(' ', $search) as $w) { if (mb_strlen($w) >= 2) { $leads = DB::table('leads')->where('company_name', 'LIKE', "%{$w}%")->orWhere('contact_name', 'LIKE', "%{$w}%")->limit(5)->get(); if ($leads->isNotEmpty()) break; } } }
        if ($leads->isEmpty()) return $this->say("🔍 No lead found matching \"**{$search}**\".");
        $ic = ['new'=>'🆕','contacted'=>'📞','qualified'=>'⭐','converted'=>'✅'];
        if ($leads->count() === 1) {
            $l = $leads->first();
            return $this->say("✅ Found lead **{$l->company_name}**!\n\n👤 Contact: {$l->contact_name}\n📧 Email: {$l->email}\n📞 Phone: " . ($l->phone ?: 'N/A') . "\n" . ($ic[$l->status] ?? '') . " Status: **" . ucfirst($l->status) . "**");
        }
        $lines = ["🔍 Found **{$leads->count()}** leads:\n"];
        foreach ($leads as $l) $lines[] = ($ic[$l->status] ?? '•') . " **{$l->company_name}** ({$l->contact_name})";
        return $this->say(implode("\n", $lines));
    }

    private function findProduct(string $search)
    {
        $search = trim(preg_replace('/\s+/', ' ', $search));
        if (mb_strlen($search) < 1) return $this->say("Please specify a product name.");
        $products = DB::table('products')->where('name', 'LIKE', "%{$search}%")->orWhere('category', 'LIKE', "%{$search}%")->limit(5)->get();
        if ($products->isEmpty()) { foreach (explode(' ', $search) as $w) { if (mb_strlen($w) >= 2) { $products = DB::table('products')->where('name', 'LIKE', "%{$w}%")->limit(5)->get(); if ($products->isNotEmpty()) break; } } }
        if ($products->isEmpty()) return $this->say("🔍 No product found matching \"**{$search}**\".");
        if ($products->count() === 1) {
            $p = $products->first();
            $se = $p->stock == 0 ? '🔴' : ($p->stock < 10 ? '🟠' : '🟢');
            return $this->say("✅ Found product **{$p->name}**!\n\n" . ($p->description ? "📝 {$p->description}\n" : "") . "💰 Price: **\${$p->price}**\n{$se} Stock: **{$p->stock}**\n🏷️ Category: {$p->category}");
        }
        $lines = ["🔍 Found **{$products->count()}** products:\n"];
        foreach ($products as $p) { $se = $p->stock < 10 ? '⚠️' : '🟢'; $lines[] = "{$se} **{$p->name}** — \${$p->price} ({$p->stock} stock)"; }
        return $this->say(implode("\n", $lines));
    }

    private function listProductsByCategory(string $category)
    {
        $products = DB::table('products')->where('category', 'LIKE', "%{$category}%")->orderBy('name')->limit(10)->get();
        if ($products->isEmpty()) return $this->say("🔍 No products found in category \"**{$category}**\".");
        $lines = ["📦 **Products in '{$category}'** ({$products->count()} found):\n"];
        foreach ($products as $p) { $se = $p->stock < 10 ? '⚠️' : '🟢'; $lines[] = "{$se} **{$p->name}** — \${$p->price} ({$p->stock} stock)"; }
        return $this->say(implode("\n", $lines));
    }

    private function countCustomers() { return $this->say("👥 **" . DB::table('customers')->count() . "** customers — " . DB::table('customers')->where('loyalty_score','>=',71)->count() . " Gold tier."); }
    private function countLeads() { return $this->say("🎯 **" . DB::table('leads')->count() . "** leads — " . DB::table('leads')->where('status','new')->count() . " new."); }
    private function countProducts() { $low = DB::table('products')->where('stock','<',10)->count(); return $this->say("📦 **" . DB::table('products')->count() . "** products" . ($low > 0 ? " — ⚠️ {$low} low stock." : " — all stocked! ✅")); }
    private function countInteractions() { return $this->say("💬 **" . DB::table('interactions')->count() . "** interactions logged."); }
    private function countUsers() { return $this->say("👤 **" . DB::table('users')->count() . "** users registered."); }

    private function leadsByStatus()
    {
        $data = DB::table('leads')->select('status', DB::raw('COUNT(*) as c'))->groupBy('status')->pluck('c','status');
        $t = $data->sum(); $i = ['new'=>'🆕','contacted'=>'📞','qualified'=>'⭐','converted'=>'✅'];
        $lines = ["📊 **Lead Pipeline** ({$t} total)\n"];
        foreach (['new','contacted','qualified','converted'] as $s) { $n = $data->get($s,0); $p = $t>0 ? round($n/$t*100) : 0; $lines[] = "{$i[$s]} " . ucfirst($s) . ": **{$n}** ({$p}%)"; }
        return $this->say(implode("\n", $lines));
    }

    private function customersByTier()
    {
        $g = DB::table('customers')->where('loyalty_score','>=',71)->count();
        $s = DB::table('customers')->whereBetween('loyalty_score',[31,70])->count();
        $b = DB::table('customers')->where('loyalty_score','<=',30)->count();
        return $this->say("🏆 **Customer Tiers**\n\n🥇 Gold: **{$g}**\n🥈 Silver: **{$s}**\n🥉 Bronze: **{$b}**");
    }

    private function interactionsByType()
    {
        $data = DB::table('interactions')->select('type', DB::raw('COUNT(*) as c'))->groupBy('type')->pluck('c','type');
        $i = ['call'=>'📞','email'=>'📧','meeting'=>'👥'];
        $lines = ["💬 **Interactions**\n"];
        foreach (['call','email','meeting'] as $t) $lines[] = ($i[$t] ?? '•') . ' ' . ucfirst($t) . ": **" . $data->get($t,0) . "**";
        return $this->say(implode("\n", $lines));
    }

    private function productsByCategory()
    {
        $cats = DB::table('products')->select('category', DB::raw('COUNT(*) as c'), DB::raw('SUM(stock) as s'))->groupBy('category')->orderByDesc('c')->get();
        $lines = ["📦 **Products by Category**\n"];
        foreach ($cats as $cat) $lines[] = "• **{$cat->category}**: {$cat->c} products ({$cat->s} stock)";
        return $this->say(implode("\n", $lines));
    }

    private function topCustomers(int $n = 5)
    {
        $list = DB::table('customers')->orderByDesc('loyalty_score')->limit($n)->get(['name','loyalty_score','email','phone']);
        if ($list->isEmpty()) return $this->say("No customers yet.");
        if ($n === 1) { $c = $list->first(); return $this->say("🏆 Top customer: **{$c->name}**!\n\n⭐ {$c->loyalty_score} pts ({$this->tier($c->loyalty_score)})\n📧 {$c->email}"); }
        $m = ['🥇','🥈','🥉']; $lines = ["🏆 **Top {$n} Customers**\n"];
        foreach ($list as $i => $c) { $r = $i < 3 ? $m[$i] : ($i+1).'.'; $lines[] = "{$r} **{$c->name}** — {$c->loyalty_score} pts"; }
        return $this->say(implode("\n", $lines));
    }

    private function worstCustomers(int $n = 5)
    {
        $list = DB::table('customers')->orderBy('loyalty_score')->limit($n)->get(['name','loyalty_score']);
        if ($list->isEmpty()) return $this->say("No customers yet.");
        $lines = ["⚠️ **{$n} Customers at Risk**\n"];
        foreach ($list as $i => $c) $lines[] = ($i+1) . ". **{$c->name}** — {$c->loyalty_score} pts";
        return $this->say(implode("\n", $lines));
    }

    private function recentLeads(int $n = 5)
    {
        $list = DB::table('leads')->orderByDesc('created_at')->limit($n)->get(['company_name','contact_name','status','created_at']);
        if ($list->isEmpty()) return $this->say("No leads yet.");
        $ic = ['new'=>'🆕','contacted'=>'📞','qualified'=>'⭐','converted'=>'✅'];
        $lines = ["🎯 **{$n} Recent Leads**\n"];
        foreach ($list as $l) $lines[] = ($ic[$l->status] ?? '•') . " **{$l->company_name}** ({$l->contact_name}) — " . Carbon::parse($l->created_at)->diffForHumans();
        return $this->say(implode("\n", $lines));
    }

    private function recentInteractions(int $n = 5)
    {
        $list = DB::table('interactions')->join('customers','interactions.customer_id','=','customers.id')->orderByDesc('interactions.date')->limit($n)->get(['customers.name','interactions.type','interactions.notes','interactions.date']);
        if ($list->isEmpty()) return $this->say("No interactions yet.");
        $ic = ['call'=>'📞','email'=>'📧','meeting'=>'👥'];
        $lines = ["💬 **{$n} Recent Interactions**\n"];
        foreach ($list as $r) { $note = mb_strlen($r->notes) > 50 ? mb_substr($r->notes,0,50).'…' : $r->notes; $lines[] = ($ic[$r->type] ?? '📝') . " **{$r->name}** — {$note}"; }
        return $this->say(implode("\n", $lines));
    }

    private function lowStock()
    {
        $list = DB::table('products')->where('stock','<',10)->orderBy('stock')->get(['name','stock','category','price']);
        if ($list->isEmpty()) return $this->say("✅ All products well-stocked!");
        $lines = ["⚠️ **{$list->count()} low stock products**\n"];
        foreach ($list as $p) { $e = $p->stock == 0 ? '🔴' : ($p->stock < 5 ? '🟠' : '🟡'); $lines[] = "{$e} **{$p->name}**: {$p->stock} left (\${$p->price})"; }
        return $this->say(implode("\n", $lines));
    }

    private function listProducts()
    {
        $list = DB::table('products')->orderBy('category')->orderBy('name')->limit(15)->get(['name','price','stock','category']);
        $lines = ["📦 **Products** (" . DB::table('products')->count() . " total)\n"];
        foreach ($list as $p) { $se = $p->stock < 10 ? '⚠️' : '🟢'; $lines[] = "{$se} **{$p->name}** — \${$p->price} ({$p->stock} stock)"; }
        return $this->say(implode("\n", $lines));
    }

    private function salesSummary()
    {
        $cu = DB::table('customers')->count(); $le = DB::table('leads')->count();
        $pr = DB::table('products')->count(); $in = DB::table('interactions')->count();
        $nw = DB::table('leads')->where('status','new')->count();
        $cv = DB::table('leads')->where('status','converted')->count();
        $cr = $le > 0 ? round($cv/$le*100,1) : 0;
        $ls = DB::table('products')->where('stock','<',10)->count();
        $go = DB::table('customers')->where('loyalty_score','>=',71)->count();
        return $this->say("📊 **CRM Summary**\n\n👥 {$cu} customers ({$go} Gold)\n🎯 {$le} leads ({$nw} new, {$cv} converted)\n📈 Conversion: **{$cr}%**\n📦 {$pr} products" . ($ls > 0 ? " (⚠️ {$ls} low stock)" : "") . "\n💬 {$in} interactions");
    }

    private function leadsThisMonth()
    {
        $c = DB::table('leads')->where('created_at','>=',Carbon::now()->startOfMonth())->count();
        return $this->say("📅 **" . Carbon::now()->format('F Y') . "**: {$c} leads this month.");
    }

    private function newCustomersRecent()
    {
        $td = DB::table('customers')->whereDate('created_at', Carbon::today())->count();
        $wk = DB::table('customers')->where('created_at','>=',Carbon::now()->startOfWeek())->count();
        $mo = DB::table('customers')->where('created_at','>=',Carbon::now()->startOfMonth())->count();
        return $this->say("📅 **New Customers**\n\nToday: **{$td}** | Week: **{$wk}** | Month: **{$mo}**");
    }

    private function conversionRate()
    {
        $t = DB::table('leads')->count(); $c = DB::table('leads')->where('status','converted')->count();
        $r = $t > 0 ? round($c/$t*100,1) : 0;
        return $this->say("📈 **Conversion Rate**: {$r}%\n{$c} converted out of {$t} leads.");
    }

    private function productPricing(string $type)
    {
        if ($type === 'expensive') { $p = DB::table('products')->orderByDesc('price')->first(); return $p ? $this->say("📈 Most expensive: **{$p->name}** — \${$p->price}\n📦 {$p->stock} in stock | 🏷️ {$p->category}") : $this->say("No products."); }
        if ($type === 'cheap') { $p = DB::table('products')->orderBy('price')->first(); return $p ? $this->say("📉 Cheapest: **{$p->name}** — \${$p->price}\n📦 {$p->stock} in stock | 🏷️ {$p->category}") : $this->say("No products."); }
        $most = DB::table('products')->orderByDesc('price')->first(['name','price']); $least = DB::table('products')->orderBy('price')->first(['name','price']); $avg = round((float) DB::table('products')->avg('price'), 2);
        $lines = ["💰 **Pricing**\n"];
        if ($most) $lines[] = "📈 Most expensive: **{$most->name}** — \${$most->price}";
        if ($least) $lines[] = "📉 Cheapest: **{$least->name}** — \${$least->price}";
        $lines[] = "📊 Average: **\${$avg}**";
        return $this->say(implode("\n", $lines));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  UNIVERSAL SEARCH
    // ═══════════════════════════════════════════════════════════════════

    private function universalSearch(string $msg, string $userName)
    {
        $stop = ['the','a','an','is','are','was','were','be','have','has','had','do','does','did','will','would','can','could','about','and','any','but','by','for','from','if','in','into','it','its','just','me','my','no','not','of','on','or','our','out','so','some','than','that','then','there','these','they','this','those','to','too','up','very','what','when','where','which','while','who','why','with','you','your','i','we','he','she','tell','show','give','find','get','see','look','know','want','need','please','search','list','all','named','called','name','customer','client','lead','prospect','product','produit','user','interaction'];
        $words = preg_split('/[\s,.!?;:\'\"]+/', $msg, -1, PREG_SPLIT_NO_EMPTY);
        $meaningful = array_filter($words, fn($w) => !in_array($w, $stop) && mb_strlen($w) >= 2);
        $search = implode(' ', $meaningful);

        if (mb_strlen($search) >= 2) {
            $results = [];
            foreach (mb_strlen($search) > 20 ? $meaningful : [$search] as $term) {
                if (mb_strlen($term) < 2) continue;
                foreach (DB::table('customers')->where('name','LIKE',"%{$term}%")->orWhere('email','LIKE',"%{$term}%")->limit(3)->get() as $c) { $results["c{$c->id}"] = "👤 **{$c->name}** — {$c->email} (" . $this->tier($c->loyalty_score) . ")"; }
                foreach (DB::table('leads')->where('company_name','LIKE',"%{$term}%")->orWhere('contact_name','LIKE',"%{$term}%")->limit(3)->get() as $l) { $ic = ['new'=>'🆕','contacted'=>'📞','qualified'=>'⭐','converted'=>'✅']; $results["l{$l->id}"] = "🎯 **{$l->company_name}** ({$l->contact_name}) — " . ($ic[$l->status] ?? '') . ucfirst($l->status); }
                foreach (DB::table('products')->where('name','LIKE',"%{$term}%")->orWhere('category','LIKE',"%{$term}%")->limit(3)->get() as $p) { $se = $p->stock < 10 ? '⚠️' : '🟢'; $results["p{$p->id}"] = "📦 **{$p->name}** — \${$p->price} ({$se} {$p->stock} stock)"; }
                if (!empty($results)) break;
            }
            if (!empty($results)) return $this->say("🔍 Here's what I found:\n\n" . implode("\n\n", array_values($results)));
        }

        return $this->say("🤔 I couldn't find anything for that. Try asking about a customer, lead, or product by name — or say \"summary\" for a full overview!");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TICKET ESCALATION (Chatbot → Ticketing)
    // ═══════════════════════════════════════════════════════════════════

    private function escalateToTicket(string $msg, array $entities)
    {
        $user = auth()->user();
        $customerId = $entities['customer_id'] ?? null;

        // Essayer de trouver le client par l'utilisateur connecté
        if (!$customerId && $user) {
            $customer = DB::table('customers')->where('email', $user->email)->first();
            if ($customer) {
                $customerId = $customer->id;
            }
        }

        // Analyser le sentiment pour la priorité
        $sentimentUrgency = null;
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $sentimentRes = Http::timeout(3)->post("{$mlUrl}/predict/sentiment", ['text' => $msg]);
            if ($sentimentRes->successful()) {
                $sentimentData = $sentimentRes->json();
                $sentimentUrgency = $sentimentData['urgency'] ?? $sentimentData['sentiment'] ?? null;
            }
        } catch (\Exception $e) {
            Log::info('Sentiment analysis skipped during escalation: ' . $e->getMessage());
        }

        // Créer le ticket via le module Ticketing
        try {
            $ticket = \Modules\Ticketing\Entities\Ticket::create([
                'ticket_number' => \Modules\Ticketing\Entities\Ticket::generateTicketNumber(),
                'title'         => 'Escalade chatbot - ' . mb_substr($msg, 0, 80),
                'description'   => "Message du client :\n{$msg}\n\n--- Créé automatiquement par le chatbot ---",
                'customer_id'   => $customerId,
                'priority'      => (new \Modules\Ticketing\Services\TicketPriorityService())->detectPriority($msg, $sentimentUrgency),
                'source'        => 'chatbot',
                'category'      => $entities['intent'] ?? 'escalation',
                'created_by'    => $user?->id,
            ]);

            // Auto-attribution
            $agent = (new \Modules\Ticketing\Services\TicketAssignmentService())->assignToLeastBusyAgent($ticket);

            // Déclencher les événements
            event(new \Modules\Ticketing\Events\TicketCreated($ticket));
            if ($agent) {
                event(new \Modules\Ticketing\Events\TicketAssigned($ticket, null, $agent->id));
            }

            $agentName = $agent ? $agent->name : 'notre équipe';
            return $this->say(
                "🎫 J'ai créé un ticket pour vous !\n\n" .
                "**Ticket #{$ticket->ticket_number}**\n" .
                "Priorité : **{$ticket->priority}**\n" .
                "Assigné à : **{$agentName}**\n\n" .
                "Un agent va prendre en charge votre demande très rapidement. 🙏"
            );
        } catch (\Exception $e) {
            Log::error('Failed to create ticket from chatbot: ' . $e->getMessage());
            return $this->say("😓 Désolé, je n'ai pas pu créer le ticket. Veuillez contacter le support directement.");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private function is(string $msg, array $p): bool { foreach ($p as $phrase) { if (str_contains($msg, $phrase)) return true; } return false; }
    private function num(string $msg, int $d = 5): int { return preg_match('/\b(\d+)\b/', $msg, $m) ? min(max((int)$m[1],1),20) : $d; }
    private function tier(int $s): string { return $s >= 71 ? '🥇 Gold' : ($s >= 31 ? '🥈 Silver' : '🥉 Bronze'); }
    private function say(string $t) { return response()->json(['response' => $t]); }
}