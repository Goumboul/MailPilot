<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRuleRequest;
use App\Http\Requests\UpdateRuleRequest;
use App\Http\Resources\RuleResource;
use App\Models\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RuleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RuleResource::collection(Rule::with('emailTemplate')->get());
    }

    public function store(StoreRuleRequest $request): JsonResponse
    {
        $rule = Rule::create($request->validated());
        $rule->load('emailTemplate');

        return (new RuleResource($rule))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Rule $rule): RuleResource
    {
        $rule->load('emailTemplate');

        return new RuleResource($rule);
    }

    public function update(UpdateRuleRequest $request, Rule $rule): RuleResource
    {
        $rule->update($request->validated());
        $rule->load('emailTemplate');

        return new RuleResource($rule);
    }

    public function destroy(Rule $rule): JsonResponse
    {
        $rule->delete();

        return response()->json(null, 204);
    }
}
