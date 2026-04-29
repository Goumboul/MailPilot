<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRuleRequest;
use App\Http\Requests\UpdateRuleRequest;
use App\Http\Resources\RuleResource;
use App\Jobs\SendEmailJob;
use App\Models\EmailSend;
use App\Models\Recipient;
use App\Models\Rule;
use App\Services\RuleEvaluator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class RuleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RuleResource::collection(Rule::with('emailTemplate')->get());
    }

    public function store(StoreRuleRequest $request): RuleResource
    {
        $rule = Rule::create($request->validated());

        return new RuleResource($rule->load('emailTemplate'));
    }

    public function show(Rule $rule): RuleResource
    {
        return new RuleResource($rule->load('emailTemplate'));
    }

    public function update(UpdateRuleRequest $request, Rule $rule): RuleResource
    {
        $rule->update($request->validated());

        return new RuleResource($rule->load('emailTemplate'));
    }

    public function destroy(Rule $rule): JsonResponse
    {
        $rule->delete();

        return response()->json(null, 204);
    }

    public function trigger(Rule $rule, RuleEvaluator $evaluator): JsonResponse
    {
        $matched     = 0;
        $alreadySent = 0;
        $enqueued    = 0;

        // Pre-load existing sends for this rule to avoid N+1 queries
        $existingSendRecipientIds = EmailSend::where('rule_id', $rule->id)
            ->pluck('recipient_id')
            ->flip();

        Recipient::query()->chunk(500, function ($recipients) use (
            $rule,
            $evaluator,
            $existingSendRecipientIds,
            &$matched,
            &$alreadySent,
            &$enqueued
        ) {
            foreach ($recipients as $recipient) {
                try {
                    if (! $evaluator->evaluate($rule, $recipient)) {
                        continue;
                    }

                    $matched++;

                    if ($existingSendRecipientIds->has($recipient->id)) {
                        $alreadySent++;
                        continue;
                    }

                    $emailSend = EmailSend::create([
                        'rule_id'           => $rule->id,
                        'recipient_id'      => $recipient->id,
                        'email_template_id' => $rule->email_template_id,
                        'status'            => 'pending',
                    ]);

                    SendEmailJob::dispatch($emailSend->id);

                    $enqueued++;
                } catch (\Throwable $e) {
                    Log::error('RuleController@trigger: error processing recipient', [
                        'rule_id'      => $rule->id,
                        'recipient_id' => $recipient->id,
                        'error'        => $e->getMessage(),
                    ]);
                }
            }
        });

        Log::info('Rule triggered', [
            'rule_id'      => $rule->id,
            'rule_name'    => $rule->name,
            'matched'      => $matched,
            'already_sent' => $alreadySent,
            'enqueued'     => $enqueued,
        ]);

        return response()->json([
            'rule_id'      => $rule->id,
            'rule_name'    => $rule->name,
            'matched'      => $matched,
            'already_sent' => $alreadySent,
            'enqueued'     => $enqueued,
            'message'      => "{$enqueued} email sends queued",
        ]);
    }
}
