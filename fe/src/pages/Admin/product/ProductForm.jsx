import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
  fetchProductRequest,
  createProductRequest,
  updateProductRequest,
} from "../../../services/ProductService";
import { fetchCategoriesRequest } from "../../../services/CategoryService";
import { fetchSuppliersRequest } from "../../../services/SupplierService";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../helper/helper";


// Sub-components
import ProductFormTabs from "./components/ProductFormTabs";
import GeneralInfoSection from "./components/GeneralInfoSection";
import CommonAttributesSection from "./components/CommonAttributesSection";
import ProductVariantToggle from "./components/ProductVariantToggle";
import VariantsSection from "./components/VariantsSection";
import StatusSection from "./components/StatusSection";
import MediaSection from "./components/MediaSection";

const ProductForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [activeTab, setActiveTab] = useState("general");


  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    supplier_id: "",
    short_description: "",
    description: "",
    status: "active",
    attributes: [],
  });

  const [variants, setVariants] = useState([
    {
      id: null,
      name: "Mặc định",
      sku: "",
      price: "",
      compare_price: "",
      cost_price: "",
      status: "active",
      image: null,
      inventory: { quantity: 0, min_quantity: 0 },
      attributes: [],
    },
  ]);

  const [featureImage, setFeatureImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, sups] = await Promise.all([
          fetchCategoriesRequest({ all: true }),
          fetchSuppliersRequest({ all: true }),
        ]);
        setCategories(
          Array.isArray(cats.data)
            ? cats.data
            : Array.isArray(cats)
              ? cats
              : [],
        );
        setSuppliers(
          Array.isArray(sups.data)
            ? sups.data
            : Array.isArray(sups)
              ? sups
              : [],
        );

        if (isEdit) {
          const res = await fetchProductRequest(slug);
          console.log(res);
          const p = res.data;
          setFormData({
            name: p.name,
            category_id: p.category?.id || "",
            supplier_id: p.supplier?.id || "",
            short_description: p.short_description,
            description: p.description,
            status: p.status,
            attributes: p.attributes.map((a) => ({
              id: a.id,
              attribute_name: a.attribute_name,
              attribute_value: a.attribute_value,
            })),
          });

          if (p.variants && p.variants.length > 0) {
            const isReallySimple =
              p.variants.length <= 1 &&
              (!p.variants[0]?.attributes ||
                p.variants[0].attributes.length === 0);

            setHasVariants(!isReallySimple);

            setVariants(
              p.variants.map((v) => ({
                id: v.id,
                name: v.name || (isReallySimple ? "Mặc định" : ""),
                sku: v.sku,
                price: v.price,
                compare_price: v.compare_price || "",
                cost_price: v.cost_price || "",
                status: v.status,
                image:
                  typeof v.image === "string" && v.image
                    ? {
                        preview: getImageUrl(v.image),
                        url: v.image,
                        isExisting: true,
                      }
                    : null,
                inventory: {
                  quantity: v.inventory?.quantity ?? 0,
                  min_quantity: v.inventory?.min_quantity ?? 0,
                },
                attributes: v.attributes.map((va) => ({
                  id: va.id,
                  attribute_name: va.attribute_name,
                  attribute_value: va.attribute_value,
                })),
              })),
            );

            // Reconstruct productOptions from variants
            const optionsMap = {};
            p.variants.forEach((v) => {
              v.attributes.forEach((attr) => {
                if (!optionsMap[attr.attribute_name]) {
                  optionsMap[attr.attribute_name] = new Set();
                }
                if (attr.attribute_value) {
                  optionsMap[attr.attribute_name].add(attr.attribute_value);
                }
              });
            });
            const loadedOptions = Object.keys(optionsMap).map((name) => ({
              name,
              values: Array.from(optionsMap[name]),
            }));
            setProductOptions(loadedOptions);
          }

          if (p.feature_image) {
            setFeatureImage({
              preview: p.feature_image, // full URL from ProductResource
              url: p.feature_image,
              isExisting: true,
            });
          }
          if (p.images && p.images.length > 0) {
            setGalleryImages(
              p.images.map((img) => ({
                id: img.id,
                preview: img.url, // ProductResource returns full URL in 'url'
                url: img.url,
                isExisting: true,
              })),
            );
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isEdit, slug]);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: null,
        name: "",
        sku: "",
        price: "",
        compare_price: "",
        cost_price: "",
        status: "active",
        image: null,
        inventory: { quantity: 0, min_quantity: 0 },
        attributes: [],
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1)
      return toast.error("Phải có ít nhất 1 biến thể sản phẩm");
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    const keys = field.split(".");
    if (keys.length === 1) {
      newVariants[index][field] = value;
    } else {
      let current = newVariants[index];
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    }
    setVariants(newVariants);
  };

  const handleOptionsChange = (newOptions) => {
    setProductOptions(newOptions);

    const validOptions = newOptions.filter(
      (o) => o.name && o.values.length > 0
    );
    if (validOptions.length === 0) {
      if (hasVariants) {
        setVariants([
          {
            id: null,
            name: "Mặc định",
            sku: "",
            price: "",
            compare_price: "",
            cost_price: "",
            status: "active",
            image: null,
            inventory: { quantity: 0, min_quantity: 0 },
            attributes: [],
          },
        ]);
      }
      return;
    }

    const cartesian = (args) =>
      args.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())), [
        [],
      ]);
    const formattedOptions = validOptions.map((o) =>
      o.values.map((v) => ({ attribute_name: o.name, attribute_value: v }))
    );
    const combinations = cartesian(formattedOptions);

    const newVariants = combinations.map((comb) => {
      // Find existing match
      const existingMatch = variants.find((v) => {
        if (v.attributes.length !== comb.length) return false;
        return comb.every((c) =>
          v.attributes.some(
            (va) =>
              va.attribute_name === c.attribute_name &&
              va.attribute_value === c.attribute_value
          )
        );
      });

      const generatedName = comb.map((c) => c.attribute_value).join(" - ");

      if (existingMatch) {
        const mergedAttributes = comb.map((c) => {
          const exAttr = existingMatch.attributes.find(
            (va) =>
              va.attribute_name === c.attribute_name &&
              va.attribute_value === c.attribute_value
          );
          return exAttr && exAttr.id ? { ...c, id: exAttr.id } : c;
        });
        return { ...existingMatch, name: generatedName, attributes: mergedAttributes };
      } else {
        return {
          id: null,
          name: generatedName,
          sku: "",
          price: "",
          compare_price: "",
          cost_price: "",
          status: "active",
          image: null,
          inventory: { quantity: 0, min_quantity: 0 },
          attributes: comb,
        };
      }
    });

    setVariants(newVariants);
  };

  const handleBulkApply = (updates) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        const nv = { ...v, inventory: { ...v.inventory } };
        if (updates.price !== undefined && updates.price !== "")
          nv.price = updates.price;
        if (
          updates.compare_price !== undefined &&
          updates.compare_price !== ""
        )
          nv.compare_price = updates.compare_price;
        if (
          updates.inventory?.quantity !== undefined &&
          updates.inventory.quantity !== ""
        ) {
          nv.inventory.quantity = updates.inventory.quantity;
        } else if (updates.quantity !== undefined && updates.quantity !== "") {
          nv.inventory.quantity = updates.quantity;
        }
        if (updates.sku_prefix) {
          nv.sku = `${updates.sku_prefix}-${String(i + 1).padStart(3, "0")}`;
        }
        return nv;
      })
    );
  };

  const handleAddAttribute = (variantIndex = null, attribute = { attribute_name: "", attribute_value: "" }) => {
    if (variantIndex === null) {
      setFormData({
        ...formData,
        attributes: [
          ...formData.attributes,
          attribute,
        ],
      });
    } else {
      const newVariants = [...variants];
      newVariants[variantIndex].attributes.push(attribute);
      setVariants(newVariants);
    }
  };

  const handleBatchAddAttributes = (variantIndex, batchString) => {
    // Expected format: "Tên: Giá trị 1, Giá trị 2, ..."
    // Or just "Giá trị 1, Giá trị 2, ..." (will need a name later or it splits values for a given name if provided)
    // Let's assume the format is "Tên: Giá trị 1, Giá trị 2, Giá trị 3"
    
    if (!batchString.includes(':')) {
       toast.error("Vui lòng nhập theo định dạng 'Tên: Giá trị1, Giá trị2...'");
       return;
    }

    const [name, valuesPart] = batchString.split(':');
    const attrName = name.trim();
    const values = valuesPart.split(',').map(v => v.trim()).filter(v => v !== "");

    if (!attrName || values.length === 0) {
      toast.error("Định dạng không hợp lệ");
      return;
    }

    if (variantIndex === null) {
      const newAttributes = values.map(v => ({ attribute_name: attrName, attribute_value: v }));
      setFormData({
        ...formData,
        attributes: [...formData.attributes, ...newAttributes]
      });
    } else {
      const newVariants = [...variants];
      const newAttributes = values.map(v => ({ attribute_name: attrName, attribute_value: v }));
      newVariants[variantIndex].attributes.push(...newAttributes);
      setVariants(newVariants);
    }
    toast.success(`Đã thêm ${values.length} thuộc tính`);
  };

  const removeAttribute = (attrIndex, variantIndex = null) => {
    if (variantIndex === null) {
      const newAttrs = formData.attributes.filter((_, i) => i !== attrIndex);
      setFormData({ ...formData, attributes: newAttrs });
    } else {
      const newVariants = [...variants];
      newVariants[variantIndex].attributes = newVariants[
        variantIndex
      ].attributes.filter((_, i) => i !== attrIndex);
      setVariants(newVariants);
    }
  };

  const updateAttribute = (attrIndex, field, value, variantIndex = null) => {
    if (variantIndex === null) {
      const newAttrs = [...formData.attributes];
      newAttrs[attrIndex][field] = value;
      setFormData({ ...formData, attributes: newAttrs });
    } else {
      const newVariants = [...variants];
      newVariants[variantIndex].attributes[attrIndex][field] = value;
      setVariants(newVariants);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Vui lòng nhập tên sản phẩm");
    if (variants.some((v) => !v.sku))
      return toast.error("Tất cả biến thể phải có mã SKU");

    setIsSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== "attributes") {
        data.append(key, formData[key]);
      }
    });

    formData.attributes.forEach((attr, idx) => {
      if (attr.id) data.append(`attributes[${idx}][id]`, attr.id);
      data.append(`attributes[${idx}][attribute_name]`, attr.attribute_name);
      data.append(`attributes[${idx}][attribute_value]`, attr.attribute_value);
    });

    if (featureImage?.file) {
      data.append("feature_image", featureImage.file);
    }

    galleryImages.forEach((img, idx) => {
      if (img.isExisting) {
        data.append(`images[${idx}][id]`, img.id);
        // Không gửi image_path nếu là ảnh cũ để tránh ghi đè URL tuyệt đối vào DB
      } else if (img.file) {
        data.append(`images[${idx}][file]`, img.file);
      }
      data.append(`images[${idx}][is_main]`, idx === 0 ? 1 : 0);
      data.append(`images[${idx}][sort_order]`, idx);
    });

    variants.forEach((v, idx) => {
      if (v.id) data.append(`variants[${idx}][id]`, v.id);
      data.append(`variants[${idx}][name]`, v.name || "");
      data.append(`variants[${idx}][sku]`, v.sku);
      data.append(`variants[${idx}][price]`, v.price);
      data.append(`variants[${idx}][compare_price]`, v.compare_price || "");
      data.append(`variants[${idx}][cost_price]`, v.cost_price || "");
      data.append(`variants[${idx}][status]`, v.status);
      data.append(
        `variants[${idx}][inventory][quantity]`,
        v.inventory.quantity,
      );
      data.append(
        `variants[${idx}][inventory][min_quantity]`,
        v.inventory.min_quantity,
      );

      if (v.image?.file) {
        data.append(`variants[${idx}][image]`, v.image.file);
      }

      const vAttrs = v.attributes || [];
      vAttrs.forEach((va, vaIdx) => {
        if (va.id)
          data.append(`variants[${idx}][attributes][${vaIdx}][id]`, va.id);
        data.append(
          `variants[${idx}][attributes][${vaIdx}][attribute_name]`,
          va.attribute_name,
        );
        data.append(
          `variants[${idx}][attributes][${vaIdx}][attribute_value]`,
          va.attribute_value,
        );
      });
    });

    try {
      if (isEdit) {
        await updateProductRequest(slug, data);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await createProductRequest(data);
        toast.success("Thêm sản phẩm thành công");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-black uppercase text-[10px] ">
            Đang tải cấu trúc kho...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link
              to="/admin/products"
              className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:shadow-xl transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="product-form"
              disabled={isSubmitting}
              className={`inline-flex items-center px-8 py-4 bg-black text-white text-sm font-bold rounded-2xl shadow-2xl transition-all active:scale-95 ${isSubmitting ? "opacity-50" : "hover:bg-black/80"}`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isEdit ? "Lưu thay đổi" : "Kích hoạt sản phẩm"}
            </button>
          </div>
        </div>

        {isEdit && (
          <ProductFormTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <form
          id="product-form"
          onSubmit={handleSubmit}
          className={
            isEdit ? "space-y-8" : "grid grid-cols-1 lg:grid-cols-3 gap-8"
          }
        >
          {isEdit ? (
            <div className="space-y-8">
              {activeTab === "general" && (
                <>
                  <GeneralInfoSection
                    formData={formData}
                    setFormData={setFormData}
                    isEdit={isEdit}
                    hasVariants={hasVariants}
                    variants={variants}
                    updateVariant={updateVariant}
                    categories={categories}
                    suppliers={suppliers}
                  />
                  {/* <CommonAttributesSection
                    formData={formData}
                    updateAttribute={updateAttribute}
                    removeAttribute={removeAttribute}
                    handleAddAttribute={handleAddAttribute}
                    handleBatchAddAttributes={handleBatchAddAttributes}
                  /> */}
                  <StatusSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </>
              )}
              {activeTab === "attributes" && (
                <>
                  <ProductVariantToggle
                    hasVariants={hasVariants}
                    setHasVariants={setHasVariants}
                    variants={variants}
                    handleAddVariant={handleAddVariant}
                  />
                  <VariantsSection
                    hasVariants={hasVariants}
                    variants={variants}
                    updateVariant={updateVariant}
                    removeVariant={removeVariant}
                    productOptions={productOptions}
                    handleOptionsChange={handleOptionsChange}
                    handleBulkApply={handleBulkApply}
                  />
                </>
              )}
              {activeTab === "media" && (
                <MediaSection
                  featureImage={featureImage}
                  setFeatureImage={setFeatureImage}
                  galleryImages={galleryImages}
                  setGalleryImages={setGalleryImages}
                  showLabel={false}
                />
              )}
            </div>
          ) : (
            <>
              <div className="lg:col-span-2 space-y-8">
                <GeneralInfoSection
                  formData={formData}
                  setFormData={setFormData}
                  isEdit={isEdit}
                  hasVariants={hasVariants}
                  variants={variants}
                  updateVariant={updateVariant}
                  categories={categories}
                  suppliers={suppliers}
                />
                {/* <CommonAttributesSection
                  formData={formData}
                  updateAttribute={updateAttribute}
                  removeAttribute={removeAttribute}
                  handleAddAttribute={handleAddAttribute}
                  handleBatchAddAttributes={handleBatchAddAttributes}
                /> */}
                <ProductVariantToggle
                  hasVariants={hasVariants}
                  setHasVariants={setHasVariants}
                  variants={variants}
                  handleAddVariant={handleAddVariant}
                />
                <VariantsSection
                  hasVariants={hasVariants}
                  variants={variants}
                  updateVariant={updateVariant}
                  removeVariant={removeVariant}
                  productOptions={productOptions}
                  handleOptionsChange={handleOptionsChange}
                  handleBulkApply={handleBulkApply}
                />
              </div>
              <div className="space-y-8">
                <StatusSection formData={formData} setFormData={setFormData} />
                <MediaSection
                  featureImage={featureImage}
                  setFeatureImage={setFeatureImage}
                  galleryImages={galleryImages}
                  setGalleryImages={setGalleryImages}
                />
              </div>
            </>
          )}
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
