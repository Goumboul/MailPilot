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

        if ($driver === 'sqlite') {
            // SQLite does not support DROP/ADD FOREIGN KEY or CHANGE COLUMN.
            // Rebuild the table.
            Schema::table('email_sends', function (Blueprint $table) {
                $table->dropForeign(['rule_id']);
            });

            Schema::table('email_sends', function (Blueprint $table) {
                $table->foreignId('rule_id')->nullable()->change();
            });

            return;
        }

        Schema::table('email_sends', function (Blueprint $table) {
            $table->foreignId('rule_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('email_sends', function (Blueprint $table) {
            $table->foreignId('rule_id')->nullable(false)->change();
        });
    }
};
