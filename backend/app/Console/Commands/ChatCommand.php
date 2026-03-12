<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\ChatbotController;
use Illuminate\Http\Request;

class ChatCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:chat';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Chat with the CRM AI Assistant directly in the terminal';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("=================================================");
        $this->info("🤖 Welcome to the OurCRM AI Assistant Terminal!");
        $this->info("=================================================");
        $this->line("I have full access to your CRM database. Ask me for:");
        $this->line(" - \"customers by tier\"");
        $this->line(" - \"show recent leads\"");
        $this->line(" - \"summary\"");
        $this->line(" - \"find product iPhone\"");
        $this->line("(Type 'exit' or 'quit' to leave)\n");

        $controller = new ChatbotController();

        while (true) {
            $message = $this->ask("You");

            $input = trim($message ?? '');

            if (in_array(strtolower($input), ['exit', 'quit', 'bye'])) {
                $this->info("\n🤖 AI Assistant: Goodbye! Have a great day! 👋");
                break;
            }

            if (empty($input)) {
                continue;
            }

            // Create a fake request to pass to the ChatbotController
            $request = Request::create('/api/chatbot', 'POST', ['message' => $input]);

            try {
                $response = $controller->chat($request);
                
                // The controller returns a JsonResponse
                $data = json_decode($response->getContent(), true);
                $reply = $data['response'] ?? 'Sorry, I encountered an error formatting the response.';

                // Clean up markdown bold/italic tags to look better in standard terminals
                $reply = str_replace('**', '', $reply);
                
                $this->line("");
                $this->info("🤖 AI Assistant:");
                $this->line($reply);
                $this->line("");

            } catch (\Exception $e) {
                $this->error("\n⚠️ Error connecting to AI Assistant: " . $e->getMessage() . "\n");
            }
        }
    }
}
