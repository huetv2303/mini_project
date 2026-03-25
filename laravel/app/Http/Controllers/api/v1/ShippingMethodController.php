<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ShippingMethod;

class ShippingMethodController extends Controller
{
    public function index()
    {
        $methods = ShippingMethod::all();
        return response()->json($methods);
    }

    public function active()
    {
        $methods = ShippingMethod::where('is_active', true)->get();
        return response()->json($methods);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cost' => 'required|numeric|min:0',
            'estimated_days' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $method = ShippingMethod::create($validated);
        return response()->json($method, 201);
    }

    public function show($id)
    {
        $method = ShippingMethod::findOrFail($id);
        return response()->json($method);
    }

    public function update(Request $request, $id)
    {
        $method = ShippingMethod::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'cost' => 'sometimes|numeric|min:0',
            'estimated_days' => 'sometimes|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $method->update($validated);
        return response()->json($method);
    }

    public function destroy($id)
    {
        $method = ShippingMethod::findOrFail($id);
        if ($method->orders()->exists()) {
            return response()->json(['message' => 'Không thể xóa phương thức vận chuyển đang được sử dụng.'], 400);
        }
        $method->delete();
        return response()->json(null, 204);
    }
}
