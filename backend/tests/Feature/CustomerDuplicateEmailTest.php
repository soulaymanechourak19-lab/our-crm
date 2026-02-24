<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDuplicateEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create an admin user for requests
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);
    }

    public function test_cannot_create_customer_with_duplicate_email()
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $email = 'duplicate@example.com';
        Customer::create([
            'name' => 'Existing Customer',
            'email' => $email,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/customers', [
            'name' => 'New Customer',
            'email' => $email,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
        ]);
    }

    public function test_cannot_update_customer_to_existing_email()
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $email1 = 'customer1@example.com';
        $email2 = 'customer2@example.com';
        
        Customer::create(['name' => 'Customer 1', 'email' => $email1]);
        $customer2 = Customer::create(['name' => 'Customer 2', 'email' => $email2]);

        $response = $this->actingAs($admin)->putJson("/api/customers/{$customer2->id}", [
            'name' => 'Updated Customer 2',
            'email' => $email1,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
        ]);
    }

    public function test_cannot_convert_lead_to_existing_customer_email()
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $email = 'existing@example.com';
        Customer::create([
            'name' => 'Existing Customer',
            'email' => $email,
        ]);

        $lead = Lead::create([
            'company_name' => 'Test Company',
            'contact_name' => 'Test Lead',
            'email' => $email,
            'status' => 'qualified',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/leads/{$lead->id}/convert");

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
        ]);
        
        $this->assertEquals('qualified', $lead->fresh()->status);
    }
}
