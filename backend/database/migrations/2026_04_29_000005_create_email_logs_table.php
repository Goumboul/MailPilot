<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_send_id')->constrained()->cascadeOnDelete();
            $table->enum('event', ['queued', 'attempted', 'sent', 'failed', 'retry_scheduled']);
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('event');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
