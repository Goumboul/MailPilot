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
}
