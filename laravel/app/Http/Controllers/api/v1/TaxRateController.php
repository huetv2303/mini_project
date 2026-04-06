<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\TaxRate;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaxRateController extends Controller
{
    public function index()
    {
        $taxRates = TaxRate::all();
        return response()->json($taxRates);
    }

    public function active()
    {
        $taxRates = TaxRate::where('is_active', true)->get();
        return response()->json($taxRates);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $taxRate = TaxRate::create($validated);
        return response()->json($taxRate, 201);
    }

    public function show($id)
    {
        $taxRate = TaxRate::findOrFail($id);
        return response()->json($taxRate);
    }

    public function update(Request $request, $id)
    {
        $taxRate = TaxRate::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'rate' => 'sometimes|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $taxRate->update($validated);
        return response()->json($taxRate);
    }

    public function destroy($id)
    {
        $taxRate = TaxRate::findOrFail($id);

        if (Order::where('tax_rate_id', $id)->exists()) {
            return response()->json(['message' => 'Không thể xóa mức thuế đang được sử dụng trong đơn hàng.'], 400);
        }

        $taxRate->delete();
        return response()->json(null, 204);
    }

    public function statistics(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end   = Carbon::parse($endDate)->endOfDay();
        } else {
            $start = Carbon::now()->startOfMonth();
            $end   = Carbon::now()->endOfDay();
        }

        $byTaxRate = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull('tax_rate_id')
            ->select(
                'tax_rate_id',
                'tax_rate_snapshot',
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(tax_amount) as total_tax'),
                DB::raw('SUM(final_amount) as total_revenue')
            )
            ->groupBy('tax_rate_id', 'tax_rate_snapshot')
            ->with('taxRate:id,name')
            ->get()
            ->map(fn($row) => [
                'tax_rate_id'      => $row->tax_rate_id,
                'tax_name'         => $row->taxRate?->name ?? "Thuế {$row->tax_rate_snapshot}%",
                'rate'             => $row->tax_rate_snapshot,
                'order_count'      => (int) $row->order_count,
                'total_tax'        => (float) $row->total_tax,
                'total_revenue'    => (float) $row->total_revenue,
            ]);

        $totalTax = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$start, $end])
            ->sum('tax_amount');

        $ordersWithoutTax = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$start, $end])
            ->where(function ($q) {
                $q->whereNull('tax_rate_id')->orWhere('tax_amount', 0);
            })
            ->count();

        $dailyData = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(tax_amount) as total_tax'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $dailyChart = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $dateStr = $cursor->format('Y-m-d');
            $row = $dailyData->firstWhere('date', $dateStr);
            $dailyChart[] = [
                'date'        => $cursor->format('d/m'),
                'total_tax'   => $row ? (float) $row->total_tax : 0,
                'order_count' => $row ? (int) $row->order_count : 0,
            ];
            $cursor->addDay();
        }

        return response()->json([
            'summary' => [
                'total_tax'          => (float) $totalTax,
                'orders_without_tax' => $ordersWithoutTax,
                'period'             => [
                    'start' => $start->toDateString(),
                    'end'   => $end->toDateString(),
                ],
            ],
            'by_tax_rate' => $byTaxRate,
            'daily_chart' => $dailyChart,
        ]);
    }
}
