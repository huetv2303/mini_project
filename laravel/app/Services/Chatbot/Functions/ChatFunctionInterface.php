<?php

namespace App\Services\Chatbot\Functions;

interface ChatFunctionInterface
{
    /**
     * Tên function (ví dụ: searchProducts)
     */
    public function getName(): string;

    /**
     * Mô tả chi tiết để AI hiểu khi nào nên dùng tool này
     */
    public function getDescription(): string;

    /**
     * Cấu trúc tham số (JSON Schema format)
     */
    public function getParameters(): array;

    /**
     * Thực thi logic với các tham số do AI truyền vào
     */
    public function execute(array $args): array;
}
