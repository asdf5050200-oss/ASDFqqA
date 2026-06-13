import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Layers, 
  Award, 
  Warehouse, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  ChevronRight, 
  CreditCard, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown,
  Download,
  Upload
} from 'lucide-react';
import { ProductItem, IndustryType } from '../../types';

interface ProductCenterProps {
  products: ProductItem[];
  selectedIndustry: IndustryType;
  addLog: (agent: string, action: string, details: string, type: 'info' | 'success' | 'warning' | 'error' | 'tool') => void;
  onUpdateProducts: (updated: ProductItem[]) => void;
}

interface ProcurementOrder {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  paymentStatus: '待支付' | '已支付' | '已取消';
  shippingStatus: '待付款' | '待发货' | '已发货' | '已收货' | '已完成';
  supplier: string;
  estimatedDelivery: string;
  createdAt: string;
}

export default function ProductCenter({ products, selectedIndustry, addLog, onUpdateProducts }: ProductCenterProps) {
  // Current functional tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories_brands' | 'procurement' | 'gift_cards'>('products');

  // Gift Card structure
  interface GiftCardItem {
    id: string;
    code: string;
    initialValue: number;
    remainingBalance: number;
    expiryDate: string;
    status: 'active' | 'expired' | 'disabled';
    createdAt: string;
  }

  // Gift Cards local state
  const [giftCards, setGiftCards] = useState<GiftCardItem[]>([
    { id: 'GC-10001', code: 'AURA-GFT-98401', initialValue: 100, remainingBalance: 100, expiryDate: '2026-12-31', status: 'active', createdAt: '2026-06-05 10:00' },
    { id: 'GC-10002', code: 'AURA-GFT-12840', initialValue: 50, remainingBalance: 12.50, expiryDate: '2026-12-31', status: 'active', createdAt: '2026-06-06 14:10' },
    { id: 'GC-10003', code: 'AURA-GFT-84920', initialValue: 200, remainingBalance: 0, expiryDate: '2026-05-15', status: 'expired', createdAt: '2026-04-10 11:24' }
  ]);

  const [showCreateGiftCardModal, setShowCreateGiftCardModal] = useState(false);
  const [newGCValue, setNewGCValue] = useState<number>(100);
  const [newGCCode, setNewGCCode] = useState<string>('');
  const [newGCExpiry, setNewGCExpiry] = useState<string>('2026-12-31');

  // CSV Product files handlers
  const handleProductCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          throw new Error('CSV 除表头外无其他合规数据');
        }

        const newProds: ProductItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const blocks = lines[i].split(',').map(b => b.trim());
          if (blocks.length < 5) continue;

          // Schema: Name, SKU, Category, Brand, Price, Stock, Threshold
          const name = blocks[0];
          const sku = blocks[1];
          const category = blocks[2] || '常规';
          const brand = blocks[3] || '通用';
          const price = Number(blocks[4]) || 50;
          const stock = Number(blocks[5]) || 0;
          const threshold = Number(blocks[6]) || 5;

          if (!name || !sku) continue;

          newProds.push({
            id: `p-${Date.now()}-${i}`,
            name,
            sku,
            category,
            brand,
            price,
            stock,
            sales: 0,
            status: stock > threshold ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock',
            minStockThreshold: threshold
          });
        }

        if (newProds.length === 0) {
          throw new Error('没有成功提取任何合规产品数据');
        }

        onUpdateProducts([...newProds, ...products]);
        addLog('Product Center', 'CSV 批量导入商品', `解析完美通过！成功合并在主 SKU 数据库中，共导入 ${newProds.length} 款产品。`, 'success');

      } catch (err: any) {
        addLog('Product Center', 'CSV 导入失败', `发生错误: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleProductCSVExport = () => {
    const headers = ['品名规格', 'SKU编码', '类别', '品牌', '零售单价', '拥有库存', '监控底线'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.sku,
      p.category || '常规',
      p.brand || '通用',
      p.price,
      p.stock,
      p.minStockThreshold || 5
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_${selectedIndustry}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog('Product Center', '商品数据表导出', `成功导出当前筛选类别下的 ${filteredProducts.length} 条真实产品货架至 CSV 报表。`, 'success');
  };

  const handleDownloadProductTemplate = () => {
    const headers = '品名规格,SKU编码,分类,品牌,零售单价,目前库存,预警安全阈值\n';
    const sample = '极光智能双轴数控雕刻机,SKU-CNC-L8V3,智能周边,OS Design,1290,12,5\n高透气轻量羊绒梭织外套,SKU-OUTER-ECO21,外套,EcoWeave,199,50,8';
    
    const content = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(headers + sample);
    const link = document.createElement("a");
    link.setAttribute("href", content);
    link.setAttribute("download", `product_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Product Center', '下载商品导入模板', '成功获取批量导入格式模板。', 'info');
  };

  const handleCreateGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newGCCode.trim().toUpperCase() || `GFT-AURA-${Math.floor(100000 + Math.random() * 900000)}`;
    
    if (giftCards.some(g => g.code === cleanCode)) {
      addLog('Gift Card Center', '创建失败', '已存在完全相同的礼品卡代码。', 'error');
      return;
    }

    const newGC: GiftCardItem = {
      id: `GC-${Date.now().toString().slice(-5)}`,
      code: cleanCode,
      initialValue: newGCValue,
      remainingBalance: newGCValue,
      expiryDate: newGCExpiry,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setGiftCards([newGC, ...giftCards]);
    addLog('Gift Card Center', '发行数字礼品卡', `成功签发零售卡 [${cleanCode}]，金积限额: €${newGCValue}，有效期至 ${newGCExpiry}`, 'success');
    
    setNewGCCode('');
    setNewGCValue(100);
    setShowCreateGiftCardModal(false);
  };

  const handleToggleGiftCardStatus = (id: string) => {
    setGiftCards(prev => prev.map(g => {
      if (g.id === id) {
        const next: 'active' | 'disabled' = g.status === 'active' ? 'disabled' : 'active';
        addLog('Gift Card Center', '状态修正', `将礼品卡 [${g.code}] 设为: ${next === 'active' ? '处于启用期' : '冻结停用中'}`, 'warning');
        return { ...g, status: next };
      }
      return g;
    }));
  };

  // Search & Filters for Products
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterStockStatus, setFilterStockStatus] = useState('All');

  // Interactive local states for categories and brands (seeded dynamically by industry)
  const [categories, setCategories] = useState<string[]>(() => {
    switch(selectedIndustry) {
      case 'retail': return ['外套', '上衣', '裤装', '配饰', '智能周边'];
      case 'food': return ['主食', '小食', '饮品', '甜点'];
      case 'education': return ['训练营', '录播课', '指导计划'];
      case 'healthcare': return ['体检套餐', '咨询服务', '慢病管理'];
      case 'service': return ['按摩理疗', '美发沙龙', '私教辅导'];
      default: return ['基础五金', '定制外壳', '复合管材'];
    }
  });

  const [brands, setBrands] = useState<string[]>(() => {
    switch(selectedIndustry) {
      case 'retail': return ['OS Design', 'EcoWeave', 'FlexFit'];
      case 'food': return ['Wagyu Hub', 'Truffle Lab', 'Mint Brew'];
      case 'education': return ['OS Academy', 'Blueprint Co', 'AI Mentor'];
      case 'healthcare': return ['Executive Care', 'NutriConsult', 'SleepBio'];
      case 'service': return ['AromaSpa', 'KeratinPro', 'PilatesFit'];
      default: return ['Precision Cast', 'GalvaScrew', 'CarbonTube'];
    }
  });

  // Procurement orders local storage simulation
  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>(() => {
    // Initial sample procurement logs for realism
    const initialProduct = products[0];
    if (!initialProduct) return [];
    return [
      {
        id: 'PO-10001',
        productId: initialProduct.id,
        productName: initialProduct.name,
        sku: initialProduct.sku,
        qty: 100,
        unitCost: Number((initialProduct.price * 0.45).toFixed(2)),
        totalCost: Number((initialProduct.price * 0.45 * 100).toFixed(2)),
        paymentStatus: '已支付',
        shippingStatus: '已完成',
        supplier: '上游智造供应链 (深港口岸)',
        estimatedDelivery: '2026-06-12 18:00',
        createdAt: '2026-06-05 10:24'
      },
      {
        id: 'PO-10002',
        productId: initialProduct.id,
        productName: initialProduct.name,
        sku: initialProduct.sku,
        qty: 50,
        unitCost: Number((initialProduct.price * 0.45).toFixed(2)),
        totalCost: Number((initialProduct.price * 0.45 * 50).toFixed(2)),
        paymentStatus: '待支付',
        shippingStatus: '待付款',
        supplier: '东亚数码硬件制造总厂',
        estimatedDelivery: '2026-06-16 12:00',
        createdAt: '2026-06-07 14:12'
      }
    ];
  });

  // Selected products tracker for multi-select actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals controller states
  const [showProductModal, setShowProductModal] = useState<'create' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem>>({});

  // Track active productId in context
  React.useEffect(() => {
    const activeId = editingProduct?.id || selectedProductIds[0] || (products[0]?.id || undefined);
    if (typeof window !== 'undefined' && window.AIContextTracker) {
      window.AIContextTracker.setProductId(activeId);
    }
  }, [editingProduct?.id, selectedProductIds, products]);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [isBulkProcurement, setIsBulkProcurement] = useState(false);
  const [newPO, setNewPO] = useState({
    productId: '',
    qty: 100,
    unitCost: 10,
    supplier: '全球制造硬件与精品直供中心',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // 1. Calculations & Metrics
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStockThreshold).length;
  const totalCategoriesCount = categories.length;
  const pendingPOCount = procurementOrders.filter(o => o.shippingStatus !== '已完成').length;

  // Enrich product list with brand and category data dynamically if not present
  const enrichedProducts = useMemo(() => {
    return products.map((p, idx) => {
      const category = p.category || categories[idx % categories.length] || '常规';
      const brand = p.brand || brands[idx % brands.length] || '通用';
      return { ...p, category, brand };
    });
  }, [products, categories, brands]);

  // Filters application
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = filterCategory === 'All' || p.category === filterCategory;
      const matchesBrand = filterBrand === 'All' || p.brand === filterBrand;
      
      let matchesStock = true;
      if (filterStockStatus === 'In Stock') matchesStock = p.stock > p.minStockThreshold;
      else if (filterStockStatus === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= p.minStockThreshold;
      else if (filterStockStatus === 'Out of Stock') matchesStock = p.stock === 0;

      return matchesSearch && matchesCat && matchesBrand && matchesStock;
    });
  }, [enrichedProducts, searchQuery, filterCategory, filterBrand, filterStockStatus]);

  // Bulk selectors
  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 2. Individual CRUD triggers
  const handleAddNewProductClick = () => {
    setEditingProduct({
      id: `prod_${Date.now()}`,
      name: '',
      sku: `SKU-${selectedIndustry[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      price: 19.99,
      stock: 50,
      minStockThreshold: 10,
      sales: 0,
      status: 'In Stock',
      category: categories[0] || '默认分类',
      brand: brands[0] || '默认品牌'
    });
    setShowProductModal('create');
  };

  const handleEditProductClick = (product: ProductItem & { category: string; brand: string }) => {
    setEditingProduct(product);
    setShowProductModal('edit');
  };

  const handleDeleteProduct = (productId: string) => {
    const fresh = products.filter(p => p.id !== productId);
    onUpdateProducts(fresh);
    addLog('Product Center', '删除商品', `从商品大表中删除了商品ID为 ${productId} 的数据实体`, 'warning');
    setSelectedProductIds(prev => prev.filter(idx => idx !== productId));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const ed = editingProduct;
    if (!ed.name || !ed.sku) return;

    if (showProductModal === 'create') {
      // Validate SKU uniqueness
      if (products.some(p => p.sku === ed.sku)) {
        addLog('Product Center', '创建商品失败', `SKU : ${ed.sku} 已存在。商品注册必须保证唯一SKU。`, 'error');
        alert('SKU 重复，请更改 SKU 代码');
        return;
      }
      
      const newProductItem: ProductItem = {
        id: ed.id || `prod_${Date.now()}`,
        name: ed.name,
        sku: ed.sku,
        stock: Number(ed.stock || 0),
        minStockThreshold: Number(ed.minStockThreshold || 10),
        price: Number(ed.price || 0),
        sales: 0,
        status: (ed.stock as number) > (ed.minStockThreshold as number) 
          ? 'In Stock' 
          : (ed.stock as number) > 0 ? 'Low Stock' : 'Out of Stock',
        category: ed.category,
        brand: ed.brand
      } as any;

      onUpdateProducts([newProductItem, ...products]);
      addLog('Product Center', '新建商品', `商家后台成功创建并同步了全新商品 SKU: ${newProductItem.sku} (${newProductItem.name})`, 'success');
    } else {
      // Edit
      const fresh = products.map(p => {
        if (p.id === ed.id) {
          const updatedStock = Number(ed.stock || 0);
          const thresh = Number(ed.minStockThreshold || 10);
          const calculatedStatus = updatedStock > thresh ? 'In Stock' : (updatedStock > 0 ? 'Low Stock' : 'Out of Stock');
          return {
            ...p,
            name: ed.name!,
            sku: ed.sku!,
            price: Number(ed.price || 0),
            stock: updatedStock,
            minStockThreshold: thresh,
            status: calculatedStatus as any,
            category: ed.category,
            brand: ed.brand
          };
        }
        return p;
      });
      onUpdateProducts(fresh);
      addLog('Product Center', '编辑商品', `商家后台更新了 SKU 為 ${ed.sku} 的商品信息。`, 'info');
    }

    setShowProductModal(null);
    setEditingProduct({});
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`确认批量删除选中的 ${selectedProductIds.length} 个商品？`)) {
      const fresh = products.filter(p => !selectedProductIds.includes(p.id));
      onUpdateProducts(fresh);
      addLog('Product Center', '批量删除商品', `批量清理了 ${selectedProductIds.length} 项商品数据`, 'warning');
      setSelectedProductIds([]);
    }
  };

  // 3. Category & Brand CRUD
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert('分类已存在');
      return;
    }
    setCategories(prev => [...prev, newCategoryName.trim()]);
    addLog('Product Center', '添加分类', `创建了新的商品分类「${newCategoryName}」`, 'success');
    setNewCategoryName('');
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
    addLog('Product Center', '删除分类', `移除了分类「${cat}」`, 'warning');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    if (brands.includes(newBrandName.trim())) {
      alert('品牌已存在');
      return;
    }
    setBrands(prev => [...prev, newBrandName.trim()]);
    addLog('Product Center', '添加品牌', `创建了新的商品品牌「${newBrandName}」`, 'success');
    setNewBrandName('');
  };

  const handleDeleteBrand = (br: string) => {
    setBrands(prev => prev.filter(b => b !== br));
    addLog('Product Center', '删除品牌', `移除了品牌「${br}」`, 'warning');
  };

  // 4. Procurement Triggers
  const handleOpenProcurementDialog = () => {
    if (products.length === 0) {
      alert('暂无任何商品可以发起采购');
      return;
    }
    const targetId = products[0].id;
    const targetPrice = products[0].price;
    setIsBulkProcurement(false);
    setNewPO({
      productId: targetId,
      qty: 100,
      unitCost: Number((targetPrice * 0.45).toFixed(2)),
      supplier: '全球制造硬件与精品直供中心',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    });
    setShowProcurementModal(true);
  };

  const handlePOProductChange = (prodId: string) => {
    const item = products.find(p => p.id === prodId);
    if (!item) return;
    setNewPO(prev => ({
      ...prev,
      productId: prodId,
      unitCost: Number((item.price * 0.45).toFixed(2))
    }));
  };

  const handleCreateProcurementOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBulkProcurement) {
      const addedOrders: ProcurementOrder[] = [];
      const selectedProds = products.filter(p => selectedProductIds.includes(p.id));

      selectedProds.forEach((targetProd) => {
        const uCost = Number((targetProd.price * 0.45).toFixed(2));
        const newPOItem: ProcurementOrder = {
          id: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
          productId: targetProd.id,
          productName: targetProd.name,
          sku: targetProd.sku,
          qty: Number(newPO.qty),
          unitCost: uCost,
          totalCost: Number((Number(newPO.qty) * uCost).toFixed(2)),
          paymentStatus: '待支付',
          shippingStatus: '待付款',
          supplier: newPO.supplier,
          estimatedDelivery: newPO.estimatedDelivery,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        addedOrders.push(newPOItem);
      });

      setProcurementOrders(prev => [...addedOrders, ...prev]);
      addLog('Product Center', '批量开立采购单', `成功为选中的 ${selectedProductIds.length} 款商品批量生成专属物理采购契约，状态：挂单待支付。`, 'success');
      setSelectedProductIds([]);
    } else {
      const targetProd = products.find(p => p.id === newPO.productId);
      if (!targetProd) return;

      const newPOItem: ProcurementOrder = {
        id: `PO-${Date.now().toString().slice(-5)}`,
        productId: targetProd.id,
        productName: targetProd.name,
        sku: targetProd.sku,
        qty: Number(newPO.qty),
        unitCost: Number(newPO.unitCost),
        totalCost: Number((Number(newPO.qty) * Number(newPO.unitCost)).toFixed(2)),
        paymentStatus: '待支付',
        shippingStatus: '待付款',
        supplier: newPO.supplier,
        estimatedDelivery: newPO.estimatedDelivery,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setProcurementOrders(prev => [newPOItem, ...prev]);
      addLog('Product Center', '采购单发起成功', `成功录入了外部采购单 ${newPOItem.id}。当前状态：挂单待支付。`, 'info');
    }

    setShowProcurementModal(false);
    setIsBulkProcurement(false);
  };

  const handlePayProcurementOrder = (poId: string) => {
    setProcurementOrders(prev => prev.map(po => {
      if (po.id === poId) {
        addLog('Product Center', '采购单资金结算', `触发了采购订单 ${poId} 的批量资金付款结算程序。当前状态：订单已结，等待工厂配货发货。`, 'success');
        return {
          ...po,
          paymentStatus: '已支付',
          shippingStatus: '待发货'
        };
      }
      return po;
    }));
  };

  const handleShipProcurementOrder = (poId: string) => {
    setProcurementOrders(prev => prev.map(po => {
      if (po.id === poId) {
        addLog('Product Center', '供应商发货', `厂家或合作代表已完成订单 ${poId} 货物的物流分拨及发货交付。`, 'info');
        return {
          ...po,
          shippingStatus: '已发货'
        };
      }
      return po;
    }));
  };

  const handleReceiveProcurementOrder = (poId: string) => {
    setProcurementOrders(prev => prev.map(po => {
      if (po.id === poId) {
        addLog('Product Center', '采购签收货品', `仓库已成功签收并收到采购单 ${poId} 包裹货物。当前状态：待核验入库。`, 'success');
        return {
          ...po,
          shippingStatus: '已收货'
        };
      }
      return po;
    }));
  };

  const handleWarehouseProcurementOrder = (poId: string) => {
    setProcurementOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const targetProd = products.find(p => p.id === po.productId);
        if (targetProd) {
          const freshProducts = products.map(p => {
            if (p.id === targetProd.id) {
              const freshQty = p.stock + po.qty;
              return {
                ...p,
                stock: freshQty,
                status: freshQty > p.minStockThreshold ? 'In Stock' : 'Low Stock'
              } as any;
            }
            return p;
          });
          onUpdateProducts(freshProducts);
        }

        addLog('Product Center', '确认入库', `采购订单 ${poId} 货品已完成库房最终清点、扫描上架并正式录入物理库存，库存数量增加 ${po.qty}。`, 'success');
        return {
          ...po,
          shippingStatus: '已完成'
        };
      }
      return po;
    }));
  };

  const handleCancelProcurementOrder = (poId: string) => {
    setProcurementOrders(prev => prev.map(po => {
      if (po.id === poId) {
        addLog('Product Center', '取消采购', `已主动撤回这笔采购订单采购款项申请，编号 ${poId}。`, 'warning');
        return {
          ...po,
          paymentStatus: '已取消'
        };
      }
      return po;
    }));
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans select-none animate-fadeIn text-left p-1">
      
      {/* 顶部标题栏与子页签导航 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            商品中心
          </h2>
        </div>
        
        {/* 三个一级子功能页签 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
              activeSubTab === 'products' 
                ? 'bg-white text-[#07C2E3] shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>商品大表</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('categories_brands')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
              activeSubTab === 'categories_brands' 
                ? 'bg-white text-[#07C2E3] shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>分类与品牌</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('procurement')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
              activeSubTab === 'procurement' 
                ? 'bg-white text-[#07C2E3] shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>库存与采购</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gift_cards')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
              activeSubTab === 'gift_cards' 
                ? 'bg-white text-[#07C2E3] shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>礼品卡管理</span>
          </button>
        </div>
      </div>

      {/* 核心 KPI 栏：商品全局统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">已注册 SKU</span>
            <div className="w-8 h-8 rounded-lg bg-[#e6fafc] flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-[#07C2E3]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black font-mono text-slate-900">{totalProductsCount} 款</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400 font-medium">当前活跃上架的产品品类数量</div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#ea580c] font-bold">库存预警商品</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-orange-50' : 'bg-slate-50'}`}>
              <AlertTriangle className={`w-4.5 h-4.5 ${lowStockCount > 0 ? 'text-[#ea580c] animate-pulse' : 'text-slate-400'}`} />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-xl md:text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-[#ea580c]' : 'text-slate-900'}`}>{lowStockCount} 款</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400 font-medium">低于设定的安全健康库存水位</div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">活跃品类</span>
            <div className="w-8 h-8 rounded-lg bg-[#e6fafc] flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-[#07C2E3]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black font-mono text-slate-900">{totalCategoriesCount} 种</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400 font-medium">包含自定义类目与原生系统类目</div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">待结采购项目</span>
            <div className="w-8 h-8 rounded-lg bg-[#e6fafc] flex items-center justify-center">
              <Warehouse className="w-4.5 h-4.5 text-[#07C2E3]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black font-mono text-slate-900">{pendingPOCount} 笔</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400 font-medium">需要进行付讫结汇和确认收货</div>
        </div>
      </div>

      {/* SUB-TAB 1: 商品管理大表 */}
      {activeSubTab === 'products' && (
        <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          {/* 工具栏 */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50/40">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">库存商品一览</h3>
            </div>
            
            {/* 过滤器及高级操作 */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 搜索 */}
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索名称、SKU..." 
                  className="bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              {/* 品类选择 */}
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-bold"
              >
                <option value="All">所有分类</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              {/* 品牌选择 */}
              <select 
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-bold"
              >
                <option value="All">所有品牌</option>
                {brands.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>

              {/* 库存状态选择 */}
              <select 
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-bold"
              >
                <option value="All">所有库存状态</option>
                <option value="In Stock">库存充足</option>
                <option value="Low Stock">库存预警</option>
                <option value="Out of Stock">缺货</option>
              </select>

              {/* 批量操作 */}
              {selectedProductIds.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
                  <button
                    onClick={() => {
                      if (selectedProductIds.length === 0) return;
                      setIsBulkProcurement(true);
                      setNewPO({
                        productId: selectedProductIds[0],
                        qty: 100,
                        unitCost: 0,
                        supplier: '全球制造硬件与精品直供中心',
                        estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10)
                      });
                      setShowProcurementModal(true);
                    }}
                    className="bg-[#e6fafc] hover:bg-[#bef1fa] text-[#07C2E3] border border-cyan-100 font-bold text-[10px] py-1 px-2.5 rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>批量补货</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-[10px] py-1 px-2 rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>删除选中 ({selectedProductIds.length})</span>
                  </button>
                </div>
              )}

              {/* 批量操作模板下载及导入导出 */}
              <div className="flex items-center gap-1 ml-1 h-7 rounded-lg overflow-hidden border border-slate-200">
                <button
                  onClick={handleDownloadProductTemplate}
                  title="下载导入 CSV 规范模板"
                  className="bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 h-full px-2 text-[10.5px] font-bold border-r border-slate-200 cursor-pointer flex items-center gap-1 opacity-75"
                >
                  <Download className="w-3 h-3 text-slate-400" />
                  <span>模板</span>
                </button>
                <button
                  onClick={handleProductCSVExport}
                  title="导出全站产品为 CSV 表"
                  className="bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 h-full px-2 text-[10.5px] font-bold border-r border-slate-200 cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-[#07C2E3]" />
                  <span>导出</span>
                </button>
                <label className="bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 h-full px-2 text-[10.5px] font-bold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-500" />
                  <span>导入</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleProductCSVImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 核心操作：新建商品 */}
              <button
                onClick={handleAddNewProductClick}
                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ml-1 animate-pulse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建上架 SKU</span>
              </button>

            </div>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className="rounded text-[#07C2E3] focus:ring-[#07C2E3] cursor-pointer"
                    />
                  </th>
                  <th className="p-3">商品品名/規格</th>
                  <th className="p-3">SKU 编码</th>
                  <th className="p-3">分类类目</th>
                  <th className="p-3">品牌</th>
                  <th className="p-3">库存数 / 预警</th>
                  <th className="p-3">销货数量</th>
                  <th className="p-3">零售单价</th>
                  <th className="p-3">存量状态</th>
                  <th className="p-3 text-center">快捷管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    const isLow = p.stock <= p.minStockThreshold;
                    const isOut = p.stock === 0;

                    let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    let statusLabel = '库存充足';
                    if (isOut) {
                      statusBadge = 'bg-rose-50 text-rose-700 border-rose-100';
                      statusLabel = '缺货';
                    } else if (isLow) {
                      statusBadge = 'bg-orange-50 text-orange-700 border-orange-100 animate-pulse';
                      statusLabel = '库存预警';
                    }

                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors duration-150 ${
                          isSelected ? 'bg-[#e6fafc]/20 hover:bg-[#e6fafc]/30' : 'hover:bg-slate-50/20'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(p.id)}
                            className="rounded text-[#07C2E3] focus:ring-[#07C2E3] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900 max-w-sm truncate">{p.name}</td>
                        <td className="p-3 font-mono text-slate-500 font-bold">{p.sku}</td>
                        <td className="p-3 text-slate-600">{p.category}</td>
                        <td className="p-3 text-slate-600">{p.brand}</td>
                        <td className="p-3">
                          <span className={`font-mono font-bold ${isLow ? 'text-orange-600' : 'text-slate-900'}`}>
                            {p.stock}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px] ml-1">/{p.minStockThreshold}件</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 font-semibold">{p.sales} 件</td>
                        <td className="p-3 font-mono font-bold text-slate-900">${p.price.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleEditProductClick(p as any)}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-1 px-1.5 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>修改</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 py-1 px-1.5 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>删除</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-semibold">
                      未检索到匹配当前过滤器的 SKU 商品记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: 分类与品牌资产系统 */}
      {activeSubTab === 'categories_brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 左侧：分类管理板块 */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#07C2E3]" />
                <span>分类管理类目树</span>
              </h3>
            </div>

            {/* 新增分类表单 */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="键入新分类品类名 (例如: 春夏风衣)..."
                className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 flex-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-medium"
              />
              <button 
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加</span>
              </button>
            </form>

            {/* 分类列表 */}
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {categories.map((cat, idx) => {
                const count = enrichedProducts.filter(p => p.category === cat).length;
                return (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">#{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="font-bold text-slate-700">{cat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-sky-50 text-[#07C2E3] font-black px-1.5 py-0.5 rounded-full">{count} 个商品</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="删除分类"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：品牌管理板块 */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#07C2E3]" />
                <span>品牌管理</span>
              </h3>
            </div>

            {/* 新增品牌表单 */}
            <form onSubmit={handleAddBrand} className="flex gap-2">
              <input 
                type="text" 
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="键入自有或合作关联品牌名称..."
                className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 flex-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-medium"
              />
              <button 
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加</span>
              </button>
            </form>

            {/* 品牌列表 */}
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {brands.map((br, idx) => {
                const count = enrichedProducts.filter(p => p.brand === br).length;
                return (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">#{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="font-bold text-slate-700">{br}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-[#e6fafc] text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">{count} 包含款式</span>
                      <button 
                        onClick={() => handleDeleteBrand(br)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="删除品牌"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: 物理库存维护与工厂采购项目 */}
      {activeSubTab === 'procurement' && (
        <div className="space-y-6">
          
          {/* 安全库存警戒商品警报条 */}
          {lowStockCount > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
              <div className="flex gap-2 text-xs">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-orange-800 mb-0.5">供应链危机告急警告：</h4>
                  <p className="text-orange-700">系统发现共有 <span className="font-black underline">{lowStockCount} 款商品</span> 存量已突破最低安全健康储备线。请尽快通过向系统挂靠账目发起重整采购。</p>
                </div>
              </div>
              <button 
                onClick={handleOpenProcurementDialog}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即安排向工厂采购</span>
              </button>
            </div>
          )}

          {/* 采购流水表单 */}
          <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm flex flex-col">
            
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">工厂采购流水日志</h3>
              </div>
              
              <button
                onClick={handleOpenProcurementDialog}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新开工厂采办单</span>
              </button>
            </div>

            {/* 采购记录表 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                    <th className="p-3 w-24">单据编号</th>
                    <th className="p-3">供应商</th>
                    <th className="p-3">拟定补货商品</th>
                    <th className="p-3">SKU 代码</th>
                    <th className="p-3">采购数量</th>
                    <th className="p-3">采购进货价</th>
                    <th className="p-3">拟支付总计</th>
                    <th className="p-3">支付状态</th>
                    <th className="p-3">发货状态</th>
                    <th className="p-3">预计到货时间</th>
                    <th className="p-3">录单时间</th>
                    <th className="p-3 text-center">采购业务流控制</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {procurementOrders.length > 0 ? (
                    procurementOrders.map((po) => {
                      let payBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                      if (po.paymentStatus === '已支付') payBadge = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                      else if (po.paymentStatus === '已取消') payBadge = 'bg-slate-50 text-slate-400 border-slate-150';

                      let shipBadge = 'bg-slate-50 text-slate-400 border-slate-150';
                      if (po.shippingStatus === '待发货') {
                        shipBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                      } else if (po.shippingStatus === '已发货') {
                        shipBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                      } else if (po.shippingStatus === '已收货') {
                        shipBadge = 'bg-cyan-50 text-[#07C2E3] border-cyan-100';
                      } else if (po.shippingStatus === '已完成') {
                        shipBadge = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                      }

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 font-mono text-slate-500 font-bold">{po.id}</td>
                          <td className="p-3 text-slate-600 truncate max-w-[120px]" title={po.supplier}>{po.supplier || '未指定供应商'}</td>
                          <td className="p-3 font-bold text-slate-900 max-w-[150px] truncate">{po.productName}</td>
                          <td className="p-3 font-mono font-bold text-slate-500">{po.sku}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{po.qty} 件</td>
                          <td className="p-3 font-mono text-slate-500">${po.unitCost.toFixed(2)}</td>
                          <td className="p-3 font-mono text-slate-900 font-bold">${po.totalCost.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${payBadge}`}>
                              {po.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${shipBadge}`}>
                              {po.shippingStatus}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-[10px]">{po.estimatedDelivery || '-'}</td>
                          <td className="p-3 font-mono text-slate-400 text-[10px]">{po.createdAt}</td>
                          <td className="p-3 text-center">
                            {po.paymentStatus === '待支付' && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handlePayProcurementOrder(po.id)}
                                  className="bg-[#07C2E3] hover:bg-[#06B2D0] hover:text-white text-white py-1 px-2 rounded-md font-bold text-[10px] transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 shadow-sm"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>支付</span>
                                </button>
                                <button
                                  onClick={() => handleCancelProcurementOrder(po.id)}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 py-1 px-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer"
                                >
                                  撤回
                                </button>
                              </div>
                            )}

                            {po.paymentStatus === '已支付' && po.shippingStatus === '待发货' && (
                              <button
                                onClick={() => handleShipProcurementOrder(po.id)}
                                className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-md font-bold text-[10px] transition-all active:scale-95 cursor-pointer shadow-sm"
                              >
                                工厂发货
                              </button>
                            )}

                            {po.paymentStatus === '已支付' && po.shippingStatus === '已发货' && (
                              <button
                                onClick={() => handleReceiveProcurementOrder(po.id)}
                                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white py-1 px-2 rounded-md font-bold text-[10px] transition-all active:scale-95 cursor-pointer shadow-sm animate-pulse"
                              >
                                确认收货
                              </button>
                            )}

                            {po.paymentStatus === '已支付' && po.shippingStatus === '已收货' && (
                              <button
                                onClick={() => handleWarehouseProcurementOrder(po.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-2 rounded-md font-bold text-[10px] transition-all active:scale-95 cursor-pointer shadow-sm"
                              >
                                确认入库
                              </button>
                            )}

                            {po.paymentStatus === '已支付' && po.shippingStatus === '已完成' && (
                              <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                已入库
                              </span>
                            )}

                            {po.paymentStatus === '已取消' && (
                              <span className="text-slate-400 text-[10px] font-bold">已撤回</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                        当前供应链采购看板中无活动单据。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* 新建/修改 SKU 弹性表单 Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveProduct} 
            className="bg-white border border-slate-150 rounded-xl max-w-md w-full shadow-22xl p-5 relative animate-fadeIn space-y-4"
          >
            <button 
              type="button"
              onClick={() => setShowProductModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 text-sm">
              <span className="text-[#07C2E3]">●</span>
              <span>{showProductModal === 'create' ? '新建上架商品规格' : '更新 SKU 属性库配置'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* 商品名称 */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold">商品品类名/全称 *</label>
                <input 
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 专业机械人体工学键盘"
                  className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                />
              </div>

              {/* SKU & 售价 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">SKU 代码 *</label>
                  <input 
                    type="text"
                    required
                    disabled={showProductModal === 'edit'}
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU-XXXX"
                    className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 font-mono disabled:bg-slate-100/80 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">售价 (美元USD) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="99.00"
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
              </div>

              {/* 库存 & 临界点 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">上架物理库存数</label>
                  <input 
                    type="number"
                    required
                    value={editingProduct.stock === undefined ? 50 : editingProduct.stock}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">安全库存 *</label>
                  <input 
                    type="number"
                    required
                    value={editingProduct.minStockThreshold === undefined ? 10 : editingProduct.minStockThreshold}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, minStockThreshold: Number(e.target.value) }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
              </div>

              {/* 品类选择 & 品牌厂商 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">指派品类目</label>
                  <select 
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  >
                    {categories.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">合作关联品牌</label>
                  <select 
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, brand: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  >
                    {brands.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-50 pt-4">
              <button 
                type="button"
                onClick={() => setShowProductModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3.5 rounded-lg font-bold text-xs"
              >
                取消
              </button>
              <button 
                type="submit"
                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white py-1.5 px-4 rounded-lg font-bold text-xs shadow-sm"
              >
                确认提交
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 工厂采购合同发起 Modal */}
      {showProcurementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleCreateProcurementOrder} 
            className="bg-white border border-slate-150 rounded-xl max-w-md w-full shadow-22xl p-5 relative space-y-4 text-left"
          >
            <button 
              type="button"
              onClick={() => {
                setShowProcurementModal(false);
                setIsBulkProcurement(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 text-sm text-slate-800">
              <Warehouse className="w-4 h-4 text-[#07C2E3]" />
              <span>{isBulkProcurement ? '批量多款商品开立采办单' : '安排原厂外采办补货单'}</span>
            </h3>

            <div className="bg-sky-50 rounded-xl p-3 border border-sky-100/70 text-slate-700 text-xs leading-relaxed">
              <p className="font-bold text-[#07C2E3] mb-1">多级物理供应链机制：</p>
              <p>向上游采购原料的价格约低于零售售价的 55%（出厂成本价）。新建采购单后自动进入 <b>[创建待支付 ➔ 付款结算 ➔ 厂家发货 ➔ 确认签收 ➔ 确认入库]</b> 真实作业流水线。</p>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* 选择拟采购商品 */}
              {isBulkProcurement ? (
                <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-150">
                  <span className="text-slate-500 font-bold block mb-1">拟采购货品品目:</span>
                  <span className="text-slate-900 font-bold font-sans">
                    已合并选定 {selectedProductIds.length} 款货品，将为每单指派独立采办单编码。
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">目标采购商品 *</label>
                  <select 
                    value={newPO.productId}
                    onChange={(e) => handlePOProductChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-bold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 拟进货数量与协议成本 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">{isBulkProcurement ? '单款采购数量 (件) *' : '采购数量 (件) *'}</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={newPO.qty}
                    onChange={(e) => setNewPO(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
                
                {!isBulkProcurement ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-bold">协议出厂成本单价 (USD) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={newPO.unitCost}
                      onChange={(e) => setNewPO(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                      className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-bold">采购成本契约公式</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 font-mono text-[10px] text-slate-500 select-none">
                      按零售对价 * 45% 出口
                    </div>
                  </div>
                )}
              </div>

              {/* 供应商及预计到货时间 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">供应商名称 *</label>
                  <input 
                    type="text"
                    required
                    value={newPO.supplier}
                    onChange={(e) => setNewPO(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="例如: 智能制造超级工厂"
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">预计到货时间 *</label>
                  <input 
                    type="date"
                    required
                    value={newPO.estimatedDelivery}
                    onChange={(e) => setNewPO(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                  />
                </div>
              </div>

              {/* 估算总支出 */}
              {!isBulkProcurement && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold font-sans">应结预算总额:</span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    ${(Number(newPO.qty || 0) * Number(newPO.unitCost || 0)).toFixed(2)} USD
                  </span>
                </div>
              )}

            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-50 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setShowProcurementModal(false);
                  setIsBulkProcurement(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg font-bold text-xs"
              >
                取消
              </button>
              <button 
                type="submit"
                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white py-1.5 px-4 rounded-lg font-bold text-xs shadow-sm"
              >
                确认开立采购
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: 礼品卡管理专区 */}
      {activeSubTab === 'gift_cards' && (
        <div className="space-y-4">
          
          {/* 礼品卡大盘简报 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase block">发行卡券总面额</span>
              <strong className="text-xl font-black font-mono text-slate-800 mt-1 block">
                €{giftCards.reduce((acc, g) => acc + g.initialValue, 0).toLocaleString()} EUR
              </strong>
              <span className="text-[9px] text-slate-400 block mt-1">品牌资金沉淀总规模</span>
            </div>
            <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase block">卡内锁定未消费余额</span>
              <strong className="text-xl font-black font-mono text-[#07C2E3] mt-1 block">
                €{giftCards.reduce((acc, g) => acc + g.remainingBalance, 0).toLocaleString()} EUR
              </strong>
              <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                消费率: {((1 - giftCards.reduce((acc, g) => acc + g.remainingBalance, 0) / Math.max(1, giftCards.reduce((acc, g) => acc + g.initialValue, 0))) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase block">已激活总卡片笔数</span>
              <strong className="text-xl font-black font-mono text-slate-800 mt-1 block">
                {giftCards.length} 张
              </strong>
              <span className="text-[9px] text-slate-400 block mt-1">支持全渠道线上快速销账抵扣</span>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/15">
              <div>
                <h3 className="font-bold text-slate-800 text-xs">已发行独立站礼品卡列表</h3>
                <p className="text-[9px] text-[#07C2E3] font-mono font-bold">GIFT CARDS REGISTRY</p>
              </div>
              <button
                onClick={() => setShowCreateGiftCardModal(true)}
                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer h-7"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>一键发放礼品卡</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none h-10">
                    <th className="p-3 pl-5">礼品卡唯一凭证代码</th>
                    <th className="p-3 text-center">发行日期</th>
                    <th className="p-3 text-right">首发初始面额 (EUR)</th>
                    <th className="p-3 text-right">卡内当前余额 (EUR)</th>
                    <th className="p-3 text-center">失效截止日期</th>
                    <th className="p-3 text-center">当前销账状态</th>
                    <th className="p-3 text-right pr-5">管理行动</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {giftCards.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/50 border-b border-slate-100 h-12">
                      <td className="p-3 pl-5">
                        <span className="font-mono font-black text-[#07C2E3] bg-[#e6fafc]/60 border border-[#07C2E3]/20 px-2 py-0.5 rounded text-[11px]">
                          {g.code}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{g.createdAt}</td>
                      <td className="p-3 text-right font-mono text-slate-700 font-bold">€{g.initialValue.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-slate-900 font-extrabold">€{g.remainingBalance.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono text-slate-400 text-[10px]">{g.expiryDate}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          g.status === 'active' && g.remainingBalance > 0
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-150'
                            : g.status === 'expired' || g.remainingBalance === 0
                              ? 'bg-slate-50 text-slate-400 border-slate-150'
                              : 'bg-rose-50 text-rose-500 border-rose-150'
                        }`}>
                          {g.remainingBalance === 0 ? '已余额归零' : g.status === 'active' ? '正常可核销' : g.status === 'expired' ? '过期失效' : '冻结停用'}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5">
                        <button
                          onClick={() => handleToggleGiftCardStatus(g.id)}
                          disabled={g.remainingBalance === 0}
                          className={`py-0.5 px-2 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                            g.status === 'active'
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {g.status === 'active' ? '禁用' : '激活'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Issuing Gift Card Modal */}
      {showCreateGiftCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn select-none">
          <form 
            onSubmit={handleCreateGiftCard}
            className="bg-white border border-slate-150 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-xs text-left"
          >
            <div className="flex border-b border-slate-100 pb-3 justify-between items-center bg-transparent">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">发行数字礼品卡</h3>
                <span className="text-[9px] text-[#07C2E3] font-bold font-mono">NEW GIFT CARD</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateGiftCardModal(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-1 bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 pt-2 font-sans font-medium text-slate-700">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-500 font-bold">卡券面值 (EUR) *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={newGCValue}
                  onChange={(e) => setNewGCValue(Number(e.target.value))}
                  className="bg-white border border-slate-250 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-500 font-bold">自定卡号代码 (预填自动生成随机码)</label>
                <input 
                  type="text"
                  value={newGCCode}
                  onChange={(e) => setNewGCCode(e.target.value)}
                  placeholder="例如: VALENTINE-AURA-50"
                  className="bg-white border border-slate-250 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3] font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-500 font-bold">失效到期时间 *</label>
                <input 
                  type="date"
                  required
                  value={newGCExpiry}
                  onChange={(e) => setNewGCExpiry(e.target.value)}
                  className="bg-white border border-slate-250 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#07C2E3]"
                />
              </div>

            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4 bg-transparent">
              <button 
                type="button"
                onClick={() => setShowCreateGiftCardModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg font-bold text-xs"
              >
                要不等等
              </button>
              <button 
                type="submit"
                className="bg-[#07C2E3] hover:bg-[#06B2D0] text-white py-1.5 px-4 rounded-lg font-bold text-xs shadow-sm"
              >
                发行卡片
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
