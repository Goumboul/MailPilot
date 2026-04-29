<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecipientRequest;
use App\Http\Requests\UpdateRecipientRequest;
use App\Http\Resources\RecipientResource;
use App\Models\Recipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecipientController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RecipientResource::collection(Recipient::all());
    }

    public function store(StoreRecipientRequest $request): JsonResponse
    {
        $recipient = Recipient::create($request->validated());

        return (new RecipientResource($recipient))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Recipient $recipient): RecipientResource
    {
        return new RecipientResource($recipient);
    }

    public function update(UpdateRecipientRequest $request, Recipient $recipient): RecipientResource
    {
        $recipient->update($request->validated());

        return new RecipientResource($recipient);
    }

    public function destroy(Recipient $recipient): JsonResponse
    {
        $recipient->delete();

        return response()->json(null, 204);
    }
}
