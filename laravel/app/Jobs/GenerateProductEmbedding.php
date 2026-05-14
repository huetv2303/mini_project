<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateProductEmbedding implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $product;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(Product $product)
    {
        $this->product = $product;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $product = $this->product->load([
            'category',
            'variants.attributes'
        ]);

        try {
            $fullText = "Tên sản phẩm: " . $product->name . ". ";

            $soldCount = $product->sold_count ?? 0;
            $fullText .= "Đã bán: {$soldCount} sản phẩm. ";

            if ($soldCount > 10) {
                $fullText .= "Đây là sản phẩm bán chạy, được nhiều khách hàng yêu thích. ";
            }

            if ($product->category) {
                $fullText .= "Danh mục: " . $product->category->name . ". ";
            }

            $desc = strip_tags($product->description);
            $desc = preg_replace('/\s+/', ' ', $desc);
            $fullText .= "Mô tả: " . mb_substr($desc, 0, 2000) . ". ";

            if ($product->variants->isNotEmpty()) {
                $variantsInfo = [];
                foreach ($product->variants as $variant) {
                    $attrs = $variant->attributes->map(function ($attr) {
                        return ($attr->attribute_name ?? '') . ' ' . $attr->attribute_value;
                    })->implode(' ');

                    $price = number_format($variant->price, 0, ',', '.');
                    $stock = $variant->inventory && $variant->inventory->quantity > 0 ? "còn hàng" : "hết hàng";

                    $variantsInfo[] = "[Phiên bản {$attrs} giá {$price}đ ({$stock})]";
                }
                $fullText .= "Các tùy chọn mua hàng: " . implode(', ', $variantsInfo) . ".";
            }

            Log::info("FullText của SP {$product->id}: " . $fullText);
            
            $vector = $this->getEmbedding($fullText);

            if ($vector) {
                $product->embedding = json_encode($vector);
                $product->saveQuietly();
                Log::info("Đã cập nhật Vector cho SP ID: {$product->id}");
            }
        } catch (\Exception $e) {
            Log::error("Lỗi tạo Vector SP ID {$product->id}: " . $e->getMessage());
        }
    }

    private function getEmbedding($text)
    {
        $apiKey = config('gemini.api_key');
        $model = config('gemini.embedding_model');
        $baseUrl = config('gemini.base_url');
        
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$baseUrl}/{$model}:embedContent?key={$apiKey}", [
                'model' => 'models/' . $model,
                'content' => ['parts' => [['text' => $text]]]
            ]);

        return $response->json()['embedding']['values'] ?? null;
    }
}
