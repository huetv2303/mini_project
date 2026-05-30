<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

class TaxRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        TaxRate::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $taxRates = [
            [
                'name' => 'Thuế GTGT 8% (VAT)',
                'rate' => 8.00,
                'is_active' => true,
            ],
            [
                'name' => 'Thuế GTGT 10% (VAT)',
                'rate' => 10.00,
                'is_active' => true,
            ],
            [
                'name' => 'Miễn thuế (0%)',
                'rate' => 0.00,
                'is_active' => true,
            ]
        ];

        foreach ($taxRates as $taxRate) {
            TaxRate::create($taxRate);
        }
    }
}
