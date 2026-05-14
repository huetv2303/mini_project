<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Jobs\GenerateProductEmbedding;

class GenerateProductEmbeddingsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chatbot:generate-embeddings {--force : Force regenerate all embeddings}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate vector embeddings for products to support AI Chatbot Search';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');

        $query = Product::where('status', 1);

        if (!$force) {
            $query->whereNull('embedding');
        }

        $products = $query->get();
        $total = $products->count();

        if ($total === 0) {
            $this->info("Không có sản phẩm nào cần tạo Embedding.");
            return;
        }

        $this->info("Đang đưa {$total} sản phẩm vào hàng đợi tạo Embedding...");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($products as $product) {
            GenerateProductEmbedding::dispatch($product);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Đã đưa tất cả vào Queue. Hãy chạy 'php artisan queue:work' nếu chưa bật worker!");
    }
}
