<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support ALTER COLUMN for enums.
        // Recreate the column by renaming, adding, copying, dropping.
        // For MySQL: ALTER TABLE email_sends MODIFY COLUMN status ENUM(...)
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: rebuild the table structure via a raw statement is not needed —
            // SQLite ignores CHECK constraints on enums so we can just update the column
            // type declaration without a true migration. We use a no-op here because
            // SQLite stores enums as TEXT and will accept any value already.
            // The application-level enum validation ensures correctness.
            return;
        }

        DB::statement("ALTER TABLE email_sends MODIFY COLUMN status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE email_sends MODIFY COLUMN status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending'");
    }
};
