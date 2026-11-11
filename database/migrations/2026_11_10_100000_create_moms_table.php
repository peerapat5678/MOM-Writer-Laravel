<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Meeting minutes (MOM Writer). One row per meeting: the full document is
     * stored as JSON in `data`; the other columns are copies used for listing
     * and searching, refreshed by the API on every save.
     */
    public function up(): void
    {
        Schema::create('moms', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->date('meeting_date')->nullable();
            $table->string('location', 255)->nullable();
            $table->string('recorder', 255)->nullable();
            $table->unsignedInteger('open_actions')->default(0);
            $table->longText('search_text')->nullable();
            $table->longText('data');
            $table->unsignedInteger('version')->default(1);
            $table->string('created_by', 50)->nullable();   // employee_code
            $table->string('updated_by', 50)->nullable();   // employee_code
            $table->timestamps();
            $table->dateTime('deleted_at')->nullable();

            $table->index(['deleted_at', 'meeting_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moms');
    }
};
