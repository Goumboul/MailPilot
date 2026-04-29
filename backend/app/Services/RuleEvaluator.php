<?php

namespace App\Services;

use App\Models\Recipient;
use App\Models\Rule;
use Illuminate\Support\Facades\Log;

class RuleEvaluator
{
    public function evaluate(Rule $rule, Recipient $recipient): bool
    {
        $conditions = $rule->conditions;

        if (empty($conditions)) {
            return false;
        }

        foreach ($conditions as $condition) {
            if (! $this->evaluateCondition($condition, $recipient)) {
                return false;
            }
        }

        return true;
    }

    private function evaluateCondition(array $condition, Recipient $recipient): bool
    {
        $field    = $condition['field'] ?? null;
        $operator = $condition['operator'] ?? null;
        $value    = $condition['value'] ?? null;

        if ($field === null || $operator === null || $value === null) {
            Log::warning('RuleEvaluator: malformed condition', $condition);

            return false;
        }

        $actual = $this->resolveField($field, $recipient);

        return match ($operator) {
            '='        => $actual == $value,
            '!='       => $actual != $value,
            '>'        => (float) $actual > (float) $value,
            '<'        => (float) $actual < (float) $value,
            'contains' => is_string($actual) && str_contains($actual, $value),
            default    => false,
        };
    }

    private function resolveField(string $field, Recipient $recipient): mixed
    {
        if ($field === 'name') {
            return $recipient->name;
        }

        if ($field === 'email') {
            return $recipient->email;
        }

        if (str_starts_with($field, 'metadata->')) {
            $key = substr($field, strlen('metadata->'));

            return $recipient->metadata[$key] ?? null;
        }

        // Treat any unrecognised field as a metadata key
        return $recipient->metadata[$field] ?? null;
    }
}
