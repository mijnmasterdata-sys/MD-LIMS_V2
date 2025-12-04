import React, { useState, useEffect } from 'react';
import ProductListView from './components/ProductListView';
import ProductForm from './components/ProductForm';
import CatalogueView from './components/CatalogueView';
import CatalogueEntryForm from './components/CatalogueEntryForm';
import TemplateListView from './components/TemplateListView';
import TemplateForm from './components/TemplateForm';
import ImportDocumentModal from './components/ImportDocumentModal';
import MassImportModal from './components/MassImportModal';
import ManualMatchModal from './components/ManualMatchModal';
import ExportToolModal from './components/ExportToolModal';
import AuditTrailModal from './components/AuditTrailModal';
import ThemeToggle from './components/ThemeToggle';
import { ViewState, ModalState, Product, CatalogueEntry, ProductSpec, TestItem, ParsingTemplate } from './types';
import { DUMMY_CATALOGUE, DUMMY_PRODUCTS, DUMMY_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('PRODUCT_LIST');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [selectedCatalogueEntry, setSelectedCatalogueEntry] = useState<CatalogueEntry | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<ParsingTemplate | undefined>(undefined);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('LIMS_THEME');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'dark';
  });

  // Effect to apply theme class and save to local storage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('LIMS_THEME', theme);
  }, [theme]);
  
  // Lifted Catalogue State with Persistence
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>(() => {
    const saved = localStorage.getItem('LIMS_CATALOGUE');
    return saved ? JSON.parse(saved) : DUMMY_CATALOGUE;
  });

  // Lifted Product State with Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('LIMS_PRODUCTS');
    return saved ? JSON.parse(saved) : DUMMY_PRODUCTS;
  });

  // Lifted Template State with Persistence
  const [templates, setTemplates] = useState<ParsingTemplate[]>(() => {
    const saved = localStorage.getItem('LIMS_TEMPLATES');
    return saved ? JSON.parse(saved) : DUMMY_TEMPLATES;
  });

  // Persist catalogue changes
  useEffect(() => {
    localStorage.setItem('LIMS_CATALOGUE', JSON.stringify(catalogue));
  }, [catalogue]);

  // Persist product changes
  useEffect(() => {
    localStorage.setItem('LIMS_PRODUCTS', JSON.stringify(products));
  }, [products]);

  // Persist template changes
  useEffect(() => {
    localStorage.setItem('LIMS_TEMPLATES', JSON.stringify(templates));
  }, [templates]);
  
  // State to hold imported spec data temporarily
  const [importedSpec, setImportedSpec] = useState<ProductSpec | undefined>(undefined);

  const [modals, setModals] = useState<ModalState>({
    importDoc: false,
    massImport: false,
    manualMatch: false,
    exportTool: false,
    auditTrail: false,
  });

  const toggleModal = (key: keyof ModalState, value: boolean) => {
    setModals(prev => ({ ...prev, [key]: value }));
  };

  // View Navigation Helpers
  const goProductList = () => { setSelectedProduct(undefined); setImportedSpec(undefined); setView('PRODUCT_LIST'); };
  const goProductCreate = () => { setSelectedProduct(undefined); setImportedSpec(undefined); setView('PRODUCT_FORM'); };
  const goProductEdit = (p: Product) => { setSelectedProduct(p); setImportedSpec(undefined); setView('PRODUCT_FORM'); };
  
  const goCatalogueList = () => { setSelectedCatalogueEntry(undefined); setView('CATALOGUE_LIST'); };
  const goCatalogueCreate = () => { setSelectedCatalogueEntry(undefined); setView('CATALOGUE_FORM'); };
  const goCatalogueEdit = (c: CatalogueEntry) => { setSelectedCatalogueEntry(c); setView('CATALOGUE_FORM'); };

  const goTemplateList = () => { setSelectedTemplate(undefined); setView('TEMPLATE_LIST'); };
  const goTemplateCreate = () => { setSelectedTemplate(undefined); setView('TEMPLATE_FORM'); };
  const goTemplateEdit = (t: ParsingTemplate) => { setSelectedTemplate(t); setView('TEMPLATE_FORM'); };

  // Catalogue CRUD Actions
  const handleSaveCatalogueEntry = (entry: CatalogueEntry) => {
    let updatedCatalogue = [...catalogue];
    
    if (entry.id) {
      const index = updatedCatalogue.findIndex(e => e.id === entry.id);
      if (index !== -1) updatedCatalogue[index] = entry;
      else updatedCatalogue.push(entry);
    } else {
      updatedCatalogue.push({ ...entry, id: `cat-${Date.now()}` });
    }
    setCatalogue(updatedCatalogue);
    goCatalogueList();
  };

  const handleDeleteCatalogueEntry = (id: string) => {
    if (window.confirm("Are you sure you want to delete this catalogue entry?")) {
      setCatalogue(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleDeleteAllCatalogueEntries = () => {
    if (window.confirm("WARNING: Are you sure you want to delete ALL catalogue entries?")) {
      setCatalogue([]);
    }
  };

  // Template CRUD Actions
  const handleSaveTemplate = (template: ParsingTemplate) => {
    let updatedTemplates = [...templates];
    if (template.id) {
      const index = updatedTemplates.findIndex(t => t.id === template.id);
      if (index !== -1) updatedTemplates[index] = template;
      else updatedTemplates.push(template);
    } else {
      updatedTemplates.push({ ...template, id: `tmpl-${Date.now()}` });
    }
    setTemplates(updatedTemplates);
    goTemplateList();
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Delete this template?")) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  // Product CRUD Actions
  const handleSaveProduct = (product: Product, tests: TestItem[]) => {
    const fullProduct = { ...product, tests };
    
    let updatedProducts = [...products];
    if (product.id && !product.id.startsWith('draft-')) {
       const index = updatedProducts.findIndex(p => p.id === product.id);
       if (index !== -1) {
         updatedProducts[index] = fullProduct;
       } else {
         // Fallback: add as new if ID not found for some reason
         updatedProducts.push({ ...fullProduct, id: `prod-${Date.now()}` });
       }
    } else {
      // Handles new products (id: '') and imported products (id: 'draft-...')
      updatedProducts.push({ ...fullProduct, id: `prod-${Date.now()}` });
    }
    setProducts(updatedProducts);
    goProductList();
  };

  const handleSaveMassImport = (newProducts: Product[]) => {
    setProducts(prev => [...prev, ...newProducts]);
    // Optionally, could navigate to product list or just close modal
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleImport = (spec: ProductSpec) => {
    const newProduct: Product = {
      id: 'draft-' + Date.now(),
      productCode: spec.productCode,
      productName: spec.productName,
      version: spec.version,
      materialType: spec.materialType,
      effectiveDate: spec.effectiveDate,
      packDescription: spec.packDescription,
    };
    setSelectedProduct(newProduct);
    setImportedSpec(spec);
    setView('PRODUCT_FORM');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">LIMS Spec Builder</span>
          </div>
          
          <div className="flex space-x-1">
            <button onClick={goProductList} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view.startsWith('PRODUCT') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>Products</button>
            <button onClick={goCatalogueList} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view.startsWith('CATALOGUE') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>Catalogue</button>
            <button onClick={goTemplateList} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view.startsWith('TEMPLATE') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>Templates</button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <ThemeToggle theme={theme} setTheme={setTheme} />
           <button onClick={() => toggleModal('exportTool', true)} className="text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors" title="Export Data">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </button>
           <button onClick={() => toggleModal('auditTrail', true)} className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors" title="Audit Logs">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </button>
           <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">JD</div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-[1920px] mx-auto w-full">
        {view === 'PRODUCT_LIST' && (
          <ProductListView 
            products={products}
            onCreateProduct={goProductCreate} 
            onEditProduct={goProductEdit} 
            onDeleteProduct={handleDeleteProduct}
            onMassImportClick={() => toggleModal('massImport', true)}
          />
        )}
        
        {view === 'PRODUCT_FORM' && (
          <ProductForm 
            key={selectedProduct ? selectedProduct.id : 'new'}
            product={selectedProduct} 
            initialTests={importedSpec?.tests}
            catalogue={catalogue}
            onSave={handleSaveProduct} 
            onCancel={goProductList}
            onImportClick={() => toggleModal('importDoc', true)}
          />
        )}

        {view === 'CATALOGUE_LIST' && (
          <CatalogueView 
            entries={catalogue}
            onUpdateEntries={setCatalogue}
            onCreate={goCatalogueCreate}
            onEdit={goCatalogueEdit}
            onDelete={handleDeleteCatalogueEntry}
            onDeleteAll={handleDeleteAllCatalogueEntries}
          />
        )}

        {view === 'CATALOGUE_FORM' && (
          <CatalogueEntryForm 
            entry={selectedCatalogueEntry}
            onSave={handleSaveCatalogueEntry}
            onCancel={goCatalogueList}
          />
        )}

        {view === 'TEMPLATE_LIST' && (
          <TemplateListView
            templates={templates}
            onCreate={goTemplateCreate}
            onEdit={goTemplateEdit}
            onDelete={handleDeleteTemplate}
          />
        )}

        {view === 'TEMPLATE_FORM' && (
          <TemplateForm
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={goTemplateList}
          />
        )}
      </main>

      {/* Modals */}
      <ImportDocumentModal 
        isOpen={modals.importDoc} 
        onClose={() => toggleModal('importDoc', false)}
        onImport={handleImport}
        catalogue={catalogue}
        templates={templates}
      />

      <MassImportModal
        isOpen={modals.massImport}
        onClose={() => toggleModal('massImport', false)}
        onSave={handleSaveMassImport}
        catalogue={catalogue}
        templates={templates}
      />

      <ManualMatchModal 
        isOpen={modals.manualMatch} 
        onClose={() => toggleModal('manualMatch', false)}
        onConfirm={() => toggleModal('manualMatch', false)}
      />

      <ExportToolModal 
        isOpen={modals.exportTool} 
        onClose={() => toggleModal('exportTool', false)}
      />

      <AuditTrailModal 
        isOpen={modals.auditTrail} 
        onClose={() => toggleModal('auditTrail', false)}
      />
      
    </div>
  );
};

export default App;