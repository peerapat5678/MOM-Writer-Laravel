<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** MOM Writer address book, used to fill in meeting attendees quickly. */
    public function up(): void
    {
        $sqlsrv = DB::connection($this->getConnection())->getDriverName() === 'sqlsrv';

        Schema::create('mom_contacts', function (Blueprint $table) use ($sqlsrv) {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255)->nullable();
            $table->string('role', 255)->nullable();
            $table->timestamps();

            $table->index('name');
            if (! $sqlsrv) {
                $table->unique('email');
            }
        });

        // SQL Server treats NULLs as equal in a unique index, so use a filtered
        // index there: emails are unique, but many contacts may have none.
        if ($sqlsrv) {
            DB::connection($this->getConnection())->statement(
                'CREATE UNIQUE INDEX mom_contacts_email_unique ON mom_contacts (email) WHERE email IS NOT NULL'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mom_contacts');
    }
};
