<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use \Illuminate\Support\Facades\Storage;

class PaymentMethodController extends Controller
{
    public function index()
    {
        $methods = PaymentMethod::all();
        return response()->json([
            'status' => 'success',
            'data'   => $methods,
        ]);
    }

    public function show($id)
    {
        $method = PaymentMethod::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data'   => $method,
        ]);
    }

    public function update(Request $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);

        $request->validate([
            'name'        => 'sometimes|string|max:255',
            'code'        => 'sometimes|string|max:255|unique:payment_methods,code,' . $id,
            'description' => 'sometimes|nullable|string',
            'is_active'   => 'sometimes|boolean',
            'image'       => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($method->image && Storage::disk('public')->exists($method->image)) {
                Storage::disk('public')->delete($method->image);
            }
            $path = $request->file('image')->store('payment_methods', 'public');
            $data['image'] = $path;
        }

        $method->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật phương thức thanh toán thành công.',
            'data'    => $method,
        ]);
    }
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'required|string|max:255|unique:payment_methods,code',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $data = $request->all();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('payment_methods', 'public');
            $data['image'] = $path;
        }

        $method = PaymentMethod::create($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Thêm phương thức thanh toán thành công.',
            'data'    => $method,
        ], 201);
    }

    public function destroy($id)
    {
        $method = PaymentMethod::findOrFail($id);

        if ($method->image && Storage::disk('public')->exists($method->image)) {
            Storage::disk('public')->delete($method->image);
        }

        $method->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa phương thức thanh toán thành công.',
        ]);
    }
}
