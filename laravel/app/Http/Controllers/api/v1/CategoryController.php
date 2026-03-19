<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Services\CategoryService;
use App\Services\UploadService;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

class CategoryController extends Controller
{
    protected $cateService;
    protected $uploadService;

    public function __construct(CategoryService $cateService, UploadService $uploadService)
    {
        $this->cateService = $cateService;
        $this->uploadService = $uploadService;
    }

    public function index(Request $request)
    {
        $query = $this->cateService->getAll($request);

        if ($request->has('all') && $request->all == 'true') {
            $data = $query->get();
            return response()->json([
                'status' => 'success',
                'message' => 'All category list',
                'data' => CategoryResource::collection($data)
            ]);
        }

        // Mặc định: Phân trang danh mục gốc để xây dựng cây thư mục (TreeView)
        // Nếu gõ tìm kiếm: Lấy tất cả (không lọc cha) để người dùng tìm thấy cả cấp con
        if ($query instanceof Builder || $query instanceof Relation) {
            if (!$request->has('search') || empty($request->search)) {
                $query->where(function ($q) {
                    $q->whereNull('parent_id')->orWhere('parent_id', 0);
                });
            }

            $data = $query->with(['childrenRecursive'])
                ->withCount('children')
                ->paginate(3);
        } else {
            // Nếu là collection, lọc bằng PHP
            $data = $query->whereIn('parent_id', [null, 0]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Category list',
            'data' => CategoryResource::collection($data)->response()->getData(true)
        ]);
    }

    public function show($slug)
    {
        $category = $this->cateService->findBySlug($slug);
        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new CategoryResource($category->load('parent'))
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $validatedData = $request->validated();
        if ($request->hasFile('image')) {
            $image = $this->uploadService->uploadFile($request->file('image'), 'categories', 500, 500);
            $validatedData['image'] = $image['path'];
        }

        $category = $this->cateService->createCate($validatedData);

        return response()->json([
            'status' => 'success',
            'message' => 'Category created successfully',
            'data' => new CategoryResource($category->load('parent'))
        ], 201);
    }

    public function update(UpdateCategoryRequest $request, string $slug)
    {
        $category = $this->cateService->findBySlug($slug);
        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        $data = $request->validated();
        if ($request->hasFile('image')) {
            if ($category->image) {
                $this->uploadService->deleteFile($category->image);
            }

            $image = $this->uploadService->uploadFile($request->file('image'), 'categories', 500, 500);
            $data['image'] = $image['path'];
        }

        $data['id'] = $category->id;
        $updated = $this->cateService->updateCate($data);

        return response()->json([
            'status' => 'success',
            'data' => new CategoryResource($updated->load('parent')),
            'message' => 'Category updated successfully'
        ]);
    }

    public function destroy($slug)
    {
        try {
            $category = $this->cateService->findBySlug($slug);
            if (!$category) {
                return response()->json(['status' => 'error', 'message' => 'Không tìm thấy danh mục'], 404);
            }

            // Kiểm tra xem có danh mục con không
            if ($category->children()->count() > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Không thể xóa danh mục "' . $category->name . '" vì vẫn còn danh mục con đang hoạt động!'
                ], 400);
            }

            if ($category->image) {
                $this->uploadService->deleteFile($category->image);
            }

            $this->cateService->deleteCate($slug);

            return response()->json([
                'status' => 'success',
                'message' => 'Xóa danh mục thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa hàng loạt danh mục
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'Vui lòng chọn ít nhất một danh mục để xóa'], 400);
        }

        $deletedCount = 0;
        $failedNames = [];

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            foreach ($ids as $id) {
                $category = \App\Models\Category::find($id);
                if ($category) {
                    // Ngăn chặn xóa nếu còn danh mục con
                    if ($category->children()->count() > 0) {
                        $failedNames[] = $category->name;
                        continue;
                    }

                    // Xóa ảnh trước khi xóa bản ghi
                    if ($category->image) {
                        $this->uploadService->deleteFile($category->image);
                    }

                    $category->delete();
                    $deletedCount++;
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            if (count($failedNames) > 0) {
                $message = "Đã xóa {$deletedCount} danh mục.";
                $message .= " Các danh mục sau giữ lại do có chứa con: " . implode(', ', $failedNames);

                return response()->json([
                    'status' => 'warning',
                    'message' => $message,
                    'deleted_count' => $deletedCount,
                    'failed_items' => $failedNames
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => "Đã xóa thành công {$deletedCount} danh mục.",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}
