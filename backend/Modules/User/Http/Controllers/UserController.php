<?php

namespace Modules\User\Http\Controllers;

use Modules\User\Entities\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Display a paginated listing of users.
     */
    public function index(): JsonResponse
    {
        $users = User::paginate(15);

        return response()->json($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email:rfc|max:255|unique:users',
            'password'        => 'required|string|min:8',
            'role'            => 'required|string|in:admin,agent_commercial,agent_sav',
            'phone'           => ['sometimes', 'nullable', 'regex:/^0[5-7]\d{8}$/'],
            'address'         => 'sometimes|nullable|string|max:255',
            'city'            => 'sometimes|nullable|string|max:100',
            'profile_picture' => 'sometimes|nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ], [
            'phone.regex' => 'Phone number must be 10 digits in Moroccan format (e.g., 0612345678).',
            'profile_picture.image' => 'The file must be an image.',
            'profile_picture.mimes' => 'Only JPEG, PNG, and WebP images are allowed.',
            'profile_picture.max'   => 'Image must not exceed 2MB.',
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profile-pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    /**
     * Display the specified user.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'email'           => 'sometimes|string|email:rfc|max:255|unique:users,email,' . $user->id,
            'password'        => 'sometimes|string|min:8',
            'role'            => 'sometimes|string|in:admin,agent_commercial,agent_sav',
            'phone'           => ['sometimes', 'nullable', 'regex:/^0[5-7]\d{8}$/'],
            'address'         => 'sometimes|nullable|string|max:255',
            'city'            => 'sometimes|nullable|string|max:100',
            'profile_picture' => 'sometimes|nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ], [
            'phone.regex' => 'Phone number must be 10 digits in Moroccan format (e.g., 0612345678).',
            'profile_picture.image' => 'The file must be an image.',
            'profile_picture.mimes' => 'Only JPEG, PNG, and WebP images are allowed.',
            'profile_picture.max'   => 'Image must not exceed 2MB.',
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete old picture if exists
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            $path = $request->file('profile_picture')->store('profile-pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        // Handle profile picture removal
        if ($request->has('remove_profile_picture') && $request->remove_profile_picture) {
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            $validated['profile_picture'] = null;
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    /**
     * Soft delete the specified user.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }
}
