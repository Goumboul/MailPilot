<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // Add 'processing' enum value and make rule_id nullable
            DB::statement("ALTER TABLE email_sends MODIFY COLUMN status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending'");
            DB::statement('ALTER TABLE email_sends MODIFY COLUMN rule_id BIGINT UNSIGNED NULL');
        }

        // SQLite: recreate the table (SQLite doesn't support ALTER COLUMN)
        if ($driver === 'sqlite') {
            Schema::table('email_sends', function (Blueprint $table) {
                // SQLite ignores enum; string column already accepts any value.
                // Drop the foreign key constraint on rule_id and make it nullable.
                $table->unsignedBigInteger('rule_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Intentionally left blank — reverting enum changes is destructive.
    }
};
