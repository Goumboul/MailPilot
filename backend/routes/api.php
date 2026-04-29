<?php

use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\RecipientController;
use App\Http\Controllers\Api\RuleController;
use Illuminate\Support\Facades\Route;

Route::apiResource('recipients', RecipientController::class);
Route::apiResource('email-templates', EmailTemplateController::class);
Route::apiResource('rules', RuleController::class);
