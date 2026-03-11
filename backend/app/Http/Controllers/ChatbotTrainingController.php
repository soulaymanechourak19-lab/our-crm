<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ChatbotTrainingController — Admin interface for managing
 * chatbot intents, training examples, and ML model training.
 */
class ChatbotTrainingController extends Controller
{
    // ── Intents CRUD ─────────────────────────────────────────────────

    public function listIntents()
    {
        $intents = DB::table('chatbot_intents')
            ->select('chatbot_intents.*')
            ->selectRaw('(SELECT COUNT(*) FROM chatbot_training_examples WHERE intent_id = chatbot_intents.id) as example_count')
            ->orderBy('name')
            ->get();

        return response()->json($intents);
    }

    public function createIntent(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:chatbot_intents,name',
            'description' => 'nullable|string|max:255',
            'response' => 'nullable|string|max:1000',
        ]);

        $id = DB::table('chatbot_intents')->insertGetId([
            'name' => $request->name,
            'description' => $request->description,
            'response' => $request->response,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Intent created'], 201);
    }

    public function deleteIntent($id)
    {
        $deleted = DB::table('chatbot_intents')->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Intent not found'], 404);
        return response()->json(['message' => 'Intent deleted']);
    }

    // ── Examples CRUD ────────────────────────────────────────────────

    public function listExamples($intentId)
    {
        $examples = DB::table('chatbot_training_examples')
            ->where('intent_id', $intentId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($examples);
    }

    public function addExamples(Request $request, $intentId)
    {
        $request->validate([
            'examples' => 'required|array|min:1',
            'examples.*' => 'required|string|max:500',
        ]);

        $intent = DB::table('chatbot_intents')->where('id', $intentId)->first();
        if (!$intent) return response()->json(['message' => 'Intent not found'], 404);

        $now = now();
        $rows = array_map(fn($text) => [
            'intent_id' => $intentId,
            'text' => trim($text),
            'created_at' => $now,
            'updated_at' => $now,
        ], $request->examples);

        DB::table('chatbot_training_examples')->insert($rows);

        return response()->json(['message' => count($rows) . ' examples added'], 201);
    }

    public function deleteExample($id)
    {
        $deleted = DB::table('chatbot_training_examples')->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Example not found'], 404);
        return response()->json(['message' => 'Example deleted']);
    }

    // ── Training ─────────────────────────────────────────────────────

    public function trainModel()
    {
        // Export training data from DB
        $intents = DB::table('chatbot_intents')->get();
        $trainingData = [];

        foreach ($intents as $intent) {
            $examples = DB::table('chatbot_training_examples')
                ->where('intent_id', $intent->id)
                ->pluck('text')
                ->toArray();

            if (count($examples) > 0) {
                $trainingData[] = [
                    'intent' => $intent->name,
                    'examples' => $examples,
                ];
            }
        }

        if (empty($trainingData)) {
            return response()->json(['error' => 'No training data found. Add intents and examples first.'], 400);
        }

        // Call ML service to train
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $response = Http::timeout(120)->post("{$mlUrl}/train/chatbot", [
                'training_data' => $trainingData,
            ]);

            if ($response->successful()) {
                return response()->json([
                    'message' => 'Model trained successfully',
                    'result' => $response->json(),
                ]);
            }

            return response()->json([
                'error' => 'Training failed',
                'details' => $response->json(),
            ], 500);

        } catch (\Exception $e) {
            Log::error('Chatbot training failed: ' . $e->getMessage());
            return response()->json(['error' => 'Could not connect to ML service: ' . $e->getMessage()], 500);
        }
    }

    public function modelInfo()
    {
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $response = Http::timeout(10)->get("{$mlUrl}/chatbot/model-info");

            if ($response->successful()) {
                return response()->json($response->json());
            }
            return response()->json(['status' => 'unavailable'], 503);
        } catch (\Exception $e) {
            return response()->json(['status' => 'unavailable', 'error' => $e->getMessage()], 503);
        }
    }

    public function rollbackModel()
    {
        try {
            $mlUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
            $response = Http::timeout(10)->post("{$mlUrl}/chatbot/rollback");

            if ($response->successful()) {
                return response()->json($response->json());
            }
            return response()->json(['error' => 'Rollback failed'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── Prediction Logs ──────────────────────────────────────────────

    public function logs(Request $request)
    {
        $perPage = $request->get('per_page', 50);
        $logs = DB::table('chatbot_prediction_logs')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    // ── Seed Initial Data ────────────────────────────────────────────

    public function seed()
    {
        // Read from the JSON file in shared storage
        $jsonPath = storage_path('app/ml/chatbot_training_data.json');
        if (!file_exists($jsonPath)) {
            return response()->json(['error' => 'Seed data file not found at ' . $jsonPath], 404);
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (!$data || !isset($data['intents'])) {
            return response()->json(['error' => 'Invalid seed data format'], 400);
        }

        $now = now();
        $intentCount = 0;
        $exampleCount = 0;

        foreach ($data['intents'] as $item) {
            // Create or find intent
            $existing = DB::table('chatbot_intents')->where('name', $item['intent'])->first();
            if ($existing) {
                $intentId = $existing->id;
            } else {
                $intentId = DB::table('chatbot_intents')->insertGetId([
                    'name' => $item['intent'],
                    'description' => ucwords(str_replace('_', ' ', $item['intent'])),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $intentCount++;
            }

            // Add examples (skip duplicates)
            $existingTexts = DB::table('chatbot_training_examples')
                ->where('intent_id', $intentId)
                ->pluck('text')
                ->toArray();

            $newExamples = [];
            foreach ($item['examples'] as $text) {
                $text = trim($text);
                if (!in_array($text, $existingTexts)) {
                    $newExamples[] = [
                        'intent_id' => $intentId,
                        'text' => $text,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if (!empty($newExamples)) {
                DB::table('chatbot_training_examples')->insert($newExamples);
                $exampleCount += count($newExamples);
            }
        }

        return response()->json([
            'message' => "Seeded {$intentCount} new intents and {$exampleCount} new examples.",
            'total_intents' => DB::table('chatbot_intents')->count(),
            'total_examples' => DB::table('chatbot_training_examples')->count(),
        ]);
    }
}
