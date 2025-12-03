import React, { useState } from 'react';
import ProductListView from './components/ProductListView';
import ProductForm from './components/ProductForm';
import CatalogueView from './components/CatalogueView';
import CatalogueEntryForm from './components/CatalogueEntryForm';
import ImportDocumentModal from './components/ImportDocumentModal';
import ManualMatchModal from './components/ManualMatchModal';
import ExportToolModal from './components/ExportToolModal';
import AuditTrailModal from './components/AuditTrailModal';
import { ViewState, ModalState, Product, CatalogueEntry, ProductSpec, TestItem } from './types';
import { DUMMY_CATALOGUE } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('PRODUCT_LIST');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [selectedCatalogueEntry, setSelectedCatalogueEntry] = useState<CatalogueEntry | undefined>(undefined);
  
  // State to hold imported spec data temporarily
  const [importedSpec, setImportedSpec] = useState<ProductSpec | undefined>(undefined);

  const [modals, setModals] = useState<ModalState>({
    importDoc: false,
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

  const handleImport = (spec: ProductSpec) => {
    // Transform parsed spec to Product
    const newProduct: Product = {
      id: 'draft-' + Date.now(),
      productCode: spec.productCode,
      productName: spec.productName,
      version: spec.version,
      materialType: spec.materialType,
      effectiveDate: spec.effectiveDate
    };
    
    // Set both the product header and the imported tests
    setSelectedProduct(newProduct);
    setImportedSpec(spec);
    
    setView('PRODUCT_FORM');
    // If we want to audit this action:
    console.log("Audit: IMPORT_DOC", spec);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="text-xl font-bold tracking-tight text-white">LIMS Spec Builder</span>
          </div>
          
          <div className="flex space-x-1">
            <button 
              onClick={goProductList}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view.startsWith('PRODUCT') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              Products
            </button>
            <button 
              onClick={goCatalogueList}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view.startsWith('CATALOGUE') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              Catalogue
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {/* Utility Icons */}
           <button onClick={() => toggleModal('exportTool', true)} className="text-gray-400 hover:text-green-400 transition-colors" title="Export Data">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </button>
           <button onClick={() => toggleModal('auditTrail', true)} className="text-gray-400 hover:text-yellow-400 transition-colors" title="Audit Logs">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </button>
           
           <div className="w-px h-6 bg-gray-700 mx-2"></div>
           
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">JD</div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-[1920px] mx-auto w-full">
        {view === 'PRODUCT_LIST' && (
          <ProductListView 
            onCreateProduct={goProductCreate} 
            onEditProduct={goProductEdit} 
          />
        )}
        
        {view === 'PRODUCT_FORM' && (
          <ProductForm 
            key={selectedProduct ? selectedProduct.id : 'new'} // Force remount on import
            product={selectedProduct} 
            initialTests={importedSpec?.tests}
            onSave={goProductList} 
            onCancel={goProductList}
            onImportClick={() => toggleModal('importDoc', true)}
          />
        )}

        {view === 'CATALOGUE_LIST' && (
          <CatalogueView 
            onCreate={goCatalogueCreate}
            onEdit={goCatalogueEdit}
          />
        )}

        {view === 'CATALOGUE_FORM' && (
          <CatalogueEntryForm 
            entry={selectedCatalogueEntry}
            onSave={goCatalogueList}
            onCancel={goCatalogueList}
          />
        )}
      </main>

      {/* Modals */}
      <ImportDocumentModal 
        isOpen={modals.importDoc} 
        onClose={() => toggleModal('importDoc', false)}
        onImport={handleImport}
        catalogue={DUMMY_CATALOGUE}
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