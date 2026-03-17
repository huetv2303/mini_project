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
        $data = $this->cateService->getAll($request);
        if ($data instanceof Builder || $data instanceof Relation) {
            $data = $data->paginate(10);
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
        $category = $this->cateService->findBySlug($slug);
        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        if ($category->image) {
            $this->uploadService->deleteFile($category->image);
        }

        $this->cateService->deleteCate($slug);

        return response()->json(null, 204);
    }
}
