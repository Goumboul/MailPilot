<?php

use App\Http\Controllers\Api\EmailSendController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\RecipientController;
use App\Http\Controllers\Api\RuleController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

Route::apiResource('recipients', RecipientController::class);
Route::apiResource('email-templates', EmailTemplateController::class);
Route::apiResource('rules', RuleController::class);
Route::get('email-sends', [EmailSendController::class, 'index']);
Route::get('email-sends/{emailSend}', [EmailSendController::class, 'show']);
Route::get('email-sends/{emailSend}/logs', [EmailSendController::class, 'logs']);
Route::get('stats', StatsController::class);
