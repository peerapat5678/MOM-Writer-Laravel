<?php

namespace Tests\Feature;

use App\Services\BackofficeAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MomApiTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->token = app(BackofficeAuthService::class)->issueTokens('EMP001')['access_token'];
    }

    public function test_mom_endpoints_require_an_access_token(): void
    {
        $this->getJson('/api/backoffice/moms')->assertStatus(401);
        $this->getJson('/api/backoffice/mom-contacts')->assertStatus(401);
    }

    public function test_create_list_and_show(): void
    {
        $created = $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('ประชุมทีม IS')])
            ->assertCreated()
            ->assertJsonPath('version', 1)
            ->json();

        $this->api()->getJson('/api/backoffice/moms')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('items.0.title', 'ประชุมทีม IS')
            ->assertJsonPath('items.0.open_actions', 1)
            ->assertJsonPath('items.0.updated_by', 'EMP001');

        $this->api()->getJson("/api/backoffice/moms/{$created['id']}")
            ->assertOk()
            ->assertJsonPath('data.title', 'ประชุมทีม IS')
            ->assertJsonPath('created_by', 'EMP001');
    }

    public function test_title_is_required(): void
    {
        $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('')])
            ->assertStatus(422)
            ->assertJsonPath('error', 'title_required');
    }

    public function test_stale_version_is_rejected_unless_forced(): void
    {
        $id = $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('A')])->json('id');

        $this->api()->putJson("/api/backoffice/moms/{$id}", ['version' => 1, 'data' => $this->doc('B')])
            ->assertOk()->assertJsonPath('version', 2);

        $this->api()->putJson("/api/backoffice/moms/{$id}", ['version' => 1, 'data' => $this->doc('C')])
            ->assertStatus(409)->assertJsonPath('version', 2);

        $this->api()->putJson("/api/backoffice/moms/{$id}", ['force' => true, 'data' => $this->doc('C')])
            ->assertOk()->assertJsonPath('version', 3);

        $this->api()->getJson("/api/backoffice/moms/{$id}")->assertJsonPath('data.title', 'C');
    }

    public function test_delete_and_restore(): void
    {
        $id = $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('ลบได้')])->json('id');

        $this->api()->deleteJson("/api/backoffice/moms/{$id}")->assertOk();
        $this->api()->getJson('/api/backoffice/moms')->assertJsonPath('total', 0);
        $this->api()->getJson("/api/backoffice/moms/{$id}")->assertNotFound();

        $this->api()->postJson("/api/backoffice/moms/{$id}/restore")->assertOk();
        $this->api()->getJson('/api/backoffice/moms')->assertJsonPath('total', 1);
    }

    public function test_search_treats_wildcards_literally(): void
    {
        $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('ยอดขาย 100% [Q4]')]);
        $this->api()->postJson('/api/backoffice/moms', ['data' => $this->doc('ยอดขาย 100 Q4')]);

        $this->api()->getJson('/api/backoffice/moms?q='.urlencode('100%'))->assertJsonPath('total', 1);
        $this->api()->getJson('/api/backoffice/moms?q='.urlencode('[Q4]'))->assertJsonPath('total', 1);
        $this->api()->getJson('/api/backoffice/moms?q='.urlencode('Q4'))->assertJsonPath('total', 2);
        $this->api()->getJson('/api/backoffice/moms?q='.urlencode('คุณเอ'))->assertJsonPath('total', 2);
    }

    public function test_contacts_upsert_by_email_and_reject_duplicates(): void
    {
        $this->api()->postJson('/api/backoffice/mom-contacts', ['items' => [
            ['name' => 'คุณเอ', 'email' => 'A@example.com', 'role' => 'IS'],
            ['name' => 'คุณบี', 'email' => 'b@example.com'],
        ]])->assertCreated();

        // Same email (any case) updates the existing contact instead of adding one.
        $this->api()->postJson('/api/backoffice/mom-contacts', ['name' => 'คุณเอ ใหม่', 'email' => 'a@example.com'])
            ->assertCreated()
            ->assertJsonPath('name', 'คุณเอ ใหม่')
            ->assertJsonPath('role', 'IS');

        $contacts = $this->api()->getJson('/api/backoffice/mom-contacts')->assertOk()->json('items');
        $this->assertCount(2, $contacts);

        $b = collect($contacts)->firstWhere('email', 'b@example.com');
        $this->api()->putJson("/api/backoffice/mom-contacts/{$b['id']}", ['name' => 'คุณบี', 'email' => 'a@example.com'])
            ->assertStatus(409)
            ->assertJsonPath('error', 'duplicate_email');

        $this->api()->deleteJson("/api/backoffice/mom-contacts/{$b['id']}")->assertOk();
        $this->assertCount(1, $this->api()->getJson('/api/backoffice/mom-contacts')->json('items'));
    }

    public function test_contact_email_must_be_valid(): void
    {
        $this->api()->postJson('/api/backoffice/mom-contacts', ['name' => 'X', 'email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'bad_email');
    }

    private function api(): static
    {
        return $this->withToken($this->token);
    }

    private function doc(string $title): array
    {
        return [
            'title' => $title,
            'date' => '2026-11-10',
            'location' => 'ห้อง 17B02',
            'sections' => [
                ['type' => 'attendees', 'title' => 'ผู้เข้าร่วมประชุม', 'items' => [
                    ['name' => 'คุณเอ', 'email' => 'a@example.com', 'role' => 'IS', 'present' => true],
                ]],
                ['type' => 'actions', 'title' => 'งานที่ต้องดำเนินการ', 'items' => [
                    ['task' => 'ทำรายงาน', 'owner' => 'คุณเอ', 'due' => '', 'status' => 'ยังไม่เริ่ม'],
                    ['task' => 'ส่งอีเมล', 'owner' => 'คุณบี', 'due' => '', 'status' => 'เสร็จแล้ว'],
                ]],
            ],
        ];
    }
}
