import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FormPrompt from './components/FormPrompt'
import Catalog from './pages/catalog'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import AdminLayout from './pages/AdminLayout'
import AdminOrders from './pages/AdminOrders'
import AdminOrder from './pages/AdminOrder'

import AdminProducts from './pages/AdminProducts'
import AdminProductForm from './pages/AdminProductForm'
import AdminCategories from './pages/AdminCategories'
import AdminCustomers from './pages/AdminCustomers'
import AdminCustomer from './pages/AdminCustomer'
import AdminComments from './pages/AdminComments'
import AdminForms from './pages/AdminForms'
import AdminFormEditor from './pages/AdminFormEditor'
import AdminFormResults from './pages/AdminFormResults'
import AdminStock from './pages/AdminStock'
import AdminSettings from './pages/AdminSettings'
import AdminAccounting from './pages/AdminAccounting'

export default function App() {
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <div className="app">
      {!isAdmin && <Navbar />}
      {!isAdmin && <FormPrompt />}
      <main className={isAdmin ? '' : 'main'}>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/produit/:id" element={<ProductDetail />} />
          <Route path="/panier" element={<Cart />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOrders />} />
            <Route path="commande/:id" element={<AdminOrder />} />
            
            <Route path="produits" element={<AdminProducts />} />
            <Route path="produits/nouveau" element={<AdminProductForm />} />
            <Route path="produits/:id/modifier" element={<AdminProductForm />} />
            <Route path="rubriques" element={<AdminCategories />} />
            <Route path="apparence" element={<AdminSettings />} />
            <Route path="clients" element={<AdminCustomers />} />
            <Route path="clients/:key" element={<AdminCustomer />} />
            <Route path="avis" element={<AdminComments />} />
            <Route path="formulaires" element={<AdminForms />} />
            <Route path="formulaires/nouveau" element={<AdminFormEditor />} />
            <Route path="formulaires/:id/modifier" element={<AdminFormEditor />} />
            <Route path="formulaires/:id/resultats" element={<AdminFormResults />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="comptabilite" element={<AdminAccounting />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  )
}