<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_root_opens_mom_writer(): void
    {
        $base = ($p = trim((string) config('app.project'), '/')) === '' ? '' : "/{$p}";

        $this->get('/')->assertRedirect("{$base}/backoffice/moms");
    }

    public function test_backoffice_pages_serve_the_spa(): void
    {
        $base = ($p = trim((string) config('app.project'), '/')) === '' ? '' : "/{$p}";

        $this->withoutVite();

        $this->get("{$base}/backoffice/moms")->assertOk()->assertSee('backoffice-app', false);
        $this->get("{$base}/backoffice/login")->assertOk();
    }
}
